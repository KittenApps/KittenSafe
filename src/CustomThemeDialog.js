import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@material-ui/core';
import { createMuiTheme } from '@material-ui/core/styles';

const defaultPrim = '#006302';
const defaultSec = '#00ba23';
const themeColors = (localStorage.getItem('customThemeColors') || `${defaultPrim}|${defaultSec}`).split('|');

function CustomThemeDialog(props){
  // console.log("render CustomThemeDialog");
  const [primColor, setPrimColor] = useState(themeColors[0]);
  const [secColor, setSecColor] = useState(themeColors[1]);
  if (!props.open) return null;

  const handleClose = () => props.setOpen(false);
  const handlePrimColorChange = e => setPrimColor(e.target.value);
  const handleSecColorChange = e => setSecColor(e.target.value);
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
        <Grid container spacing={3} style={{marginBottom: 0}}>
          <Grid item xs={6} key="primaryColor"><TextField variant="outlined" size="small" label="primary color" type="color" value={primColor} onChange={handlePrimColorChange} fullWidth/></Grid>
          <Grid item xs={6} key="secondaryColor"><TextField variant="outlined" size="small" label="secondary color" type="color" value={secColor} onChange={handleSecColorChange} fullWidth/></Grid>
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
