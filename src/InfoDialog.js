import React, {useState} from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';

const TabPanel = React.memo((props) => {
  const { children, value, index } = props;
  // console.log("render InfoDialog TabPanel: ", value, index);

  return (
    <Typography component="div" role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}, (prev, next) => {
  return prev.value !== prev.index && next.value !== next.index;
});

function InfoDialog(props){
  // console.log("render InfoDialog");
  const [infoTab, setInfoTab] = useState(0);
  const handleInfoTabChange = (e, newTab) => setInfoTab(newTab);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));

  const handleClose = () => {
    localStorage.setItem('lastVersion', props.version);
    props.setOpen(false);
  };

  return (
    <Dialog open={props.open} onClose={handleClose} fullScreen={fullScreen} maxWidth="xl">
      <Paper square>
        <Tabs value={infoTab} indicatorColor="primary" textColor="primary" variant="fullWidth" onChange={handleInfoTabChange}>
          <Tab label="Welcome" value={0} />
          <Tab label="Info" value={1} />
          <Tab label="Release Notes" value={2} />
          <Tab label="Roadmap" value={3} />
        </Tabs>
      </Paper>
      <DialogContent>
        <TabPanel value={infoTab} index={0}>
          <Box textAlign="center" component="h2">Welcome to KittenSafe {props.version} <span role="img" aria-label="KittenSafe emoji">😺🔒</span></Box>
          <Box textAlign="center" fontStyle="italic">A secure WebApp to encrypt your files for delayed access until a preselected timestamp.</Box>
          <Box textAlign="center" fontStyle="italic">It is 100% privacy friendly too, because your files never leave your device (as encrypting them is done locally using the WebCrypto API).</Box>
          <Box textAlign="center" fontStyle="italic">Also no personal data is stored on our stateless servers (no database used), because it uses some fancy crypto methods to derive the encryption key based on the given timestamp.</Box>
          <Box textAlign="center" fontStyle="italic">For more background information on how KittenSafe works, check out the Info tab at the top of this dialog box.</Box>
          <Box textAlign="center" fontStyle="italic">Note: You can reopen this dialog whenever you want by clicking the question mark in the top right corner (of the appbar).</Box>
        </TabPanel>
        <TabPanel value={infoTab} index={1}>
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
        <TabPanel value={infoTab} index={2}>
          <b>KittenSafe v0.2</b>
          <ul>
            <li>new fancy React Material UI</li>
            <li>basic Timmer support (WIP)</li>
          </ul>
        </TabPanel>
        <TabPanel value={infoTab} index={3}>
          <b>Roadmap:</b>
          <ul>
            <li>code cleanup and polishing (iterate and improve nearly every component)</li>
            <li>better file-previews and input editing / text input (markdown support)</li>
            <li>Timers 2.0</li>
          </ul>
          <i>You could also check out the more up to date and maybe slightly less stable <a href="https://beta--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">beta version of KittenSafe here</a>.</i>
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
