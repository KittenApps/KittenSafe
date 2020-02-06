import React, { useContext } from 'react';
import { Badge, Chip, Tab} from '@material-ui/core';
import { TimerTwoTone} from '@material-ui/icons';
import { TimerContext } from './util';

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
    <Tab label={label} icon={<Badge badgeContent={Object.keys(props.timers).length} color="secondary"><TimerTwoTone /></Badge>} disabled={!Object.keys(props.timers).length}/>
  );
});

function TimerPanel(props){
  return (
    <span>Hello World!</span>
  );
}

export default React.memo(TimerPanel);
