import React, { useState } from 'react';
import { render } from "react-dom";
import App from './App';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
// import DateFnsUtils from '@material-ui/pickers/adapter/date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { TimerProvider } from './util';
import 'typeface-roboto';

function Main(){
  // console.log("render Main");
  const [theme, setTheme] = useState(() => {
    const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23|light').split('|');
    return createMuiTheme({palette: {primary: {main: themeColors[0]}, secondary: {main: themeColors[1]}, type: themeColors[2] || 'light'}});
  });

  return (
    <TimerProvider>
      <ThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <App setTheme={setTheme} />
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </TimerProvider>
  );
}

render(<Main/>, document.getElementById('root'));
