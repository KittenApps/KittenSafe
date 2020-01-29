import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import App, { TimerContext } from './App';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

function Main(){
  const [now, setNow] = useState(new Date());
  const [theme, setTheme] = useState(() => {
    const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23').split('|');
    return createMuiTheme({palette: {primary: {main: themeColors[0]}, secondary: {main: themeColors[1]}}});
  });

  useEffect(() => {
    setTimeout(() => setNow(new Date()), 1000);
  }, [now]);

  const mainApp = useMemo(() => (
    <ThemeProvider theme={theme}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <App setTheme={setTheme}/>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  ), [theme]);

  return (
    <TimerContext.Provider value={now}>
      {mainApp}
    </TimerContext.Provider>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));
