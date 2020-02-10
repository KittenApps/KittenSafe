import React, { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { Button, Card, CardHeader, CardContent, Container, Grid, List, ListItem, ListItemIcon, ListItemText,
         Checkbox, FormControlLabel, Snackbar, Stepper, Step, StepLabel, StepContent, Backdrop, Box  } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { CheckBoxOutlineBlank, CheckBoxTwoTone, LockOpenTwoTone, FolderOpenTwoTone, TimerTwoTone } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import { useDropzone } from 'react-dropzone'
import { readFileAsBuffer, TimerContext } from './util';
import FilePreview, {isSupportedMimeType} from './FilePreview';

const crypto = window.crypto.subtle;

const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1)
    }
  },
  input: {
    display: 'none'
  }
}));

const FilePanelTimer = React.memo((props) => {
  // console.log("render DecryptionPanel FilePanel Timer");
  const now = useContext(TimerContext);
  const td = new Date(props.timestamp) - now;
  if (td <= 0){
    props.setReady(r => !r); //ToDo: rewrite this
    return <p><b>0</b>days <b>0</b>hours <b>00</b>mins <b>00</b>secs left</p>;
  }
  const d = Math.floor(td / (1000 * 60 * 60 * 24));
  const h = Math.floor((td / (1000 * 60 * 60)) % 24);
  const m = Math.floor((td / 1000 / 60) % 60);
  const s = Math.floor((td / 1000) % 60);

  return <p><b>{d}</b>days <b>{h}</b>hours <b>{m < 10 ? '0' + m : m}</b>mins <b>{s < 10 ? '0' + s : s}</b>secs left</p>;
});

