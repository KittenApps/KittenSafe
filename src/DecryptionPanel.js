import React, { useState, useRef }  from 'react';
import Button from '@material-ui/core/Button';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import LockOpenTwoToneIcon from '@material-ui/icons/LockOpenTwoTone';
import FolderOpenTwoToneIcon from '@material-ui/icons/FolderOpenTwoTone';
import { makeStyles } from '@material-ui/core/styles';
import { readFileAsBuffer } from './util';
import { green } from '@material-ui/core/colors';
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

function FilePanel(props) {
  const [timerRedraw, setTimerRedraw] = useState(true);

  if (!props.file.meta) {
    switch (props.file.name) {
      case 'none': return <Card variant="outlined"><CardHeader title="No file selected" subheader="Please choose a valid KittenSafe file for decryption!" /></Card>;
      case 'invalid': return <Card variant="outlined"><CardHeader title="Invalid KittenSafe file" subheader="Please choose a valid and non corrupted KittenSafe file for decryption!" /></Card>;
      default: return <Card variant="outlined"><CardHeader title="Unknown File error" /></Card>;
    }
  }

  let content;
  const td = new Date(props.file.meta.secret.timestamp) - new Date();
  if (td > 0) {
    content = (
      <div>
        <p>Error: KittenSafe file not ready for decryption:</p>
        <p>
          <b>{Math.floor(td / (1000 * 60 * 60 * 24))}</b>
          days <b>{Math.floor((td / (1000 * 60 * 60)) % 24)}</b>
          hours <b>{Math.floor((td / 1000 / 60) % 60)}</b>
          mins <b>{Math.floor((td / 1000) % 60)}</b>secs left
        </p>
      </div>
    );
    setTimeout(() => {
      setTimerRedraw(!timerRedraw);
    }, 1000);
  } else {
    props.setTimeReady(true);
    content = <p>Success: KittenSafe file ready for decryption</p>;
  }

  return (
    <Card variant="outlined">
      <CardHeader title={props.file.meta.filename} subheader={`${props.file.meta.mimeType} (${Math.round(props.file.size/1000)/1000}MB)`} />
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

function DecryptionPanel() {
  const [file, setFile] = useState({name: 'none'});
  const [warn, setWarn] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [preview, setPreview] = useState({});
  const [timeReady, setTimeReady] = useState(false);
  const [decFile, setDecFile] = useState(null);
  const [disabledReset, setDisabledReset] = useState(true);
  const [fakeProgress, setFakeProgress] = useState(0);
  const intervalRef = useRef();
  if (fakeProgress > 3) clearInterval(intervalRef.current);
  const classes = useStyles();

  const handleReset = () => {
    setFile({name: 'none'});
    setWarn('');
    setActiveStep(0);
    setPreview({});
    setTimeReady(false);
    setDecFile(null);
    setDisabledReset(true);
    setFakeProgress(0);
  };

  const onChangeFile = (e) => {
    let f = e.target.files[0];
    if (!f) {setTimeReady(false); return setFile({name: 'none'});}
    setFile({...f});
    readFileAsBuffer(f).then((d) => {
      const data = new Uint8Array(d);
      const meta = JSON.parse(new TextDecoder('utf-8').decode(data.slice(0,data.indexOf(10)))); // parse content until \n (10) as metadata
      // console.log('meta: ', meta);
      f.data = data;
      f.meta = meta;
      setTimeReady(new Date(meta.secret.timestamp) < new Date());
      setFile(f);
    }).catch(err => {
      setFile({name: 'invalid'});
      console.error(err);
    });
  };

  const handleWarnClose = (event, reason) => {
    if (reason !== 'clickaway') setWarn('');
  };

  const handlePrev = () => {
    setActiveStep(2);
    setDisabledReset(false);
  };

  const onDecryptFile = () => {
    const timediff = new Date(file.meta.secret.timestamp) - new Date();
    if (timediff > 0) {
      setWarn(`Time is not up yet! Please wait ${timediff}ms until you try again!`);
      return console.error(new Error('Time not up!'));
    }
    setActiveStep(1);
    setTimeout(() => {
      const iid = window.setInterval(() => {
        setFakeProgress((f) => f += 1);
      }, 300);
      intervalRef.current = iid;
    }, 500);
    Promise.all([ // query webservice to decrypt key for the used timestamo (if in the past)
      fetch('/.netlify/functions/decryptkey', {method: 'POST', body: JSON.stringify(file.meta.secret)}).then(res => {
        switch (res.status) {
          case 200: return res.json();
          case 403: const e1 = 'Server rejected decryption: Time is not up yet!'; setWarn(e1); return Promise.reject(e1);
          case 400: const e2 = 'Server decryption failed: Invalid authTag! Did you try to mess with the timestamp? Your original timestamp might be ' +
                               `${atob(file.meta.verify || '')} but don't mess with the file again or it will be unrecoverable damaged!`; setWarn(e2); return Promise.reject(e2);
          default: const e3 = 'Unknown Server error!'; setWarn(e3); return Promise.reject(e3);
        }
      }).then((res) => {
        // console.log('res: ', res); // imports the decryption key recieved from the webservice
        return crypto.importKey("jwk", {kty: "oct", k: res.key, alg: "A256GCM", ext: true}, {name: "AES-GCM"}, false, ["decrypt"]);
      }),
      file.data.slice(file.data.indexOf(10) + 1), // strips off metadata to only get the encrypted file content
      new Uint8Array(file.meta.iv.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))), // convert iv from hex string to ArrayBuffer
      new Uint8Array(file.meta.auth.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))), // convert authTag from hex to ArrayBuffer
      file.meta.filename,
      file.meta.mimeType
    ]).then(([key, data, iv, auth, filename, mimeType]) => {
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
      const b = new Blob([data]);
      setPreview({src: mimeType.split('/')[0] === 'text' ? new TextDecoder().decode(data) : URL.createObjectURL(b, {type: mimeType}), mimeType, filename});
      setDecFile({b, mimeType, filename});
    }).catch(err => console.error(err));
  };

  const handleSave = () => {
    const href = URL.createObjectURL(decFile.b, {type: decFile.mimeType}); // create File
    const a = document.createElement('a'); // offer file downloading by clicking on the link
    a.setAttribute('download', decFile.filename);
    a.setAttribute('href', href);
    a.click();
    setDisabledReset(false);
  };

  const catimation = [
    ['', '', '🔒', '🔑', '🐈'],
    ['', '', '🔐', '🐈', ''],
    ['', '🐈', '🔓', '', ''],
    ['🐈', '', '🔓', '', ''],
    ['😺', '', '🔓', '', '😺']
  ]

  return (
    <div>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="fileSelect">
          <StepLabel>Select the encrypted file for decryption</StepLabel>
          <StepContent>
            <input className={classes.input} id="decFileButton" type="file" onChange={onChangeFile}/>
            <label htmlFor="decFileButton">
              <Button variant="contained" color="primary" component="span" startIcon={<FolderOpenTwoToneIcon />}>
                Choose file ...
              </Button>
            </label>
            <FilePanel file={file} setTimeReady={setTimeReady} />
            <Button disabled={true}>Back</Button>
            <Button variant="contained" color="primary" onClick={onDecryptFile} startIcon={<LockOpenTwoToneIcon />} disabled={!timeReady}>Decrypt file ...</Button>
          </StepContent>
        </Step>
        <Step key="Decryption">
          <StepLabel>Decrypting KittenSafe file</StepLabel>
          <StepContent>
            <Container maxWidth="sm">
              <Grid container spacing={3}>
                {[0, 1, 2, 3, 4].map(i => <Grid item xs={2} key={i} style={{fontSize: 32}}>{catimation[fakeProgress][i]}</Grid>)}
              </Grid>
            </Container>
            <List dense>
              {['reading encrypted file',
                'request decryped key',
                'importing decrypted key',
                'decrypting KittenSafe file',
              ].map((v, i) => (
                <ListItem key={i} dense>
                  <ListItemIcon>
                    {i < fakeProgress ? <CheckBoxTwoToneIcon style={{ color: green[800] }} /> : <CheckBoxOutlineBlankIcon /> }
                  </ListItemIcon>
                  <ListItemText primary={v} />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={!decFile}>Save original file...</Button>
            <Button variant="contained" color="secondary" onClick={handlePrev} disabled={!decFile}>Preview original file...</Button>
            <Button onClick={handleReset} disabled={disabledReset}>Reset</Button>
          </StepContent>
        </Step>
        <Step key="Preview">
          <StepLabel>Previewing decrypted media file</StepLabel>
          <StepContent>
            <FilePreview src={preview.src} mimeType={preview.mimeType} filename={preview.filename} />
            <Button variant="contained" color="primary" onClick={handleSave} disabled={!decFile}>Save original file...</Button>
            <Button onClick={handleReset} disabled={disabledReset}>Reset</Button>
          </StepContent>
        </Step>
      </Stepper>
      <Snackbar open={warn !== ''} onClose={handleWarnClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" onClose={handleWarnClose} severity="error">
          {warn}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
// <FilePreview src={preview.src} mimeType={preview.mimeType} filename={preview.filename} />
export default DecryptionPanel;
