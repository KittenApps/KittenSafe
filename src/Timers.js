import React, { useContext } from 'react';
import { Badge, Chip, Divider, Drawer, SwipeableDrawer, IconButton, Tab, useMediaQuery } from '@material-ui/core';
import { TimerTwoTone, CloseTwoTone } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { TimerContext } from './util';

const useStyles = makeStyles(theme => ({
  drawer: {
    width: 240,
    flexShrink: 0
  },
  drawerPaper: {
    width: 240
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    marginTop: 72,
    justifyContent: 'flex-end',
  }
}));

const TimerTabLabelTimer = React.memo((props) => {
  // console.log("render App TimerTab LabelTimer");
  const now = useContext(TimerContext);

  const td = new Date(props.timestamp) - now;
  if (td <= 0){
    return <Chip size="small" label="0d 0:00:00" color="secondary" variant="outlined" />;
  }
  const d = Math.floor(td / (1000 * 60 * 60 * 24));
  const h = Math.floor((td / (1000 * 60 * 60)) % 24);
  const m = Math.floor((td / 1000 / 60) % 60);
  const s = Math.floor((td / 1000) % 60);
  const label = `${d}d ${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  return <Chip size="small" label={label} color="secondary" />;
});

export const TimerTab = React.memo((props) => {
  // console.log("render App TimerTab");
  let label = 'Timers';
  if (props.pinnedTimer){
    label = <TimerTabLabelTimer timestamp={props.timers[props.pinnedTimer].timestamp} updatePinnedTimer={props.updatePinnedTimer} />;
  }

  return (
    <Tab label={label} onClick={props.toggleDrawer} icon={<Badge badgeContent={Object.keys(props.timers).length} color="secondary"><TimerTwoTone /></Badge>} disabled={!Object.keys(props.timers).length}/>
  );
});

function TimerDrawer(props){
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'), {noSsr: true});
  const classes = useStyles();

  const handleOpen = () => props.setOpen(true);
  const handleClose = () => props.setOpen(false);

  const timerList = (
    <p>Hello World!</p>
  );

  if (isDesktop){
    return (
      <Drawer variant="persistent" anchor="right" open={props.open} className={classes.drawer} classes={{paper: classes.drawerPaper}} >
        <div className={classes.drawerHeader}><IconButton onClick={handleClose}><CloseTwoTone/></IconButton></div>
        <Divider />
        {timerList}
      </Drawer>
    );
  }
  return (
    <SwipeableDrawer anchor="right" open={props.open} onClose={handleClose} onOpen={handleOpen} >
      {timerList}
    </SwipeableDrawer>
  );
}

export default React.memo(TimerDrawer);
