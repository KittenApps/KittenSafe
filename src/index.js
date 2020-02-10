import React, { useState } from 'react';
import { render } from "react-dom";
import App from './App';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { TimerProvider } from './util';
import 'typeface-roboto';

function Main(){
  const [theme, setTheme] = useState(() => {
    const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23').split('|');
    return createMuiTheme({palette: {primary: {main: themeColors[0]}, secondary: {main: themeColors[1]}}});
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
