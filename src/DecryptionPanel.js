import React, { useState }  from 'react';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import LockOpenTwoToneIcon from '@material-ui/icons/LockOpenTwoTone';
import FolderOpenTwoToneIcon from '@material-ui/icons/FolderOpenTwoTone';
import { makeStyles } from '@material-ui/core/styles';
import { readFileAsBuffer } from './util';
import FilePreview from './FilePreview';
const crypto = window.crypto.subtle;

const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: 'none',
  },
}));

function DecryptionPanel() {
  const [file, setFile] = useState({name: 'none'});
  const [warn, setWarn] = useState('');
  const [preview, setPreview] = useState({});
  const classes = useStyles();

  const onChangeFile = (e) => setFile(e.target.files[0]);

  const handleWarnClose = (event, reason) => {
    if (reason !== 'clickaway') setWarn('');
  };

  const onDecryptFile = () => {
    readFileAsBuffer(file).then((d) => {
        const data = new Uint8Array(d);
        const meta = JSON.parse(new TextDecoder('utf-8').decode(data.slice(0,data.indexOf(10)))); // parse content until \n (10) as metadata
        const timediff = new Date(meta.secret.timestamp) - new Date();
        if (timediff > 0) {
            setWarn(`Time is not up yet! Please wait ${timediff}ms until you try again!`);
            return Promise.reject(new Error('Time not up!'));
        }
        // console.log('meta: ', meta);
        return Promise.all([ // query webservice to decrypt key for the used timestamo (if in the past)
            fetch('/.netlify/functions/decryptkey', {method: 'POST', body: JSON.stringify(meta.secret)}).then(res => {
                switch (res.status) {
                    case 200: return res.json();
                    case 403: const e1 = 'Server rejected decryption: Time is not up yet!'; setWarn(e1); return Promise.reject(e1);
                    case 400: const e2 = 'Server decryption failed: Invalid authTag! Did you try to mess with the timestamp? Your original timestamp might be ' +
                                         `${atob(meta.verify || '')} but don't mess with the file again or it will be unrecoverable damaged!`; setWarn(e2); return Promise.reject(e2);
                    default: const e3 = 'Unknown Server error!'; setWarn(e3); return Promise.reject(e3);
                }
            }).then((res) => {
                // console.log('res: ', res); // imports the decryption key recieved from the webservice
                return crypto.importKey("jwk", {kty: "oct", k: res.key, alg: "A256GCM", ext: true}, {name: "AES-GCM"}, false, ["decrypt"]);
            }),
            data.slice(data.indexOf(10) + 1), // strips off metadata to only get the encrypted file content
            new Uint8Array(meta.iv.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))), // convert iv from hex string to ArrayBuffer
            new Uint8Array(meta.auth.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))), // convert authTag from hex to ArrayBuffer
            meta.filename,
            meta.mimeType
        ]);
    }).then(([key, data, iv, auth, filename, mimeType]) => {
        // console.log('key: ', key, 'data: ', data, 'iv: ', iv, 'auth: ', auth);
        return Promise.all([
            crypto.decrypt({name: "AES-GCM", iv, additionalData: auth, tagLength: 128}, key, data).catch((e) => {
                const s = 'Decryption failed because of curruped data (authTag invalid)! Did you modified the encryped file?';
                setWarn(s);
                return Promise.reject(s);
            }),
            filename || 'encryptedFile',
            mimeType || 'application/octet-binary'
        ]);
    }).then(([data, filename, mimeType]) => {
        // console.log('data: ', data, 'filename: ', filename, 'mimeType: ', mimeType);
        const href = URL.createObjectURL(new Blob([data], {type: mimeType})); // create File
        setPreview({src: mimeType.split('/')[0] === 'text' ? new TextDecoder().decode(data) : href, mimeType, filename});
        const a = document.createElement('a'); // offer file downloading by clicking on the link
        a.setAttribute('download', filename);
        a.setAttribute('href', href);
        a.click();
    }).catch(err => console.error(err));
  };

  return (
    <div>
      <p> {file.name}
        <input
          className={classes.input}
          id="decFileButton"
          type="file"
          onChange={onChangeFile}
        />
        <label htmlFor="decFileButton">
          <Button variant="contained" color="secondary" component="span" startIcon={<FolderOpenTwoToneIcon />}>
            Select File for decryption
          </Button>
        </label>
      </p>
      <Button variant="contained" color="primary" onClick={onDecryptFile} startIcon={<LockOpenTwoToneIcon />}>
        Decrypt file...
      </Button>
      <FilePreview src={preview.src} mimeType={preview.mimeType} filename={preview.filename} />
      <Snackbar open={warn !== ''} onClose={handleWarnClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" onClose={handleWarnClose} severity="error">
          {warn}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}

export default DecryptionPanel;