const FilePanel = React.memo((props) => {
  const [, setReady] = useState(false); //ToDo: rewrite this
  // console.log("render DecryptionPanel FilePanel");

  if (!props.file.meta){
    switch (props.file.name){
      case 'none': return <Card variant="outlined"><CardHeader title="No file selected" subheader="Please choose a valid KittenSafe file for decryption!" /></Card>;
      case 'invalid': return <Card variant="outlined"><CardHeader title="Invalid KittenSafe file" subheader="Please choose a valid and non corrupted KittenSafe file for decryption!" /></Card>;
      default: return <Card variant="outlined"><CardHeader title="Unknown File error" /></Card>;
    }
  }

  const handleAddTimer = () => props.addTimers(props.file.meta.auth, {timestamp: props.file.meta.secret.timestamp, filename: props.file.meta.filename, mimeType: props.file.meta.mimeType}, false);
  const handleRmExpTimer = e => props.setRmExpTimer(e.target.checked);

  let content;

  if (new Date(props.file.meta.secret.timestamp) > new Date()){
    content = (
      <React.Fragment>
        <p>Error: KittenSafe file not ready for decryption:</p>
        <FilePanelTimer timestamp={props.file.meta.secret.timestamp} setReady={setReady} />
        {!props.timers.includes(props.file.meta.auth) && <p><Button variant="contained" color="secondary" onClick={handleAddTimer} startIcon={<TimerTwoTone />}>Add to Timers</Button></p>}
      </React.Fragment>
    );
  } else {
    props.setTimeReady(true); //ToDo: rewrite this
    content = (
      <React.Fragment>
        <p>Success: KittenSafe file ready for decryption</p>
        {props.timers.includes(props.file.meta.auth) && <p><FormControlLabel control={<Checkbox checked={props.rmExpTimer} onChange={handleRmExpTimer}/>} label="remove expired timer from Timers"/></p>}
      </React.Fragment>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader title={props.file.meta.filename} subheader={`${props.file.meta.mimeType} (${Math.round(props.file.size/1000)/1000}MB)`} />
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
});

function DecryptionPanel(props){
  // console.log("render DecryptionPanel");
  const [file, setFile] = useState({name: 'none'});
  const [warn, setWarn] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [preview, setPreview] = useState({});
  const [timeReady, setTimeReady] = useState(false);
  const [decFile, setDecFile] = useState(null);
  const [disabledReset, setDisabledReset] = useState(true);
  const [fakeProgress, setFakeProgress] = useState(-1);
  const [rmExpTimer, setRmExpTimer] = useState(true);

  const onDrop = useCallback(acceptedFiles => {
    onChangeFile({target: {files: acceptedFiles}});
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, noClick: true})

  useEffect(() => {
    if (fakeProgress > 3 || fakeProgress < 0) return;
    const timeout = setTimeout(() => {
      setFakeProgress(fakeProgress + 1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fakeProgress]);

  const classes = useStyles();

  const timers = useMemo(() => Object.keys(props.timers), [props.timers]);

  const handleReset = () => {
    setFile({name: 'none'});
    setWarn('');
    setActiveStep(0);
    setPreview({});
    setTimeReady(false);
    setDecFile(null);
    setDisabledReset(true);
    setFakeProgress(-1);
  };

  const onChangeFile = (e) => {
    let f = e.target.files[0];
    if (!f){setTimeReady(false); return setFile({name: 'none'});}
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
    if (timediff > 0){
      setWarn(`Time is not up yet! Please wait ${timediff}ms until you try again!`);
      return console.error(new Error('Time not up!'));
    }
    setActiveStep(1);
    setTimeout(() => setFakeProgress(0), 500);
    Promise.all([ // query webservice to decrypt key for the used timestamo (if in the past)
      fetch('/.netlify/functions/decryptkey', {method: 'POST', body: JSON.stringify(file.meta.secret)}).then(res => {
        switch (res.status){
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
      if (timers.includes(file.meta.auth) && rmExpTimer){
        props.deleteTimer(file.meta.auth);
      }
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
  ];

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Backdrop open={isDragActive} style={{zIndex: 100000}}>
        <Box color="white" fontSize={24} textAlign="center" p={5} border={1} borderRadius={16} borderColor="white" width="75%">
          Drag a KittenSafe file over here to decrypt it!
        </Box>
      </Backdrop>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="fileSelect">
          <StepLabel>Select the encrypted file for decryption</StepLabel>
          <StepContent>
            <input className={classes.input} id="decFileButton" type="file" onChange={onChangeFile} />
            <label htmlFor="decFileButton">
              <Button variant="contained" color="primary" component="span" startIcon={<FolderOpenTwoTone />}>
                Choose file ...
              </Button>
            </label>
            <FilePanel file={file} setTimeReady={setTimeReady} addTimers={props.addTimers} timers={timers} rmExpTimer={rmExpTimer} setRmExpTimer={setRmExpTimer} />
            <Button disabled={true}>Back</Button>
            <Button variant="contained" color="primary" onClick={onDecryptFile} startIcon={<LockOpenTwoTone />} disabled={!timeReady || !navigator.onLine}>Decrypt file ...</Button>
          </StepContent>
        </Step>
        <Step key="Decryption">
          <StepLabel>Decrypting KittenSafe file</StepLabel>
          <StepContent>
            <Container maxWidth="sm">
              <Grid container spacing={3}>
                {[0, 1, 2, 3, 4].map(i => <Grid item xs={2} key={i} style={{fontSize: 32}}>{fakeProgress >= 0 ? catimation[fakeProgress][i] : ''}</Grid>)}
              </Grid>
            </Container>
            <List dense>
              {['reading encrypted file',
                'request decryped key',
                'importing decrypted key',
                'decrypting KittenSafe file'
              ].map((v, i) => (
                <ListItem key={i} dense>
                  <ListItemIcon>
                    {i < fakeProgress ? <CheckBoxTwoTone style={{ color: green[800] }} /> : <CheckBoxOutlineBlank /> }
                  </ListItemIcon>
                  <ListItemText primary={v} />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={!decFile}>Save original file...</Button>
            <Button variant="contained" color="secondary" onClick={handlePrev} disabled={!decFile || !isSupportedMimeType(decFile.mimeType)}>Preview original file...</Button>
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
        <Alert variant="filled" onClose={handleWarnClose} severity="error">
          {warn}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default React.memo(DecryptionPanel);
