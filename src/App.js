import React, { useState, useCallback } from 'react';
import { AppBar, Badge, Box, CssBaseline, Hidden, IconButton, Tabs, Tab, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { LockOpenTwoTone, LockTwoTone, InfoTwoTone, InvertColorsTwoTone } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import InfoDialog from './InfoDialog';
import CustomThemeDialog from './CustomThemeDialog';
import TimerPanel, { TimerTab } from './Timers';

const KSversion = 'v0.3';
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
    // ToDo: Implement this
    let ts = {...timers};
    delete ts.id;
    setTimers(ts);
    localStorage.setItem('timers', JSON.stringify(ts));
  }, [timers]);

  const handleChangeTab = (e, newTab) => {
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
              <Tab label="Encryption" icon={<LockTwoTone />} value={0} />
              <Tab label="Decryption" icon={<LockOpenTwoTone />} value={1} />
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} />
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
              <TimerTab timers={timers} pinnedTimer={pinnedTimer} />
            </Tabs>
          </Toolbar>
        </Hidden>
      </AppBar>
      <TabPanel value={tab} index={0}>
        <EncryptionPanel addTimers={addTimer} setPinnedTimer={setPinnedTimer} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <DecryptionPanel addTimers={addTimer} timers={timers} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <TimerPanel timers={timers} pinnedTimer={pinnedTimer} setPinnedTimer={setPinnedTimer} deleteTimer={deleteTimer}/>
      </TabPanel>
      <CustomThemeDialog open={customThemeOpen} setOpen={setCustomThemeOpen} setTheme={props.setTheme} />
      <InfoDialog open={infoDialogOpen} setOpen={setInfoDialogOpen} version={KSversion} />
    </React.Fragment>
  );
}

export default React.memo(App);
