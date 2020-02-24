import React, { useState } from 'react';
import clsx from 'clsx';
import { Box, Button, Container, Dialog, DialogActions, DialogContent,
         Paper, Tabs, Tab, Typography, useMediaQuery } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { unregister } from './serviceWorker';
import logo from './media/logo256.png';

const useStyles = makeStyles(theme => ({
  paper: {
    height: 'calc(100% - 64px);'
  },
  content: {
    [theme.breakpoints.down('xs')]: {
      padding: 8
    }
  },
  contentChat: {
    height: '100%',
    padding: 0
  }
}));

const TabPanel = React.memo(({children, value, index, style}) => (
    <Typography component="div" role="tabpanel" hidden={value !== index} style={style} >
      {value === index && <Box p={1} style={style} >{children}</Box>}
    </Typography>
  ), (prev, next) => prev.value !== prev.index && next.value !== next.index);

function InfoDialog(props){
  // console.log("render InfoDialog");
  const [infoTab, setInfoTab] = useState(() => localStorage.getItem('lastVersion') !== props.version && localStorage.getItem('lastVersion') ? 3 : 0);
  const [brachSwitched, setBrachSwitched] = useState(false);
  const handleInfoTabChange = (e, newTab) => setInfoTab(newTab);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));
  const classes = useStyles();
  if (!props.open) return null;

  const handleClose = () => {
    localStorage.setItem('lastVersion', props.version);
    props.setOpen(false);
  };
  const handleBranchSwitch = () => {
    setBrachSwitched(true);
    unregister().then(() => {
      document.cookie = `nf_ab=${document.cookie === 'nf_ab=beta' ? 'stable' : 'beta'}; expires=${new Date(new Date().getTime() + 1000 * 3600 * 24 * 365)}`;
    }).then(() => window.location.reload());
  }

  return (
    <Dialog open={props.open} onClose={handleClose} fullScreen={fullScreen} fullWidth={infoTab === 2} classes={{paper: clsx({[classes.paper]: infoTab === 2 && !fullScreen})}} maxWidth="xl">
      <Paper square>
        <Box display="flex" justifyContent="center">
          <Tabs value={infoTab} indicatorColor="primary" textColor="primary" variant="scrollable" scrollButtons="on" onChange={handleInfoTabChange}>
            <Tab label="Welcome" value={0} />
            <Tab label="Info" value={1} />
            <Tab label="Discord (Chat)" value={2} disabled={!navigator.onLine}/>
            <Tab label="Release Notes" value={3} />
            <Tab label="Roadmap" value={4} />
          </Tabs>
        </Box>
      </Paper>
      <DialogContent className={clsx(classes.content, {[classes.contentChat]: infoTab === 2 && fullScreen})} >
        <TabPanel value={infoTab} index={0}>
          <Box textAlign="center" component="h2">Welcome to KittenSafe {props.version} <span role="img" aria-label="KittenSafe emoji">😺🔒</span></Box>
          <Box display="flex" justifyContent="center"><img src={logo} alt="logo"/></Box>
          {window.location.hostname === "kittensafe.netlify.com" && <Container maxWidth="sm" style={{marginTop: 10, marginBottom: 10}} disableGutters><Button variant="contained" color="secondary" onClick={handleBranchSwitch} disabled={brachSwitched || !navigator.onLine} fullWidth>Switch to {document.cookie === 'nf_ab=beta' ? 'stable' : 'beta'} branch …</Button></Container>}
          <Box textAlign="center" fontStyle="italic">A secure WebApp to encrypt your files for delayed access until a preselected timestamp.</Box>
          <Box textAlign="center" fontStyle="italic">It is 100% privacy friendly too, because your files never leave your device (as encrypting them is done locally using the WebCrypto API).</Box>
          <Box textAlign="center" fontStyle="italic">Also no personal data is stored on our stateless servers (no database used), because it uses some fancy crypto methods to derive the encryption key based on the given timestamp.</Box>
          <Box textAlign="center" fontStyle="italic">For more background information on how KittenSafe works, check out the Info tab at the top of this dialog box.</Box>
          <Box textAlign="center" fontStyle="italic">KittenSafe is build with ❤ by Silizias using the Web Crypto API, Netlify functions, React, Material UI and Remark. The logo is from iconka.com.</Box>
          <Box textAlign="center" fontStyle="italic">Note: You can reopen this dialog whenever you want by clicking the question mark in the top right corner (of the appbar).</Box>
        </TabPanel>
        <TabPanel value={infoTab} index={1}>
          <b>Technical information:</b>
          <ul>
            <li>After selecting the input file and a timestamp (the date and time when the file should be accessible again) a random <i>256-bit AES</i> key is generated locally. </li>
            <li>This key is then used to encrypt the file locally in the web client using <i>AES-256-GCM</i> (your personal files are never sent to our servers). .</li>
            <li>A web request is made to the encryption endpoint of our stateless Netlify functions aka AWS lambda webservice with the exported key (used to encrypt the file locally) and the timestamp (the date and time until decryption should be impossible):</li>
            <ul>
              <li>The webservice derives a secret server key based on the timestamp and a server secret using <i>scrypt.</i></li>
              <li>Then it decrypts the client-side key using <i>AES-256-GCM</i> and sends the result (encrypted key, timestamp, <i>initializing vector</i> and <i>authentication tag</i>) back to the user.</li>
              <li>Note: The timestamp is actually part of the secret and trying to cheat by changing it won't work, because the decryption would just derive a completely different key than the one used for encryption and fail during decryption.</li>
            </ul>
            <li>Then the encrypted data is written to the KittenSafe output file <i>(.ksf)</i> together with some metadata containing all values necessary for decryption and some file specific metadata.</li>
            <li>You are now free to optionally send the encrypted file to another person too, because they will get everything necessary to decrypt the file later (after the given timestamp is up) on their own.</li>
            <li>After that we forget the plain text encryption key and you are encouraged to delete the plain text input file as well (unless you decrypted it for someone else to retrieve later).</li>
            <li>Later when trying to decrypt the KittenSafe file, we read the meta data to determine if the file is ready for decryption or if we still have to show you a decryption countdown.</li>
            <li>When the time is up, we make a web request to the decryption endpoint of our webservice containing the result we got previously during encryption (encrypted key, timestamp, <i>initializing vector</i> and <i>authentication tag</i>).</li>
            <ul>
              <li>The webservice first validates if the used timestamp is now really in the past and will throw an error if it isn’t.</li>
              <li>Then the same key (one used for encryption) is derived from the timestamp and the server secret using <i>scrypt</i>.</li>
              <li>Finally, we decrypt the client-side key using <i>AES-256-GCM</i> and return the decrypted client key back to the user.</li>
              <li>Note: Faking the timestamp here would result in a different key being derived from <i>scrypt</i> and the <i>AES-256-GCM</i> decryption would fail (we can detect that using the authentication tag) and we would return an error to the user.</li>
            </ul>
            <li>After getting the decrypted client key back from the server, we can use it (together with other data stored with the file) to finally decrypt the file locally and restore its original state.</li>
          </ul>
        </TabPanel>
        <TabPanel value={infoTab} index={2} style={{height: '100%'}}>
          <iframe src="https://disweb.dashflo.net/channels/676574654919344128/676574655359877151" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"></iframe>
        </TabPanel>
        <TabPanel value={infoTab} index={3}>
          <b>KittenSafe v0.4:</b>
          <ul>
            <li>Markdown Test Editor: create an (markdown) test for encryption within KittenSafe and also preview it after decryption</li>
            <li>advanced File Previews (view your pictures in full beauty with the new full screen mode)</li>
            <li>better Timers integration in Encryption / Decryption setup panel</li>
            <li>Dark Mode for your night owls (activate it in the custome theme dialog)</li>
            <li>Design improvements and bug fixes in nearly every part of the WebApp</li>
          </ul>
          <b>KittenSafe v0.3:</b>
          <ul>
            <li>basic Timers support</li>
            <li>file drag and drop support</li>
            <li>Progressive Web App: this site is available offline to check on Timers</li>
            <li>performance optimization (avoid unnecessary rerendering, unified timers …)</li>
            <li>and other minor improvements and fixes</li>
          </ul>
          <b>KittenSafe v0.2:</b>
          <ul>
            <li>new fancy React Material UI</li>
          </ul>
        </TabPanel>
        <TabPanel value={infoTab} index={4}>
          <b>Roadmap:</b>
          <ul>
            <li>more Timestamp options (randomly select date based on a given interval, only allow decryption until a given maxDate)</li>
            <li>Timers 2.0</li>
          </ul>
          {window.location.hostname === "kittensafe.netlify.com" ?
            <React.Fragment>
              <i>You could also check out the more up to date and maybe slightly less stable beta version:</i>
              <Container maxWidth="sm" style={{marginTop: 10, marginBottom: 10}} disableGutters><Button variant="contained" color="secondary" onClick={handleBranchSwitch} disabled={brachSwitched || !navigator.onLine} fullWidth>Switch to {document.cookie === 'nf_ab=beta' ? 'stable' : 'beta'} branch …</Button></Container>
              <i>Or use the seperate WebApps for  <a href="https://beta--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">beta</a> or  <a href="https://master--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">stable</a> (don't share state like Timer with each other / this main WebApp).</i>
            </React.Fragment>
            :
            <i>Switch <a href="https://kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">back to the main WebApp</a> or continue to use the seperate WebApps for <a href="https://beta--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">beta</a> or  <a href="https://master--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">stable</a> (don't share state like Timer with each other and the main WebApp).</i>
          }
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(InfoDialog);
