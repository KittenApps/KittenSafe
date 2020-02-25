import React, { useContext, useMemo } from 'react';
import { Avatar, Badge, Button, Box, Chip, Divider, Drawer, IconButton, List, ListItem, ListItemAvatar, ListItemText,
         ListItemSecondaryAction, ListSubheader, SwipeableDrawer, Radio, Tab, useMediaQuery } from '@material-ui/core';
import { ImageTwoTone as ImageIcon, DescriptionTwoTone as TextIcon, OndemandVideoTwoTone as VideoIcon,
         AudiotrackTwoTone as AudioIcon, BlockTwoTone as NoneIcon, InsertDriveFileTwoTone as BinaryIcon,
         TimerTwoTone, CloseTwoTone, DeleteTwoTone } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { pink } from '@material-ui/core/colors';
import { TimerContext } from './util';

const useStyles = makeStyles(theme => ({
  drawer: {
    width: 320,
    flexShrink: 0
  },
  drawerPaper: {
    width: 320
  },
  drawerHeader: {
    display: 'flex',
    padding: theme.spacing(0, 1),
    marginTop: 72,
    justifyContent: 'flex-start',
  },
  drawerMobile: {
    maxWidth: '90%'
  },
  drawerMobileHeader: {
    display: 'flex',
    padding: theme.spacing(0, 1),
    justifyContent: 'flex-start',
  }
}));

const useStylesTL = makeStyles(theme => ({
  checked: {
    color: theme.palette.getContrastText(pink[500]),
    backgroundColor: pink[500],
  }
}));

export const TimerChip = React.memo((props) => {
  // console.log("render TimerChip");
  const now = useContext(TimerContext);
  const size = props.full ? 'medium' : 'small';
  const td = useMemo(() => new Date(props.timestamp) - now + 500, [props.timestamp, now]);

  if (td <= 0) return <Chip size={size} label="0d 0:00:00" color="secondary" variant="outlined" component="span" />;
  const d = Math.floor(td / (1000 * 60 * 60 * 24));
  const h = Math.floor((td / (1000 * 60 * 60)) % 24);
  const m = Math.floor((td / 1000 / 60) % 60);
  const s = Math.floor((td / 1000) % 60);
  const label = `${d}d ${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  return <Chip size={size} label={label} color="secondary" component="span" />;
});

export const TimerTab = React.memo((props) => {
  // console.log("render App TimerTab");
  let label = 'Timers';
  if (props.pinnedTimer){
    label = <TimerChip timestamp={props.timers[props.pinnedTimer].timestamp} />;
  }

  return (
    <Tab label={label} onClick={props.toggleDrawer} icon={<Badge badgeContent={Object.keys(props.timers).length} color="secondary"><TimerTwoTone /></Badge>} disabled={!Object.keys(props.timers).length}/>
  );
});

export const FileIcon = React.memo((props) => {
  // console.log("render FileIcon: ", props);
  switch (props.mimeType){
      case 'image': return <ImageIcon />;
      case 'text': return <TextIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'none': return <NoneIcon />;
      default: return <BinaryIcon />;
  }
});

const TimerList = React.memo((props) => {
  // console.log("render TimerList");
  const handlePinnedChange = (e) => props.setPinnedTimer(e.target.value);
  const classes = useStylesTL();
  const sortTimers = useMemo(() => Object.entries(props.timers).sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp)), [props.timers]);

  return (
    <React.Fragment>
      {sortTimers.map(([id, t]) => (
        <React.Fragment key={id}>
          <ListItem>
            <ListItemAvatar>
              <Radio checked={props.pinnedTimer === id} onChange={handlePinnedChange} value={id} name="pinnedTimer" color="default"
                     icon={<Avatar variant="rounded"><FileIcon mimeType={t.mimeType.split('/')[0]}/></Avatar>} checkedIcon={<Avatar variant="rounded" className={classes.checked}><FileIcon mimeType={t.mimeType.split('/')[0]}/></Avatar>} />
            </ListItemAvatar>
            <ListItemText style={{userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text'}} primary={t.filename} secondary={<TimerChip timestamp={t.timestamp} full/>} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => props.deleteTimer(id)}><DeleteTwoTone/></IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          <Divider variant="middle" component="li"/>
        </React.Fragment>
      ))}
      {sortTimers.length > 0 && new Date(sortTimers[0][1].timestamp) < new Date() &&
        <Box m={2} display="flex" justifyContent="center">
          <Button variant="outlined" color="default" onClick={() => props.deleteTimer('finished')} startIcon={<DeleteTwoTone />} >Clear all finished Timers</Button>
        </Box>
      }
    </React.Fragment>
  );
});

function TimerDrawer(props){
  // console.log("render TimerDrawer");
  const classes = useStyles();
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'), {noSsr: true});

  const handleOpen = () => props.setOpen(true);
  const handleClose = () => props.setOpen(false);

  if (isDesktop){
    return (
      <Drawer variant="persistent" anchor="right" open={props.open} className={classes.drawer} PaperProps={{elevation: 3}} classes={{paper: classes.drawerPaper}} >
        <List>
          <div className={classes.drawerHeader}>
            <IconButton onClick={handleClose}><CloseTwoTone/></IconButton>
            <ListSubheader disableSticky>KittenSafe Timers</ListSubheader>
          </div>
          <Divider/>
          <TimerList timers={props.timers} pinnedTimer={props.pinnedTimer} setPinnedTimer={props.setPinnedTimer} deleteTimer={props.deleteTimer} />
        </List>
      </Drawer>
    );
  }
  return (
    <SwipeableDrawer anchor="right" open={props.open} onClose={handleClose} onOpen={handleOpen} className={classes.drawerMobile} classes={{paper: classes.drawerMobile}} disableSwipeToOpen={false}>
      <List>
        <div className={classes.drawerMobileHeader}>
          <IconButton onClick={handleClose}><CloseTwoTone/></IconButton>
          <ListSubheader disableSticky>KittenSafe Timers</ListSubheader>
        </div>
        <Divider/>
        <TimerList timers={props.timers} pinnedTimer={props.pinnedTimer} setPinnedTimer={props.setPinnedTimer} deleteTimer={props.deleteTimer} />
      </List>
    </SwipeableDrawer>
  );
}

export default React.memo(TimerDrawer);
