import React from 'react';
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
import Badge from '@material-ui/core/Badge';
import LockOpenTwoToneIcon from '@material-ui/icons/LockOpenTwoTone';
import LockTwoToneIcon from '@material-ui/icons/LockTwoTone';
import TimerTwoToneIcon from '@material-ui/icons/TimerTwoTone';
import InfoTwoToneIcon from '@material-ui/icons/InfoTwoTone';
import InvertColorsTwoToneIcon from '@material-ui/icons/InvertColorsTwoTone';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  grow: {
    flexGrow: 1,
  },
});

function TabPanel(props) {
  const { children, value, index } = props;

  return (
    <Typography component="div" role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

function App() {
  const [tab, setTab] = React.useState(1);
  const classes = useStyles();

  const handleChangeTab = (e, newTab) => {
    setTab(newTab);
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">
            KittenSafe v0.1
          </Typography>
          <Tabs value={tab} onChange={handleChangeTab} className={classes.grow} centered>
            <Tab label="Encryption" icon={<LockTwoToneIcon />} value={1} />
            <Tab label="Decryption" icon={<LockOpenTwoToneIcon />} value={2} />
            <Tab label="Running Timers (0)" icon={<TimerTwoToneIcon />} value={3} disabled/>
          </Tabs>
          <Tooltip title="Change theme colors" arrow>
            <IconButton color="inherit">
              <InvertColorsTwoToneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Info / Help / Release Notes" arrow>
            <IconButton color="inherit">
              <Badge badgeContent={2} color="secondary">
                <InfoTwoToneIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <TabPanel value={tab} index={1}>
        <EncryptionPanel />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <DecryptionPanel />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        ToDo
      </TabPanel>
    </MuiPickersUtilsProvider>
  );
}

export default App;
