import React, {useState} from 'react';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import CssBaseline from '@material-ui/core/CssBaseline';
import DateFnsUtils from '@date-io/date-fns';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
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

function App() {
  const [tab, setTab] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoTab, setInfoTab] = useState(0);
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const [customThemePrim, setCustomThemePrim] = useState(themeColors[0]);
  const [customThemeSec, setCustomThemeSec] = useState(themeColors[1]);
  const [theme, setThema] = useState(() => createMuiTheme({palette: {primary: {main: customThemePrim}, secondary: {main: customThemeSec}}}));
  const classes = useStyles();

  const handleChangeTab = (e, newTab) => setTab(newTab);
  const handleInfoDialogOpen = () => setInfoDialogOpen(true);
  const handleInfoDialogClose = () => setInfoDialogOpen(false);
  const handleInfoTabChange = (e, newTab) => setInfoTab(newTab);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('xs'));

  const handleCustomThemeOpen = () => setCustomThemeOpen(true);
  const handleCustomThemeClose = () => setCustomThemeOpen(false);
  const handleThemePrimColorChange = (e) => setCustomThemePrim(e.target.value);
  const handleThemeSecColorChange = (e) => setCustomThemeSec(e.target.value);
  const handleCustomThemeApply = () => {
    localStorage.setItem('customThemeColors', `${customThemePrim}|${customThemeSec}`);
    console.log(localStorage.getItem('customThemeColors'));
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
            <IconButton edge="start" color="inherit" aria-label="menu" disabled>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">
              <span role="img" aria-label="grinning cat face">😺</span> KittenSafe
            </Typography>
            <Hidden smDown>
              <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered >
                <Tab label="Encryption" icon={<LockTwoToneIcon />} value={0} />
                <Tab label="Decryption" icon={<LockOpenTwoToneIcon />} value={1} />
                <Tab label="Timers" icon={<Badge badgeContent={2} color="secondary"><TimerTwoToneIcon /></Badge>} value={2} disabled/>
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
                <Badge badgeContent="v0.1" color="secondary">
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
                <Tab label="Timers" icon={<Badge badgeContent={2} color="secondary"><TimerTwoToneIcon /></Badge>} value={3} disabled/>
              </Tabs>
            </Toolbar>
          </Hidden>
        </AppBar>
        <TabPanel value={tab} index={0}>
          <EncryptionPanel />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <DecryptionPanel />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          ToDo
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
        <Dialog open={infoDialogOpen} onClose={handleInfoDialogClose} fullScreen={fullScreen}>
          <Paper square>
            <Tabs value={infoTab} indicatorColor="primary" textColor="primary" variant="fullWidth" onChange={handleInfoTabChange}>
              <Tab label="Info" value={0} />
              <Tab label="Help" value={1} />
              <Tab label="Release Notes" value={2} />
            </Tabs>
          </Paper>
          <DialogContent>
            <TabPanel value={infoTab} index={0}>
              <h3>Welcome to KittenSafe v0.1 <span role="img" aria-label="grinning cat face">😺</span></h3>
              <i>
                A secure WebApp to encrypt your files for delayed access until a preselected Timetsamp.
                It's 100% privacy friendly too, because your files never leave your device (as encrypting them is done locally using the WebCrypto API).
                Also no personal data is stored on our stateless servers (no DB used), because it uses some fancy crypto methods to derive the encryption key based on the given timestamp.
              </i>
            </TabPanel>
            <TabPanel value={infoTab} index={1}>
              <i>ToDo: Explain everything in more detail here</i>
            </TabPanel>
            <TabPanel value={infoTab} index={2}>
              <b>KittenSafe v0.1</b>
              <ul>
                <li>new fancy React Material UI</li>
              </ul>
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
