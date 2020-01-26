import React, { useState, useRef }  from 'react';
import { DateTimePicker } from "@material-ui/pickers";
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import Checkbox from '@material-ui/core/Checkbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import FolderOpenTwoToneIcon from '@material-ui/icons/FolderOpenTwoTone';
import LockTwoToneIcon from '@material-ui/icons/LockTwoTone';
import ImageTwoToneIcon from '@material-ui/icons/ImageTwoTone';
import DescriptionTwoToneIcon from '@material-ui/icons/DescriptionTwoTone';
import OndemandVideoTwoToneIcon from '@material-ui/icons/OndemandVideoTwoTone';
import AudiotrackTwoToneIcon from '@material-ui/icons/AudiotrackTwoTone';
import InsertDriveFileTwoToneIcon from '@material-ui/icons/InsertDriveFileTwoTone';
import BlockTwoToneIcon from '@material-ui/icons/BlockTwoTone';
import VisibilityTwoToneIcon from '@material-ui/icons/VisibilityTwoTone';
import VisibilityOffTwoToneIcon from '@material-ui/icons/VisibilityOffTwoTone';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import { readFileAsBuffer } from './util'
const crypto = window.crypto.subtle;

const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  input: {
    display: 'none'
  },
  timePicker: {
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 250
    }
  }
}));

function FilenamePanel(props) {
  let icon;
  switch (props.file.type.split('/')[0]) {
      case 'image': icon = <ImageTwoToneIcon />; break;
      case 'text': icon = <DescriptionTwoToneIcon />; break;
      case 'video': icon = <OndemandVideoTwoToneIcon />; break;
      case 'audio': icon = <AudiotrackTwoToneIcon />; break;
      case 'none': icon = <BlockTwoToneIcon />; break;
      default: icon = <InsertDriveFileTwoToneIcon />; break
  }
  return (
    <p>
      {icon} {props.file.name} {props.file.size && `(${Math.round(props.file.size/1000)/1000}MB)`}
      <Tooltip title="Toggle file preview" arrow>
        <Checkbox icon={<VisibilityOffTwoToneIcon />} checkedIcon={<VisibilityTwoToneIcon />} value={false} disabled/>
      </Tooltip>
    </p>
  );
}

function EncryptionPanel() {
  const classes = useStyles();
  const [file, setFile] = useState({name: 'none', type: 'none/none'});
  const [timestamp, setTimestamp] = useState(new Date(new Date().getTime() + 60000));
  const [encBlob, setEncBlob] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [disabledReset, setDisabledReset] = useState(true);
  const intervalRef = useRef();
  if (fakeProgress > 5) clearInterval(intervalRef.current);

  const handleNext = () => setActiveStep(1);
  const handleBack = () => setActiveStep(0);
  const handleReset = () => {
    setFile({name: 'none', type: 'none/none'});
    setTimestamp(new Date(new Date().getTime() + 60000));
    setEncBlob(null);
    setActiveStep(0);
    setFakeProgress(0);
    setDisabledReset(true);
  };

  const onChangeFile = (e) => setFile(e.target.files[0] || {name: 'none', type: 'none/none'});
  const onEncryptFile = () => {
    setActiveStep(2);
    setTimeout(() => {
      const iid = window.setInterval(() => {
        setFakeProgress((f) => f += 1);
      }, 300);
      intervalRef.current = iid;
    }, 500);
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
  ]

  return (
    <Stepper activeStep={activeStep} orientation="vertical">
      <Step key="fileSelect">
        <StepLabel>Select the file to encrypt</StepLabel>
        <StepContent>
          <input className={classes.input} id="encFileButton" type="file" onChange={onChangeFile}/>
          <label htmlFor="encFileButton">
            <Button variant="contained" color="primary" component="span" startIcon={<FolderOpenTwoToneIcon />}>
              Choose file ...
            </Button>
          </label>
          <FilenamePanel file={file}/>
          <Button disabled={true}>Back</Button>
          <Button variant="contained" color="primary" onClick={handleNext} disabled={!file.size}>Select Timestamp</Button>
        </StepContent>
      </Step>
      <Step key="timestampSelect">
        <StepLabel>Select the timestamp until the file should be encrypted</StepLabel>
        <StepContent>
          <DateTimePicker
            className={classes.timePicker}
            value={timestamp}
            onChange={setTimestamp}
            showTodayButton
            todayLabel="NOW"
            disablePast
            title="SELECT TIMESTAMP"
            format="yyyy/MM/dd HH:mm:ss.SSS"
          />
          <p>
            <Button onClick={handleBack}>Back</Button>
            <Button variant="contained" color="primary" startIcon={<LockTwoToneIcon />} onClick={onEncryptFile}>Encrypt file ...</Button>
          </p>
        </StepContent>
      </Step>
      <Step key="downloadEncrypted">
        <StepLabel>Encrypting and Saving the file</StepLabel>
        <StepContent>
          <Container maxWidth="sm">
            <Grid container spacing={3}>
              {[0, 1, 2, 3, 4].map(i => <Grid item xs={2} key={i} style={{fontSize: 32}}>{catimation[fakeProgress][i]}</Grid>)}
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
                  {i < fakeProgress ? <CheckBoxTwoToneIcon style={{ color: green[800] }} /> : <CheckBoxOutlineBlankIcon /> }
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
  );
}

export default EncryptionPanel;
