import React, { useState }  from 'react';
import { DateTimePicker } from "@material-ui/pickers";
import Button from '@material-ui/core/Button';
import FolderOpenTwoToneIcon from '@material-ui/icons/FolderOpenTwoTone';
import LockTwoToneIcon from '@material-ui/icons/LockTwoTone';
import { makeStyles } from '@material-ui/core/styles';
import { readFileAsBuffer } from './util'
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

function EncryptionPanel() {
  const [timestamp, setTimestamp] = useState(new Date(new Date().getTime() + 60000));
  const [file, setFile] = useState({name: 'none'});
  const classes = useStyles();

  function onChangeFile(e){
    setFile(e.target.files[0]);
  }

  function onEncryptFile(){
    Promise.all([
        crypto.generateKey({name: 'AES-GCM', length: 256}, true, ['encrypt']), // generate random encryption key
        readFileAsBuffer(file) // read in file asArrayBuffer
    ]).then(([key, data]) => {
        const iv = window.crypto.getRandomValues(new Uint8Array(16)); // generate random initialisation vector
        const auth = window.crypto.getRandomValues(new Uint8Array(16)); // generate random authTag
        // console.log('key: ', key, 'data: ', data);
        return Promise.all([
            crypto.encrypt({name: 'AES-GCM', iv, additionalData: auth, tagLength: 128}, key, data), // encrypt file using key
            crypto.exportKey('jwk', key).then((expKey) => { // export the used kex in hey format
                const req = {key: expKey.k, timestamp: timestamp.toISOString()};
                // console.log('expKey: ', expKey, 'req: ', req); // query webservice to encrypt key given timestamp
                return fetch('/.netlify/functions/encryptkey', {method: 'POST', body: JSON.stringify(req)});
            }).then(res => res.json()), // get back the result from the webservice as JSON
            Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join(''), // convert iv to hex string
            Array.from(auth).map(b => b.toString(16).padStart(2, "0")).join('') // convert authTag to hex string
        ]);
    }).then(([data, secret, iv, auth]) => {
        // console.log('data: ', data, 'iv: ', iv, 'auth: ', auth, 'secret: ', secret);
        const meta = new TextEncoder('utf-8').encode(JSON.stringify({iv, auth, secret, filename: file.name, mimeType: file.type, verify: btoa(secret.timestamp)}) + '\n'); // encode meta data as ArrayBuffer
        const href = URL.createObjectURL(new Blob([meta, data], {type: 'application/octet-binary'})); // create File
        const a = document.createElement('a');
        a.setAttribute('download', file.name + '-' + secret.timestamp + '.ksf');
        a.setAttribute('href', href);
        a.click();
    }).catch(err => console.error(err));
  }

  return (
    <div>
      <DateTimePicker
        value={timestamp}
        onChange={setTimestamp}
        onError={console.log}
        disablePast
        format="yyyy/MM/dd HH:mm:ss.SSS"
      />
      <p> {file.name}
        <input
          className={classes.input}
          id="encFileButton"
          type="file"
          onChange={onChangeFile}
        />
        <label htmlFor="encFileButton">
          <Button variant="contained" color="secondary" component="span" startIcon={<FolderOpenTwoToneIcon />}>
            Select File for encryption
          </Button>
        </label>
      </p>
      <Button variant="contained" color="primary" onClick={onEncryptFile} startIcon={<LockTwoToneIcon />}>
        Encrypt file...
      </Button>
    </div>
  );
}

export default EncryptionPanel;
