import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { AppBar, Badge, Box, Button, CssBaseline, IconButton, Snackbar, Tabs, Tab, Toolbar, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { LockOpenTwoTone, LockTwoTone, InfoTwoTone, InvertColorsTwoTone } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import InfoDialog from './InfoDialog';
import CustomThemeDialog from './CustomThemeDialog';
import TimerDrawer, { TimerTab } from './Timers';
import { register } from './serviceWorker';

const KSversion = 'v0.3.1';

const useStyles = makeStyles(theme => ({
  root: {
    overflow: 'scroll',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 136,
    [theme.breakpoints.down('sm')]: {
      top: 128
    },
    [theme.breakpoints.up('md')]: {
      display: 'flex',
      top: 72
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
    return isDesktop || !navigator.onLine;
  });

  const isMobile = useMediaQuery(useTheme().breakpoints.down('xs'), {noSsr: true});

  const [tab, setTab] = useState(0);
  const [infoDialogOpen, setInfoDialogOpen] = useState(() => localStorage.getItem('lastVersion') !== KSversion);
  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const classes = useStyles();

  const addTimer = useCallback((id, t, pin) => {
    const ts = {[id]: t, ...timers};
    setTimers(ts);
    if ((pin || !pinnedTimer) && new Date(t.timestamp) > new Date()){
      setPinnedTimer(id);
    }
    localStorage.setItem('timers', JSON.stringify(ts));
  }, [timers, pinnedTimer]);

  const deleteTimer = useCallback((id) => {
    let ts = {...timers};
    delete ts[id];
    if (id === pinnedTimer){
      const now = new Date();
      let index = null;
      let timediff = Infinity;
      for (let t in ts){
        const td = new Date(ts[t].timestamp) - now;
        if (td > 0 && td < timediff){
          timediff = td;
          index = t;
        }
      }
      setPinnedTimer(index);
    }
    if (Object.keys(ts).length === 0){
      setTimerDrawerOpen(false);
    }
    setTimers(ts);
    localStorage.setItem('timers', JSON.stringify(ts));
  }, [timers, pinnedTimer]);

  const toggleTimerDrawer = useCallback(() => setTimerDrawerOpen(!timerDrawerOpen), [timerDrawerOpen]);

  const handleChangeTab = (e, newTab) => {
    setTab(newTab);
  };
  const handleInfoDialogOpen = () => setInfoDialogOpen(true);
  const handleCustomThemeOpen = () => setCustomThemeOpen(true);

  const [waitingServiceWorker, setWaitingServiceWorker] = React.useState(null);
  const [assetsUpdateReady, setAssetsUpdateReady] = React.useState(false);
  const [assetsCached, setAssetsCached] = React.useState(false);
  React.useEffect(() => register({
    onUpdate: reg => {setWaitingServiceWorker(reg.waiting);setAssetsUpdateReady(true);},
    onSuccess: () => setAssetsCached(true)
  }), []);
  const updateAssets = () => {
    waitingServiceWorker.addEventListener("statechange", e => {
      if (e.target.state === "activated") window.location.reload();
    });
    waitingServiceWorker.postMessage({type: "SKIP_WAITING"});
  };
  const handleAssetsCachedClose = () => setAssetsCached(false);
  const handleAssetsUpdateReadyClose = () => setAssetsUpdateReady(false);

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6">
            <span role="img" aria-label="KittenSafe emoji">😺🔒</span> KittenSafe
          </Typography>
          {isDesktop &&
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered>
              <Tab label="Encryption" icon={<LockTwoTone />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone />} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          }
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
        {!isDesktop &&
          <Toolbar>
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} variant="fullWidth" centered>
              <Tab label="Encryption" icon={<LockTwoTone />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone />} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          </Toolbar>
        }
      </AppBar>
      <main className={classes.root} >
        <div className={clsx(classes.content, {[classes.contentShift]: timerDrawerOpen})} >
          <Typography component="div" role="tabpanel" hidden={tab !== 0}>
            <Box p={isMobile ? 0 : 3}>
              <EncryptionPanel addTimers={addTimer} />
            </Box>
          </Typography>
          <Typography component="div" role="tabpanel" hidden={tab !== 1}>
            <Box p={isMobile ? 0 : 3}>
              <DecryptionPanel addTimers={addTimer} timers={timers} deleteTimer={deleteTimer} />
            </Box>
          </Typography>
        </div>
        <TimerDrawer open={timerDrawerOpen} setOpen={setTimerDrawerOpen} timers={timers} pinnedTimer={pinnedTimer} setPinnedTimer={setPinnedTimer} deleteTimer={deleteTimer}/>
      </main>
      <CustomThemeDialog open={customThemeOpen} setOpen={setCustomThemeOpen} setTheme={props.setTheme} />
      <InfoDialog open={infoDialogOpen} setOpen={setInfoDialogOpen} version={KSversion} />
      <Snackbar open={assetsCached} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert variant="filled" elevation={6} onClose={handleAssetsCachedClose} severity="success">
          <AlertTitle>ServiceWorker successfully registered!</AlertTitle>
          This page is now available offline! You can check out your timers without internet access. However encrypting and decrypting still requires network access.
        </Alert>
      </Snackbar>
      <Snackbar open={assetsUpdateReady} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert variant="filled" elevation={6} action={<div><Button variant="outlined" color="inherit" onClick={updateAssets} size="small">Reload and Update now</Button><Button variant="outlined" color="inherit" onClick={handleAssetsUpdateReadyClose} size="small">Close and update later</Button></div>}  severity="warning">
        <AlertTitle>A new KittenSafe update is available!</AlertTitle>
        A new update is available for KittenSafe. To update to the latest version you have to reload the page.
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
}

export default React.memo(App);
