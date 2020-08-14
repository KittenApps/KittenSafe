import * as React from 'react';
import { useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { Avatar, Button, Card, CardHeader, CardContent, CardActions, Checkbox, Container, FormControlLabel, Grid, List, ListItem,
         ListItemIcon, ListItemText, Snackbar, Stepper, Step, StepLabel, StepContent, Backdrop, Box, Hidden } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { LockOpenTwoTone, FolderOpenTwoTone, TimerTwoTone, SaveTwoTone, ImageTwoTone } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { pink } from '@material-ui/core/colors';
import { useDropzone } from 'react-dropzone'
import { readFileAsBuffer, TimerContext } from './util';
import { FileIcon, TimerChip } from './Timers'
import FilePreview, {isSupportedMimeType} from './FilePreview';
import FakeProgress from './FakeProgress';

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

const useStylesFP = makeStyles(theme => ({
  checked: {
    color: theme.palette.getContrastText(pink[500]),
    backgroundColor: pink[500],
  },
  action: {
    marginTop: 8
  }
}));

const catimation = [
  ['', '', '🔒', '🔑', '🐈'],
  ['', '', '🔐', '🐈', ''],
  ['', '🐈', '🔓', '', ''],
  ['🐈', '', '🔓', '', ''],
  ['😺', '', '🔓', '', '😺']
];

const fakeItems = [
  'reading encrypted file',
  'request decryped key',
  'importing decrypted key',
  'decrypting KittenSafe file'
];

const FilePanelTimer = (props) => {
  // console.log("render DecryptionPanel FilePanel Timer");
  const now = useContext(TimerContext);
  const td = useMemo(() => {
    const tdiff = new Date(props.timestamp) - now;
    if (tdiff <= 0) props.setReady();
    return tdiff + 500;
  }, [props, now]);

  if (td <= 0) return <p style={{marginTop: 8, marginBottom: 0}}><b>0</b>days <b>0</b>hours <b>00</b>mins <b>00</b>secs left</p>;
  const d = Math.floor(td / (1000 * 60 * 60 * 24));
  const h = Math.floor((td / (1000 * 60 * 60)) % 24);
  const m = Math.floor((td / 1000 / 60) % 60);
  const s = Math.floor((td / 1000) % 60);

  return <p style={{marginTop: 8, marginBottom: 0}}><b>{d}</b>days <b>{h}</b>hours <b>{m < 10 ? '0' + m : m}</b>mins <b>{s < 10 ? '0' + s : s}</b>secs left</p>;
};

const FilePanel = React.memo((props) => {
  // console.log("render DecryptionPanel FilePanel", props);
  const classes = useStylesFP();
  const oldPinnedTimer = useRef();
  useEffect(() => {
    if (props.pinnedTimer !== props.file.meta.auth) oldPinnedTimer.current = props.pinnedTimer;
  }, [props.pinnedTimer, props.file]);

  const handleAddTimer = () => props.addTimers(props.file.meta.auth, {timestamp: props.file.meta.secret.timestamp, filename: props.file.meta.filename, mimeType: props.file.meta.mimeType}, false);
  const handleRmExpTimer = e => props.setRmExpTimer(e.target.checked);
  const handlePinnedChange = e => {
    if (e.target.checked){
      props.setPinnedTimer(props.file.meta.auth);
    } else if (oldPinnedTimer.current){
      props.setPinnedTimer(oldPinnedTimer.current);
    }
  };

  return (
    <Card style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text'}} variant="outlined">
      <CardHeader
        title={props.file.meta.filename}
        subheader={`${props.file.meta.mimeType} (${Math.round(props.file.size/1000)/1000}MB)`}
        avatar={
          <Checkbox
            icon={<Avatar variant="rounded"><FileIcon mimeType={props.file.meta.mimeType.split('/')[0]}/></Avatar>}
            checkedIcon={<Avatar variant="rounded" className={classes.checked}><FileIcon mimeType={props.file.meta.mimeType.split('/')[0]}/></Avatar>}
            color="default" checked={props.pinnedTimer === props.file.meta.auth} onChange={(handlePinnedChange)}
            disabled={!props.timers.includes(props.file.meta.auth)}
          />
        }
        action={<Hidden xsDown><TimerChip timestamp={props.file.meta.secret.timestamp} full/></Hidden>}
        classes={{action: classes.action}}
        style={{paddingBottom: 8, paddingTop: 8}}
      />
      <CardContent style={{paddingTop: 0, paddingBottom: 8}}>
        {props.timeReady ? 'Success: KittenSafe file ready for decryption 🔓' : 'Error: KittenSafe file not ready for decryption 🔒:'}
        {!props.timeReady && <FilePanelTimer timestamp={props.file.meta.secret.timestamp} setReady={props.setReady} />}
      </CardContent>
      {!props.timeReady && !props.timers.includes(props.file.meta.auth) && <CardActions><Button variant="contained" color="secondary" onClick={handleAddTimer} startIcon={<TimerTwoTone />}>Add to Timers</Button></CardActions>}
      {props.timeReady && props.timers.includes(props.file.meta.auth) && <CardActions><FormControlLabel control={<Checkbox checked={props.rmExpTimer} onChange={handleRmExpTimer}/>} label="remove expired timer from Timers list"/></CardActions>}
    </Card>
  );
});

const FilePanelError = React.memo((props) => {
  const userSelect = {userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text'};

  if (props.file.name === 'none'){
    const now = new Date();
    const readyCached = Object.entries(props.timers).filter(t => t[1].cached && new Date(t[1].timestamp) < now);

    const openFromCache = id => caches.open('KittenSafeFiles').then(c => c.match(id)).then(r => {
      if (r && r.arrayBuffer){
        props.setFile({name: props.timers[id].filename, size: 43, type: props.timers[id].mimeType, arrayBuffer: () => r.arrayBuffer()});
      }
    });

    return (
      <Card style={userSelect} variant="outlined">
        <CardHeader title="No file selected" subheader="Please choose a valid KittenSafe file for decryption!"/>
        {readyCached.length > 0 &&
          <CardContent><List dense>
            {readyCached.map(([id, t]) => (
              <ListItem key={id} button onClick={openFromCache.bind(this, id)}>
                <ListItemIcon><FileIcon mimeType={t.mimeType.split('/')[0]}/></ListItemIcon>
                <ListItemText primary={t.filename} />
              </ListItem>
            ))}
          </List></CardContent>
        }
      </Card>);
  }
  if (props.file.name === 'invalid'){
    return <Card style={userSelect} variant="outlined"><CardHeader title="Invalid KittenSafe file" subheader="Please choose a valid and non corrupted KittenSafe file for decryption!"/></Card>;
  }
  return <Card variant="outlined"><CardHeader/><CardContent/></Card>;
});

function DecryptionPanel(props){
  // console.log("render DecryptionPanel: ", props);
  const [file, setFile] = useState({name: 'none'});
  const [warn, setWarn] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [preview, setPreview] = useState({});
  const [timeReady, setTimeReady] = useState(false);
  const [decFile, setDecFile] = useState(null);
  const [disabledReset, setDisabledReset] = useState(true);
  const [fakeProgressPlaying, setFakeProgress] = useState(false);
  const [rmExpTimer, setRmExpTimer] = useState(true);

  const setReady = useCallback(() => setTimeReady(true), []);

  useEffect(() => {
    if (file.name === 'none' || file.name === 'invalid'){
      setTimeReady(false);
    } else if (!file.meta){
      readFileAsBuffer(file).then((data) => {
        const meta = JSON.parse(new TextDecoder('utf-8').decode(data.slice(0,data.indexOf(10)))); // parse content until \n (10) as metadata
        setFile({size: file.size, meta, data});
        setTimeReady(new Date(meta.secret.timestamp) < new Date());
      }).catch(err => {
        setFile({name: 'invalid'});
        console.error(err);
      });
    }
  }, [file])

  const onDrop = useCallback(acceptedFiles => setFile(acceptedFiles[0]), []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, noClick: true, noKeyboard: true, disabled: activeStep !== 0});

  const classes = useStyles();

  const timers = useMemo(() => Object.keys(props.timers), [props.timers]);

  if (props.hidden) return null;

  const onChangeFile = (e) => setFile(e.target.files[0] || {name: 'none'});
  const onResetFile = () => setFile({name: 'none'});

  const handleReset = () => {
    setFile({name: 'none'});
    setWarn('');
    setActiveStep(0);
    setPreview({});
    setTimeReady(false);
    setDecFile(null);
    setDisabledReset(true);
    setFakeProgress(false);
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
    setTimeout(() => setFakeProgress(true), 500);
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
      setTimeout(() => setDisabledReset(false), 10000);
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

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Backdrop open={isDragActive} style={{zIndex: 100000}}>
        <Box color="white" fontSize={24} textAlign="center" p={5} border={1} borderRadius={16} borderColor="white" width="75%">
          Drag a KittenSafe file over here to decrypt it!
        </Box>
      </Backdrop>
      <Stepper activeStep={activeStep} elevation={1} orientation="vertical">
        <Step key="fileSelect">
          <StepLabel>Choose the KittenSafe file for decryption</StepLabel>
          <StepContent>
            <Container maxWidth="sm" disableGutters>
              <input className={classes.input} id="decFileButton" type="file" accept=".ksf" onChange={onChangeFile} />
              <label htmlFor="decFileButton">
                <Button variant="contained" component="span" startIcon={<FolderOpenTwoTone/>} fullWidth>Select file …</Button>
              </label>
            </Container>
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              {!file.meta ? <FilePanelError file={file} timers={props.timers} setFile={setFile} /> :
                <FilePanel
                  file={file} timeReady={timeReady} setReady={setReady}
                  addTimers={props.addTimers} timers={timers} rmExpTimer={rmExpTimer} setRmExpTimer={setRmExpTimer}
                  pinnedTimer={props.pinnedTimer} setPinnedTimer={props.setPinnedTimer}
                />
              }
            </Container>
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" disabled={file.name === 'none'} onClick={onResetFile} >Reset</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<LockOpenTwoTone/>} onClick={onDecryptFile} disabled={!timeReady || !navigator.onLine} fullWidth>Decrypt file …</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
        <Step key="Decryption">
          <StepLabel>Decrypting the KittenSafe file and saving the restored original file</StepLabel>
          <StepContent>
            <FakeProgress catimation={catimation} items={fakeItems} play={fakeProgressPlaying}/>
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" onClick={handleReset} disabled={disabledReset}>Reset</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<SaveTwoTone/>} onClick={handleSave} disabled={!decFile} fullWidth>Save original file</Button></Grid>
                <Grid item xs={12} sm><Button variant="contained" color="secondary" startIcon={<ImageTwoTone/>} onClick={handlePrev} disabled={!decFile || !isSupportedMimeType(decFile.mimeType)} fullWidth>Preview original file</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
        <Step key="Preview">
          <StepLabel>Optionally previewing the decrypted media file</StepLabel>
          <StepContent>
            <FilePreview src={preview.src} mimeType={preview.mimeType} filename={preview.filename} />
            <Container maxWidth="sm" style={{marginTop: 5}} disableGutters>
              <Grid container spacing={1}>
                <Grid item><Button variant="outlined" onClick={handleReset} disabled={disabledReset}>Reset</Button></Grid>
                <Grid item xs><Button variant="contained" color="primary" startIcon={<SaveTwoTone/>} onClick={handleSave} disabled={!decFile} fullWidth>Save original file</Button></Grid>
              </Grid>
            </Container>
          </StepContent>
        </Step>
      </Stepper>
      <Snackbar open={warn !== ''} onClose={handleWarnClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert variant="filled" elevation={6} onClose={handleWarnClose} severity="error">
          {warn}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default React.memo(DecryptionPanel, (prev, next) => {
  if (next.hidden) return true;
  return Object.is(prev, next);
});
