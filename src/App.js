import React, {useState, useContext, useCallback } from 'react';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Hidden from '@material-ui/core/Hidden';
import Badge from '@material-ui/core/Badge';
import LockOpenTwoToneIcon from '@material-ui/icons/LockOpenTwoTone';
import LockTwoToneIcon from '@material-ui/icons/LockTwoTone';
import TimerTwoToneIcon from '@material-ui/icons/TimerTwoTone';
import InfoTwoToneIcon from '@material-ui/icons/InfoTwoTone';
import InvertColorsTwoToneIcon from '@material-ui/icons/InvertColorsTwoTone';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import InfoDialog from './InfoDialog'
import CustomThemeDialog from './CustomThemeDialog'
import { TimerContext } from './util';

const KSversion = 'v0.2'
const lastVersion = localStorage.getItem('lastVersion');

const useStyles = makeStyles({
  grow: {
    flexGrow: 1
  }
});

function TabPanel(props){
  const { children, value, index } = props;
  // console.log("render App TabPanel: ", value, index);

  return (
    <Typography component="div" role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

const TimerTabLabelTimer = React.memo((props) => {
  // console.log("render App TimerTab LabelTimer");
  const now = useContext(TimerContext);

  const td = new Date(props.timestamp) - now;
  const d = Math.floor(td / (1000 * 60 * 60 * 24));
  const h = Math.floor((td / (1000 * 60 * 60)) % 24);
  const m = Math.floor((td / 1000 / 60) % 60);
  const s = Math.floor((td / 1000) % 60);
  const label = `${d}d ${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  return <Chip size="small" label={label} color="secondary" />;
});

const TimerTab = React.memo((props) => {
  // console.log("render App TimerTab");
  let label = "Timers";
  const count = props.timers.length;
  const now = new Date();
  if (count > 0){
    // ToDo: calculate current index only once while loading/adding/deleting timers and when timer runs out => next
    let currentIndex = -1;
    for (let i = 0; i < props.timers.length; i++){
      if (new Date(props.timers[i].timestamp) > now){
        currentIndex = i;
        break;
      }
    }
    if (currentIndex > -1){
      label = <TimerTabLabelTimer timestamp={props.timers[currentIndex].timestamp} />;
    }
  }

  return (
    <Tab label={label} icon={<Badge badgeContent={count} color="secondary"><TimerTwoToneIcon /></Badge>} value={2} disabled={!count}/>
  );
});

function App(props){
  // console.log("render App");
  const [timers, setTimers] = useState(() => JSON.parse(localStorage.getItem('timers')) || []);
  const [tab, setTab] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(KSversion !== lastVersion);
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const classes = useStyles();

  const addTimers = useCallback((t) => {
    const sorted = timers.concat([t]).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    setTimers(sorted);
    localStorage.setItem('timers', JSON.stringify(sorted));
  }, [timers]);

  const handleChangeTab = (e, newTab) => {
    if (newTab === 2){
      return;
    }
    setTab(newTab);
  };
  const handleInfoDialogOpen = () => setInfoDialogOpen(true);

  const handleCustomThemeOpen = () => setCustomThemeOpen(true);

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            <span role="img" aria-label="KittenSafe emoji">😺🔒</span> KittenSafe
          </Typography>
          <Hidden smDown>
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered>
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
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} variant="fullWidth" centered>
              <Tab label="Encryption" icon={<LockTwoToneIcon />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoToneIcon />} value={1} />
              <TimerTab timers={timers} />
            </Tabs>
          </Toolbar>
        </Hidden>
      </AppBar>
      <TabPanel value={tab} index={0}>
        <EncryptionPanel addTimers={addTimers} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <DecryptionPanel addTimers={addTimers} timers={timers} />
      </TabPanel>
      <CustomThemeDialog open={customThemeOpen} setOpen={setCustomThemeOpen} setTheme={props.setTheme} />
      <InfoDialog open={infoDialogOpen} setOpen={setInfoDialogOpen} version={KSversion} />
    </React.Fragment>
  );
}

export default React.memo(App);
