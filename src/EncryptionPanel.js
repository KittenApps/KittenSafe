import React, { useState, useEffect, useCallback } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, List, ListItem, ListItemIcon, ListItemText,
        Stepper, Step, StepLabel, StepContent, Tooltip, Backdrop, Box } from '@material-ui/core';
import { DateTimePicker } from '@material-ui/pickers';
import { CheckBoxOutlineBlank, CheckBoxTwoTone, FolderOpenTwoTone, LockTwoTone,
         VisibilityTwoTone, VisibilityOffTwoTone } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import { useDropzone } from 'react-dropzone'
import { readFileAsBuffer } from './util';
import { FileIcon } from './Timers';
import FilePreview, {isSupportedMimeType2} from './FilePreview';

const crypto = window.crypto.subtle;

const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1)
    }
  },
  input: {
    display: 'none'
  },
  timePicker: {
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 270
    }
  }
}));

const FilenamePanel = React.memo((props) => {
  // console.log("render EncryptionPanel FilenamePanel");
  const [showPreview, setPreview] = useState(false);
  const handlePreview = (e) => setPreview(e.target.checked);

  const metaInfo = (
    <p>
      <FileIcon mimeType={props.file.type} /> {props.file.name} {props.file.size && `(${Math.round(props.file.size/1000)/1000}MB)`}
      <Tooltip title="Toggle file preview" arrow>
        <Checkbox icon={<VisibilityOffTwoTone />} checkedIcon={<VisibilityTwoTone />} value={showPreview} onChange={handlePreview} disabled={!isSupportedMimeType2(props.file.type)}/>
      </Tooltip>
    </p>
  );

  if (showPreview){
    return (
      <React.Fragment>
        {metaInfo}
        <FilePreview src={URL.createObjectURL(props.file)} mimeType={props.file.type} filename={props.file.name} />
      </React.Fragment>
    );
  }

  return metaInfo;
});

function EncryptionPanel(props){
  // console.log("render EncryptionPanel");
  const classes = useStyles();
  const [file, setFile] = useState({name: 'none', type: 'none/none'});
  const [addTimers, setAddTimers] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date(new Date().getTime() + 60000));
  const [encBlob, setEncBlob] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(-1);
  const [disabledReset, setDisabledReset] = useState(true);

  const onDrop = useCallback(acceptedFiles => {
    setFile(acceptedFiles[0]);
  }, [])
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, noClick: true, noKeyboard: true});

  useEffect(() => {
    if (fakeProgress > 5 || fakeProgress < 0) return;
    const timeout = setTimeout(() => {
      setFakeProgress(fakeProgress + 1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [fakeProgress]);

  if (props.hidden) return null;

  const handleNext = () => setActiveStep(1);
  const handleBack = () => setActiveStep(0);
  const handleReset = () => {
    setFile({name: 'none', type: 'none/none'});
    setTimestamp(new Date(new Date().getTime() + 60000));
    setEncBlob(null);
    setActiveStep(0);
    setFakeProgress(-1);
    setDisabledReset(true);
  };

  const handleAddTimers = e => setAddTimers(e.target.checked);
  const onChangeFile = e => setFile(e.target.files[0] || {name: 'none', type: 'none/none'});
  const onEncryptFile = () => {
    setActiveStep(2);
    setTimeout(() => setFakeProgress(0), 500);
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
      setEncBlob(new Blob([meta, data]));
      if (addTimers){ // ToDo: Make set to pinned Timer conditionally
        props.addTimers(auth, {timestamp: secret.timestamp, filename: file.name, mimeType: file.type}, true);
      }
    }).catch(err => console.error(err));
  };

  const handleSave = () => {
    const href = URL.createObjectURL(encBlob, {type: 'application/octet-binary'}); // create File
    const a = document.createElement('a');
    a.setAttribute('download', file.name + '-' + timestamp.toISOString() + '.ksf');
    a.setAttribute('href', href);
    a.click();
    setDisabledReset(false);
  };

  const catimation = [
    ['', '', '🔓', '', '🔑'],
    ['', '', '🔓', '🔑', '🐈'],
    ['', '', '🔐', '🐈', ''],
    ['', '🔑', '🔒', '🐈', ''],
    ['🔑', '🐈', '🔒', '', ''],
    ['🐈', '', '🔒', '', ''],
    ['😺', '', '🔒', '', '😺']
  ];

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Backdrop open={isDragActive} style={{zIndex: 100000}}>
        <Box color="white" fontSize={24} textAlign="center" p={5} border={1} borderRadius={16} borderColor="white" width="75%">
          Drag a file over here to encrypt it with KittenSafe!
        </Box>
      </Backdrop>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="fileSelect">
          <StepLabel>Select the file to encrypt</StepLabel>
          <StepContent>
            <input className={classes.input} id="encFileButton" type="file" onChange={onChangeFile} />
            <label htmlFor="encFileButton">
              <Button variant="contained" color="primary" component="span" startIcon={<FolderOpenTwoTone />}>
                Choose file ...
              </Button>
            </label>
            <FilenamePanel file={file} />
            <Button disabled={true}>Back</Button>
            <Button variant="contained" color="primary" onClick={handleNext} disabled={!file.size || !navigator.onLine}>Select Timestamp</Button>
          </StepContent>
        </Step>
        <Step key="timestampSelect">
          <StepLabel>Select the timestamp until the file should be encrypted</StepLabel>
          <StepContent>
            <DateTimePicker
              variant="outlined"
              label="file encrypted until:"
              className={classes.timePicker}
              value={timestamp}
              onChange={setTimestamp}
              showTodayButton
              todayLabel="NOW"
              disablePast
              title="SELECT TIMESTAMP"
              format="yyyy/MM/dd HH:mm:ss.SSS"
            />
            <p><FormControlLabel control={<Checkbox checked={addTimers} onChange={handleAddTimers}/>} label="add to local Timers"/></p>
            <p>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" color="primary" startIcon={<LockTwoTone />} onClick={onEncryptFile}>Encrypt file ...</Button>
            </p>
          </StepContent>
        </Step>
        <Step key="downloadEncrypted">
          <StepLabel>Encrypting and Saving the file</StepLabel>
          <StepContent>
            <Container maxWidth="sm">
              <Grid container spacing={3}>
                {[0, 1, 2, 3, 4].map(i => <Grid item xs={2} key={i} style={{fontSize: 32}}>{fakeProgress >= 0 ? catimation[fakeProgress][i] : ''}</Grid>)}
              </Grid>
            </Container>
            <List dense>
              {['reading file',
                'generating random key',
                'encrypting file',
                'request encryped key',
                'creating output file',
                'throwing key far away'
              ].map((v, i) => (
                <ListItem key={i} dense>
                  <ListItemIcon>
                    {i < fakeProgress ? <CheckBoxTwoTone style={{ color: green[800] }} /> : <CheckBoxOutlineBlank /> }
                  </ListItemIcon>
                  <ListItemText primary={v} />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={!encBlob}>Save Encrypted File...</Button>
            <Button onClick={handleReset} disabled={disabledReset}>Reset</Button>
          </StepContent>
        </Step>
      </Stepper>
    </div>
  );
}

export default React.memo(EncryptionPanel);
