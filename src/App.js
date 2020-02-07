import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { AppBar, Badge, Box, CssBaseline, Hidden, IconButton, Tabs, Tab, Toolbar, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { LockOpenTwoTone, LockTwoTone, InfoTwoTone, InvertColorsTwoTone } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import InfoDialog from './InfoDialog';
import CustomThemeDialog from './CustomThemeDialog';
import TimerDrawer, { TimerTab } from './Timers';

const KSversion = 'v0.3';
const lastVersion = localStorage.getItem('lastVersion');

const useStyles = makeStyles(theme => ({
  root: {
    [theme.breakpoints.up('md')]: {
      display: 'flex'
    }
  },
  grow: {
    flexGrow: 1
  },
  content: {
    [theme.breakpoints.up('md')]: {
      flexGrow: 1,
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginRight: -320
    }
  },
  contentShift: {
    [theme.breakpoints.up('md')]: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0
    }
  },
  appBar: {
    [theme.breakpoints.up('md')]: {
      zIndex: theme.zIndex.drawer + 50
    }
  }
}));

function TabPanel(props){
  const { children, value, index } = props;
  // console.log("render App TabPanel: ", value, index);

  return (
    <Typography component="div" role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

function App(props){
  // console.log("render App");
  const [timers, setTimers] = useState(() => {
    let t = JSON.parse(localStorage.getItem('timers')) || {};
    // ToDo: remove migration code:
    if (Array.isArray(t)){
      localStorage.setItem('timers', '{}');
      return {};
    }
    return t;
  });
  const [pinnedTimer, setPinnedTimer] = useState(() => {
    const now = new Date();
    let index = null;
    let timediff = Infinity;
    for (let t in timers){
      const td = new Date(timers[t].timestamp) - now;
      if (td > 0 && td < timediff){
        timediff = td;
        index = t;
      }
    }
    return index;
  });
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'), {noSsr: true});
  const [timerDrawerOpen, setTimerDrawerOpen] = useState(() => {
    if (Object.keys(timers).length === 0) return false;
    return isDesktop;
  });

  const [tab, setTab] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(KSversion !== lastVersion);
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const classes = useStyles();

  const addTimer = useCallback((id, t) => {
    const ts = {[id]: t, ...timers};
    setTimers(ts);
    localStorage.setItem('timers', JSON.stringify(ts));
  }, [timers]);

  const deleteTimer = useCallback((id) => {
    console.log('delete: ', id);
    let ts = {...timers};
    delete ts[id];
    // ToDo: Handle deleting pinned timer
    setTimers(ts);
    localStorage.setItem('timers', JSON.stringify(ts));
  }, [timers]);

  const toggleTimerDrawer = useCallback(() => setTimerDrawerOpen(!timerDrawerOpen), [timerDrawerOpen]);

  const handleChangeTab = (e, newTab) => {
    setTab(newTab);
  };
  const handleInfoDialogOpen = () => setInfoDialogOpen(true);

  const handleCustomThemeOpen = () => setCustomThemeOpen(true);

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="sticky" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6">
            <span role="img" aria-label="KittenSafe emoji">😺🔒</span> KittenSafe
          </Typography>
          <Hidden smDown>
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered>
              <Tab label="Encryption" icon={<LockTwoTone />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone />} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          </Hidden>
          <Box display={{ xs: 'block', md: 'none' }} className={classes.grow} />
          <Tooltip title="Customize theme colors" arrow>
            <IconButton color="inherit" onClick={handleCustomThemeOpen}>
              <InvertColorsTwoTone />
            </IconButton>
          </Tooltip>
          <Tooltip title="Info / Help / Release Notes" arrow>
            <IconButton color="inherit" onClick={handleInfoDialogOpen}>
              <Badge badgeContent={KSversion} color="secondary">
                <InfoTwoTone />
              </Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Hidden mdUp>
          <Toolbar>
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} variant="fullWidth" centered>
              <Tab label="Encryption" icon={<LockTwoTone />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone />} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          </Toolbar>
        </Hidden>
      </AppBar>
      <main className={classes.root} >
        <div className={clsx(classes.content, {[classes.contentShift]: timerDrawerOpen})} >
          <TabPanel value={tab} index={0} >
            <EncryptionPanel addTimers={addTimer} setPinnedTimer={setPinnedTimer} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <DecryptionPanel addTimers={addTimer} timers={timers} />
          </TabPanel>
        </div>
        <TimerDrawer open={timerDrawerOpen} setOpen={setTimerDrawerOpen} timers={timers} pinnedTimer={pinnedTimer} setPinnedTimer={setPinnedTimer} deleteTimer={deleteTimer}/>
      </main>
      <CustomThemeDialog open={customThemeOpen} setOpen={setCustomThemeOpen} setTheme={props.setTheme} />
      <InfoDialog open={infoDialogOpen} setOpen={setInfoDialogOpen} version={KSversion} />
    </React.Fragment>
  );
}

export default React.memo(App);
