import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Avatar, Backdrop, Box, Button, Card, CardHeader, CardActions, Checkbox, Container,
         FormControlLabel, Grid, Stepper, Step, StepLabel, StepContent, Tooltip, useMediaQuery } from '@material-ui/core';
import { DateTimePicker } from '@material-ui/pickers';
import { FolderOpenTwoTone, LockTwoTone, VisibilityTwoTone, VisibilityOffTwoTone,
         FormatColorText, TimerTwoTone, SaveTwoTone } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { pink } from '@material-ui/core/colors';
import { useDropzone } from 'react-dropzone'
import { readFileAsBuffer } from './util';
import { FileIcon, TimerChip } from './Timers';
import FilePreview, {isSupportedMimeType2} from './FilePreview';
import FakeProgress from './FakeProgress';
import MarkdownEditor from './MarkdownEditor';

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

const useStylesTP = makeStyles(theme => ({
  checked: {
    color: theme.palette.getContrastText(pink[500]),
    backgroundColor: pink[500],
  },
  action: {
    marginTop: 8
  }
}));

const catimation = [
  ['', '', '🔓', '', '🔑'],
  ['', '', '🔓', '🔑', '🐈'],
  ['', '', '🔐', '🐈', ''],
  ['', '🔑', '🔒', '🐈', ''],
  ['🔑', '🐈', '🔒', '', ''],
  ['🐈', '', '🔒', '', ''],
  ['😺', '', '🔒', '', '😺']
];

const fakeItems = [
  'reading file',
  'generating random key',
  'encrypting file',
  'request encryped key',
  'creating output file',
  'throwing key far away'
];

const TimerPreview = React.memo((props) => {
  // console.log("render EncryptionPanel TimerPreview: ", props);
  const mimeType = useMemo(() => props.file.type.split('/')[0], [props.file]);
  const isMobile = useMediaQuery(useTheme().breakpoints.down('xs'));
  const classes = useStylesTP();

  const handleAddTimers = e => props.setAddTimers(e.target.checked);
  const handleAddPinnedTimer = e => props.setAddPinnedTimers(e.target.checked);

  return (
    <Card style={{marginTop: 5}} variant="outlined">
      <CardHeader
        title={props.file.name}
        subheader={isMobile ? <TimerChip timestamp={props.timestamp} full/> : `${props.file.type} (${Math.round(props.file.size/1000)/1000}MB)`}
        avatar={
          <Checkbox
            icon={<Avatar variant="rounded"><FileIcon mimeType={mimeType}/></Avatar>}
            checkedIcon={<Avatar variant="rounded" className={classes.checked}><FileIcon mimeType={mimeType}/></Avatar>}
            color="default" checked={props.addPinnedTimer} onChange={handleAddPinnedTimer}
          />
        }
        action={!isMobile && <TimerChip timestamp={props.timestamp} full/>}
        classes={{action: classes.action}}
        style={{paddingBottom: 8, paddingTop: 8}}
      />
      <CardActions>
        <FormControlLabel control={<Checkbox checked={props.addTimers} onChange={handleAddTimers}/>} label="add to local Timers"/>
      </CardActions>
    </Card>
  );
});

const FilenamePanel = React.memo((props) => {
  // console.log("render EncryptionPanel FilenamePanel: ", props);
  const [showPreview, setPreview] = useState(false);
  useEffect(() => setPreview(() => false), [props.file]);
  const handlePreview = (e) => setPreview(e.target.checked);
  const isSupported = useMemo(() => isSupportedMimeType2(props.file.type) || !!props.file.markdown, [props.file]);

  const metaInfo = (
    <Grid container spacing={1} justify="center" alignItems="center">
      <Grid item><FileIcon mimeType={props.file.type.split('/')[0]} /></Grid>
      <Grid item>{props.file.name} {props.file.size && `(${Math.round(props.file.size/1000)/1000}MB)`}</Grid>
      <Grid item>
        <Tooltip title="Toggle file preview" arrow>
          <Checkbox icon={<VisibilityOffTwoTone />} checkedIcon={<VisibilityTwoTone />} checked={showPreview} onChange={handlePreview} disabled={!isSupported}/>
        </Tooltip>
      </Grid>
    </Grid>
  );

  if (showPreview){
    return (
      <React.Fragment>
        <Container maxWidth="md" disableGutters>{metaInfo}</Container>
        {isSupported &&
          <FilePreview src={props.file.markdown || URL.createObjectURL(props.file)} mimeType={props.file.type} filename={props.file.name} />
        }
      </React.Fragment>
    );
  }

  return metaInfo;
});

