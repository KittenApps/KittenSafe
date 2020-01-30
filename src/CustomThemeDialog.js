import React, {useState} from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { createMuiTheme } from '@material-ui/core/styles';

const defaultPrim = '#006302';
const defaultSec = '#00ba23';
const themeColors = (localStorage.getItem('customThemeColors') || `${defaultPrim}|${defaultSec}`).split('|');

function CustomThemeDialog(props){
  // console.log("render CustomThemeDialog");
  const [primColor, setPrimColor] = useState(themeColors[0]);
  const [secColor, setSecColor] = useState(themeColors[1]);

  const handleClose = () => props.setOpen(false);
  const handlePrimColorChange = (e) => setPrimColor(e.target.value);
  const handleSecColorChange = (e) => setSecColor(e.target.value);
  const handleApply = () => {
    localStorage.setItem('customThemeColors', `${primColor}|${secColor}`);
    props.setTheme(createMuiTheme({palette: {primary: {main: primColor}, secondary: {main: secColor}}}));
    props.setOpen(false);
  };
  const handleReset = () => {
    setPrimColor(defaultPrim);
    setSecColor(defaultSec);
    localStorage.removeItem('customThemeColors');
    props.setTheme(createMuiTheme({palette: {primary: {main: defaultPrim}, secondary: {main: defaultSec}}}));
    props.setOpen(false);
  };

  return (
    <Dialog open={props.open} onClose={handleClose}>
      <DialogTitle>Customize theme colors</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={6} key="primaryColor"><TextField label="primary color" type="color" value={primColor} onChange={handlePrimColorChange} fullWidth/></Grid>
          <Grid item xs={6} key="secondaryColor"><TextField label="secondary color" type="color" value={secColor} onChange={handleSecColorChange} fullWidth/></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="secondary">
          Reset to default theme
        </Button>
        <Button onClick={handleApply} color="primary">
          Apply theme colors
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(CustomThemeDialog);
