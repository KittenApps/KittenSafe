import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { TimerContext } from './util';

function Main(){
  const [now, setNow] = useState(new Date());
  const [theme, setTheme] = useState(() => {
    const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23').split('|');
    return createMuiTheme({palette: {primary: {main: themeColors[0]}, secondary: {main: themeColors[1]}}});
  });

  useEffect(() => {
    setTimeout(() => setNow(new Date()), 1000);
  }, [now]);


  return (
    <TimerContext.Provider value={now}>
      <ThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <App setTheme={setTheme}/>
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </TimerContext.Provider>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));