function EncryptionPanel(props){
  // console.log("render EncryptionPanel: ", props);
  const classes = useStyles();
  const [file, setFile] = useState({name: 'none', type: 'none/none'});
  const [addTimers, setAddTimers] = useState(true);
  const [addPinnedTimer, setAddPinnedTimers] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date(new Date().getTime() + 60000));
  const [encBlob, setEncBlob] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [fakeProgressPlaying, setFakeProgress] = useState(false);
  const [disabledReset, setDisabledReset] = useState(true);
  const [createMarkdownOpen, setCreateMarkdownOpen] = useState(false);

  const onDrop = useCallback(acceptedFiles => setFile(acceptedFiles[0]), []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, noClick: true, noKeyboard: true, disabled: activeStep !== 0 || createMarkdownOpen});

  if (props.hidden) return null;

  const handleNext = () => setActiveStep(1);
  const handleBack = () => setActiveStep(0);
  const handleReset = () => {
    setFile({name: 'none', type: 'none/none'});
    setTimestamp(new Date(new Date().getTime() + 60000));
    setEncBlob(null);
    setActiveStep(0);
    setFakeProgress(false);
    setDisabledReset(true);
  };

  const onChangeFile = e => setFile(e.target.files[0] || {name: 'none', type: 'none/none'});
  const onEncryptFile = () => {
    setActiveStep(2);
    setTimeout(() => setFakeProgress(true), 500);
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
        props.addTimers(auth, {timestamp: secret.timestamp, filename: file.name, mimeType: file.type}, addPinnedTimer);
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

  const handleCreateMarkdownOpen = () => setCreateMarkdownOpen(true);

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
          <StepLabel>Choose or create the file to encrypt</StepLabel>
          <StepContent>
            <Container maxWidth="sm" disableGutters>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <input className={classes.input} id="encFileButton" type="file" onChange={onChangeFile} />
                  <label htmlFor="encFileButton">
                    <Button variant="contained" color="primary" component="span" startIcon={<FolderOpenTwoTone/>} fullWidth>Select file …</Button>
                  </label>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button variant="contained" color="secondary" onClick={handleCreateMarkdownOpen} startIcon={<FormatColorText/>} fullWidth>Create Markdown text</Button>
                </Grid>
              </Grid>
            </Container>
            <FilenamePanel file={file} />
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" disabled={true}>Back</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<TimerTwoTone/>} onClick={handleNext} disabled={!file.size || !navigator.onLine} fullWidth>Select Timestamp</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
        <Step key="timestampSelect">
          <StepLabel>Select the timestamp until the file should be encrypted</StepLabel>
          <StepContent>
            <Container maxWidth="sm" disableGutters>
              <DateTimePicker
                variant="outlined"
                label="file encrypted until:"
                className={classes.timePicker}
                views={['year', 'month', 'date', 'hours', 'minutes']}
                value={timestamp}
                onChange={setTimestamp}
                showTodayButton
                todayLabel="NOW"
                disablePast
                title="SELECT TIMESTAMP"
                format="yyyy/MM/dd HH:mm:ss.SSS"
                mask="____/__/__ __:__:__.___"
                fullWidth
              />
              <TimerPreview addTimers={addTimers} setAddTimers={setAddTimers} addPinnedTimer={addPinnedTimer} setAddPinnedTimers={setAddPinnedTimers} file={file} timestamp={timestamp} />
            </Container>
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" onClick={handleBack}>Back</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<LockTwoTone/>} onClick={onEncryptFile} fullWidth>Encrypt file …</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
        <Step key="downloadEncrypted">
          <StepLabel>Encrypting and saving your file as a KittenSafe file</StepLabel>
          <StepContent>
            <FakeProgress catimation={catimation} items={fakeItems} play={fakeProgressPlaying}/>
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" onClick={handleReset} disabled={disabledReset}>Reset</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<SaveTwoTone/>} onClick={handleSave} disabled={!encBlob} fullWidth>Save Encrypted File …</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
      </Stepper>
      {createMarkdownOpen && <MarkdownEditor open={createMarkdownOpen} setOpen={setCreateMarkdownOpen} setFile={setFile} />}
    </div>
  );
}

export default React.memo(EncryptionPanel, (prev, next) => {
  if (next.hidden) return true;
  return Object.is(prev, next);
});
