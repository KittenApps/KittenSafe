import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { AppBar, Badge, Box, Button, CssBaseline, IconButton, Snackbar, Tabs, Tab, Toolbar, Tooltip, Typography, useMediaQuery } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';
import { LockOpenTwoTone, LockTwoTone, InfoTwoTone, InvertColorsTwoTone, Close } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import InfoDialog from './InfoDialog';
import CustomThemeDialog from './CustomThemeDialog';
import TimerDrawer, { TimerTab } from './Timers';
import { register } from './serviceWorker';

const KSversion = 'v0.4.0';
const isBeta = process.env.REACT_APP_BRANCH === 'beta';

const useStyles = makeStyles(theme => ({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 136,
    overflow: 'auto',
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
      overflowX: 'hidden',
      flexGrow: 1,
      marginRight: -320,
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      })
    }
  },
  contentShift: {
    [theme.breakpoints.up('md')]: {
      overflowX: 'hidden',
      marginRight: 0,
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      })
    }
  },
  appBar: {
    [theme.breakpoints.up('md')]: {
      zIndex: theme.zIndex.drawer + 50
    }
  },
  betaBadge: {
    marginRight: -10
  },
  versionBadge: {
    marginTop: -3,
    marginRight: -9
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
    let deletedPinned = false;
    let ts = {...timers};
    const now = new Date();
    if (id === 'finished'){
      for (let t in ts){
        if (new Date(ts[t].timestamp) < now){
          delete ts[t];
          if (t === pinnedTimer) deletedPinned = true;
        }
      }
    } else {
      delete ts[id];
      if (id === pinnedTimer) deletedPinned = true;
    }
    if (deletedPinned){
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

  const [waitingServiceWorker, setWaitingServiceWorker] = useState(null);
  const [assetsUpdateReady, setAssetsUpdateReady] = useState(false);
  const [assetsCached, setAssetsCached] = useState(false);
  useEffect(() => register({
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
  const [installPrompt, setInstallPrompt] = useState(null);
  useEffect(() => window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setInstallPrompt(e);
    return () => setInstallPrompt(null);
  }), []);
  const handlePWAClose = () =>  setInstallPrompt(null);
  const handlePWAInstall = () => {installPrompt.prompt();setInstallPrompt(null);}

  return (
    <React.Fragment>
      <CssBaseline />
      <AppBar position="fixed" elevation={12} className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6">
            <Badge badgeContent={isBeta ? 'beta' : 0} classes={{badge: classes.betaBadge}} color="secondary"><span role="img" aria-label="KittenSafe emoji">😺🔒</span> KittenSafe</Badge>
          </Typography>
          {isDesktop &&
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered>
              <Tab label="Encryption" icon={<LockTwoTone/>} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone/>} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          }
          <Box display={{xs: 'block', md: 'none'}} className={classes.grow} />
          <Tooltip title="Customize theme colors" arrow>
            <IconButton color="inherit" onClick={handleCustomThemeOpen}><InvertColorsTwoTone/></IconButton>
          </Tooltip>
          <Tooltip title="Info / Help / Release Notes" arrow>
            <IconButton color="inherit" onClick={handleInfoDialogOpen}>
              <Badge badgeContent={KSversion} classes={{badge: classes.versionBadge}} color="secondary"><InfoTwoTone/></Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
        {!isDesktop &&
          <Toolbar>
            <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} variant="fullWidth" centered>
              <Tab label="Encryption" icon={<LockTwoTone/>} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone/>} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} toggleDrawer={toggleTimerDrawer} />
            </Tabs>
          </Toolbar>
        }
      </AppBar>
      <main className={classes.root} >
        <div className={clsx(classes.content, {[classes.contentShift]: timerDrawerOpen})} >
          <Typography component="div" role="tabpanel" hidden={tab !== 0}>
            <Box p={{xs: 0, sm: 3}} >
              <EncryptionPanel addTimers={addTimer} hidden={tab !== 0} />
            </Box>
          </Typography>
          <Typography component="div" role="tabpanel" hidden={tab !== 1}>
            <Box p={{xs: 0, sm: 3}} >
              <DecryptionPanel addTimers={addTimer} timers={timers} deleteTimer={deleteTimer} pinnedTimer={pinnedTimer} setPinnedTimer={setPinnedTimer} hidden={tab !== 1} />
            </Box>
          </Typography>
        </div>
        <TimerDrawer open={timerDrawerOpen} setOpen={setTimerDrawerOpen} timers={timers} pinnedTimer={pinnedTimer} setPinnedTimer={setPinnedTimer} deleteTimer={deleteTimer}/>
      </main>
      {customThemeOpen && <CustomThemeDialog open={customThemeOpen} setOpen={setCustomThemeOpen} setTheme={props.setTheme} />}
      {infoDialogOpen && <InfoDialog open={infoDialogOpen} setOpen={setInfoDialogOpen} version={KSversion} />}
      {assetsCached &&
        <Snackbar open={assetsCached} >
          <Alert variant="filled" elevation={6} onClose={handleAssetsCachedClose} severity="success">
            <AlertTitle>ServiceWorker successfully registered!</AlertTitle>
            This page is now available offline! You can check out your timers without internet access. However encrypting and decrypting still requires network access.
          </Alert>
        </Snackbar>
      }
      {assetsUpdateReady &&
        <Snackbar open={assetsUpdateReady} >
          <Alert variant="filled" elevation={6} action={<div><Button variant="outlined" color="inherit" onClick={updateAssets} style={{marginBottom: 10}} size="small">Reload and Update now</Button><Button variant="outlined" color="inherit" onClick={handleAssetsUpdateReadyClose} size="small">Close and update later</Button></div>}  severity="warning">
          <AlertTitle>A new KittenSafe update is available!</AlertTitle>
          A new update is available for KittenSafe. To update to the latest version you have to reload the page.
          </Alert>
        </Snackbar>
      }
      {installPrompt &&
        <Snackbar open={installPrompt} autoHideDuration={15000} onClose={handlePWAClose} message="Do you want to add KittenSafe to your Home screen?"
          action={
            <React.Fragment>
              <Button color="secondary" size="small" onClick={handlePWAInstall}>Install</Button>
              <IconButton size="small" aria-label="close" color="inherit" onClick={handlePWAClose}><Close fontSize="small"/></IconButton>
            </React.Fragment>
          } />
      }
    </React.Fragment>
  );
}

export default React.memo(App);
