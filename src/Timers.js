import React, { useContext } from 'react';
import { Avatar, Badge, Chip, Divider, Drawer, IconButton, List, ListItem, ListItemAvatar, ListItemText,
         ListItemSecondaryAction, SwipeableDrawer, Radio, Tab, useMediaQuery } from '@material-ui/core';
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
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    marginTop: 72,
    justifyContent: 'flex-end',
  },
  checked: {
    color: theme.palette.getContrastText(pink[500]),
    backgroundColor: pink[500],
  },
}));

const TimerChip = React.memo((props) => {
  // console.log("render App TimerTab LabelTimer");
  const now = useContext(TimerContext);
  const size = props.full ? 'medium' : 'small';

  const td = new Date(props.timestamp) - now;
  if (td <= 0){
    return <Chip size={size} label="0d 0:00:00" color="secondary" variant="outlined" component="span" />;
  }
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
  switch (props.mimeType.split('/')[0]){
      case 'image': return <ImageIcon />;
      case 'text': return <TextIcon />;
      case 'video': return <VideoIcon />;
      case 'audio': return <AudioIcon />;
      case 'none': return <NoneIcon />;
      default: return <BinaryIcon />;
  }
});

const TimerList = React.memo((props) => {
  const handlePinnedChange = (e) => props.setPinnedTimer(e.target.value);
  const classes = useStyles();

  return (
    <List>
      {Object.entries(props.timers).sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp)).map(([id, t]) => (
        <ListItem key={id}>
          <ListItemAvatar>
            <Radio checked={props.pinnedTimer === id} onChange={handlePinnedChange} value={id} name="pinnedTimer"
                   icon={<Avatar variant="rounded"><FileIcon mimeType={t.mimeType}/></Avatar>} checkedIcon={<Avatar variant="rounded" className={classes.checked}><FileIcon mimeType={t.mimeType}/></Avatar>} />
          </ListItemAvatar>
          <ListItemText primary={t.filename} secondary={<TimerChip timestamp={t.timestamp} full/>} />
          <ListItemSecondaryAction>
            <IconButton edge="end" onClick={() => props.deleteTimer(id)}><DeleteTwoTone/></IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
});

function TimerDrawer(props){
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'), {noSsr: true});
  const classes = useStyles();

  const handleOpen = () => props.setOpen(true);
  const handleClose = () => props.setOpen(false);

  if (isDesktop){
    return (
      <Drawer variant="persistent" anchor="right" open={props.open} className={classes.drawer} classes={{paper: classes.drawerPaper}} >
        <div className={classes.drawerHeader}><IconButton onClick={handleClose}><CloseTwoTone/></IconButton></div>
        <Divider />
        <TimerList timers={props.timers} pinnedTimer={props.pinnedTimer} setPinnedTimer={props.setPinnedTimer} deleteTimer={props.deleteTimer} />
      </Drawer>
    );
  }
  return (
    <SwipeableDrawer anchor="right" open={props.open} onClose={handleClose} onOpen={handleOpen} >
      <TimerList timers={props.timers} pinnedTimer={props.pinnedTimer} setPinnedTimer={props.setPinnedTimer} deleteTimer={props.deleteTimer} />
    </SwipeableDrawer>
  );
}

export default React.memo(TimerDrawer);
