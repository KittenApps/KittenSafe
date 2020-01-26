import React, {useState} from 'react';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import CssBaseline from '@material-ui/core/CssBaseline';
import DateFnsUtils from '@date-io/date-fns';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Hidden from '@material-ui/core/Hidden';
import Badge from '@material-ui/core/Badge';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import LockOpenTwoToneIcon from '@material-ui/icons/LockOpenTwoTone';
import LockTwoToneIcon from '@material-ui/icons/LockTwoTone';
import TimerTwoToneIcon from '@material-ui/icons/TimerTwoTone';
import InfoTwoToneIcon from '@material-ui/icons/InfoTwoTone';
import InvertColorsTwoToneIcon from '@material-ui/icons/InvertColorsTwoTone';
import Tooltip from '@material-ui/core/Tooltip';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, makeStyles, ThemeProvider, useTheme } from '@material-ui/core/styles';

const KSversion = 'v0.2'
const lastVersion = localStorage.getItem('lastVersion');

const useStyles = makeStyles({
  grow: {
    flexGrow: 1
  }
});

const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23').split('|');

function TabPanel(props) {
  const { children, value, index } = props;

  return (
    <Typography component="div" role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

function TimerTab(props){
  const [timerRedraw, setTimerRedraw] = useState(true);
  let label = "Timers";
  const count = props.timers.length;
  if (count > 0){
    const now = new Date();
    // ToDo: calculate current index only once while loading/adding/deleting timers and when timer runs out => next
    let currentIndex = -1;
    for (let i = 0; i < props.timers.length; i++){
      if (new Date(props.timers[i].timestamp) > now){
        currentIndex = i;
        break;
      }
    }
    if (currentIndex > -1){
      const td = new Date(props.timers[currentIndex].timestamp) - now;
      const d = Math.floor(td / (1000 * 60 * 60 * 24));
      const h = Math.floor((td / (1000 * 60 * 60)) % 24);
      const m = Math.floor((td / 1000 / 60) % 60);
      const s = Math.floor((td / 1000) % 60);
      label = `${d}d ${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
      label = <Chip size="small" label={label} color="secondary" />;
      setTimeout(() => {
        setTimerRedraw(!timerRedraw);
      }, 1000);
    }
  }

  return (
    <Tab label={label} icon={<Badge badgeContent={count} color="secondary"><TimerTwoToneIcon /></Badge>} value={2} disabled={!count}/>
  );
}

function App() {
  const [timers, setTimers] = useState(() => JSON.parse(localStorage.getItem('timers')) || []);
  const [tab, setTab] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(KSversion !== lastVersion);
  const [infoTab, setInfoTab] = useState(0);
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const [customThemePrim, setCustomThemePrim] = useState(themeColors[0]);
  const [customThemeSec, setCustomThemeSec] = useState(themeColors[1]);
  const [theme, setThema] = useState(() => createMuiTheme({palette: {primary: {main: customThemePrim}, secondary: {main: customThemeSec}}}));
  const classes = useStyles();

  const addTimers = (t) => {
    const sorted = timers.concat([t]).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setTimers(sorted);
    localStorage.setItem('timers', JSON.stringify(sorted));
  };

  const handleChangeTab = (e, newTab) => {
    if (newTab === 2){
      return;
    }
    setTab(newTab);
  };
  const handleInfoDialogOpen = () => setInfoDialogOpen(true);
  const handleInfoDialogClose = () => {
    localStorage.setItem('lastVersion', KSversion);
    setInfoDialogOpen(false);
  };
  const handleInfoTabChange = (e, newTab) => setInfoTab(newTab);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));

  const handleCustomThemeOpen = () => setCustomThemeOpen(true);
  const handleCustomThemeClose = () => setCustomThemeOpen(false);
  const handleThemePrimColorChange = (e) => setCustomThemePrim(e.target.value);
  const handleThemeSecColorChange = (e) => setCustomThemeSec(e.target.value);
  const handleCustomThemeApply = () => {
    localStorage.setItem('customThemeColors', `${customThemePrim}|${customThemeSec}`);
    setThema(createMuiTheme({palette: {primary: {main: customThemePrim}, secondary: {main: customThemeSec}}}));
    setCustomThemeOpen(false);
  };
  const handleCustomThemeReset = () => {
    setCustomThemePrim('#006302');
    setCustomThemeSec('#00ba23');
    localStorage.removeItem('customThemeColors');
    setThema(createMuiTheme({palette: {primary: {main: '#006302'}, secondary: {main: '#00ba23'}}}));
    setCustomThemeOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">
              <span role="img" aria-label="KittenSafe emoji">😺🔒</span> KittenSafe
            </Typography>
            <Hidden smDown>
              <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered >
                <Tab label="Encryption" icon={<LockTwoToneIcon />} value={0} />
                <Tab label="Decryption" icon={<LockOpenTwoToneIcon />} value={1} />
                <TimerTab timers={timers} />
              </Tabs>
            </Hidden>
            <Box display={{ xs: 'block', md: 'none' }} className={classes.grow}/>
            <Tooltip title="Customize theme colors" arrow>
              <IconButton color="inherit" onClick={handleCustomThemeOpen}>
                <InvertColorsTwoToneIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Info / Help / Release Notes" arrow>
              <IconButton color="inherit" onClick={handleInfoDialogOpen}>
                <Badge badgeContent={KSversion} color="secondary">
                  <InfoTwoToneIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Toolbar>
          <Hidden mdUp>
            <Toolbar >
              <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} variant="fullWidth" centered >
                <Tab label="Encryption" icon={<LockTwoToneIcon />} value={0} />
                <Tab label="Decryption" icon={<LockOpenTwoToneIcon />} value={1} />
                <TimerTab timers={timers} />
              </Tabs>
            </Toolbar>
          </Hidden>
        </AppBar>
        <TabPanel value={tab} index={0}>
          <EncryptionPanel addTimers={addTimers}/>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <DecryptionPanel addTimers={addTimers} timers={timers.map(t => t.id)}/>
        </TabPanel>
        <Dialog open={customThemeOpen} onClose={handleCustomThemeClose}>
          <DialogTitle>Customize theme colors</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={6} key="primaryColor"><TextField label="primary color" type="color" value={customThemePrim} onChange={handleThemePrimColorChange} fullWidth/></Grid>
              <Grid item xs={6} key="secondaryColor"><TextField label="secondary color" type="color" value={customThemeSec} onChange={handleThemeSecColorChange} fullWidth/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCustomThemeReset} color="secondary">
              Reset to default theme
            </Button>
            <Button onClick={handleCustomThemeApply} color="primary">
              Apply theme colors
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={infoDialogOpen} onClose={handleInfoDialogClose} fullScreen={fullScreen} maxWidth="xl">
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
              <Box textAlign="center" component="h2">Welcome to KittenSafe {KSversion} <span role="img" aria-label="KittenSafe emoji">😺🔒</span></Box>
              <Box textAlign="center" fontStyle="italic">A secure WebApp to encrypt your files for delayed access until a preselected timestamp.</Box>
              <Box textAlign="center" fontStyle="italic">It's 100% privacy friendly too, because your files never leave your device (as encrypting them is done locally using the WebCrypto API).</Box>
              <Box textAlign="center" fontStyle="italic">Also no personal data is stored on our stateless servers (no DB used), because it uses some fancy crypto methods to derive the encryption key based on the given timestamp.</Box>
              <Box textAlign="center" fontStyle="italic">For more information about how KittenSafe works, check out the Info tab at the top of this dialog box.</Box>
              <Box textAlign="center" fontStyle="italic">Note: You can reopen this dialog whenever you want by clicking the question mark in the top right corner (of the appbar).</Box>
            </TabPanel>
            <TabPanel value={infoTab} index={1}>
              <ul>
                <li>After selecting the input file and a timestamp, until the file should be encrypted and inaccessable for the users, a random 256 bit AES key is generated locally.</li>
                <li>This key is than used to encrypt the file locally in the webclient using AES-256-GCM (your personal files are never send to out servers).</li>
                <li>A webrequest is made to the encryption endpoint of our stateless Netlify functions aka AWS lambda webservice with the exported key (used to encrypt the file locally) and the timestamp (until decryption should be impossible):</li>
                <ul>
                  <li>The webservice derives a secret server key based on the timestamp and a server secret using scrypt.</li>
                  <li>Than it decrypts the client side key using AES-256-GCM too and sends the result (encrypted key, timestamp, initializing vector, authentication tag) back to the user.</li>
                  <li>Note: The timestamp is actually part of the secret and trying to cheat by changing it won't work, because the decryption would just derive a completly different key than the one used for encryption and fail during decryption.</li>
                </ul>
                <li>Then the ecrypted data is written to the KittenSafe output file (.ksf) together with some metadata containing all values necesarry for decryption and some file specific metadata. You are free to send the encrypted file to another person too, because they will get everythink necesarry to decrypt the file later (after the given timestamp is up) on their own.</li>
                <li>After that we forget the plain text encryption key and you are encourage to delete the plain text input file too (unless you decrypted it for someone else to retrieve later).</li>
                <li>Later when trying to decryp the KittenSafe file we read in a meta data to dertermine if the file is ready for decryption or if we still have to show you a decryption countdown.</li>
                <li>When the time is up we make a webrequest to the decryption endpoint of our webservice containing the result we got previously during encryption (encrypted key, timestamp, iv, autheTag) from it.</li>
                <ul>
                  <li>The webservice first validates if the used timestamp is now really in the past and would throw an error otherwise</li>
                  <li>Than again the same key (as the one used for encryption) is derived using scrypt from the timestamp and the server secret.</li>
                  <li>Finally we decrypt the client side key using AES-256-GCM again and returing the decryped client key back to the user.</li>
                  <li>Note: Faking the timestamp here would result in a diferent key being direved using scrypt and the AES-256-GCM decryption would fail (we can detect that using the authTag) and we would return an error to the user.</li>
                </ul>
                <li>After getting the decryped client key back from the server we can use it (together with other data stored with the file) to finally decrypt the file locally and restore it's original state.</li>
              </ul>
            </TabPanel>
            <TabPanel value={infoTab} index={2}>
              <b>KittenSafe v0.2</b>
              <ul>
                <li>new fancy React Material UI</li>
              </ul>
            </TabPanel>
            <TabPanel value={infoTab} index={3}>
              <b>Roadmap:</b>
              <ul>
                <li>add basic Timer support</li>
                <li>code cleanup and polishing (iterate and improve nearly every component)</li>
                <li>better file-previews and input editing / text input (markdown support)</li>
                <li>Timers 2.0</li>
              </ul>
              <i>You could also check out the more up to date and maybe slightly less stable <a href="https://beta--kittensafe.netlify.com" target="_blank" rel="noopener noreferrer">beta version of KittenSafe here</a>.</i>
            </TabPanel>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleInfoDialogClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  );
}

export default App;
