import React, { useState, useEffect } from 'react';
import { render } from "react-dom";
import App from './App';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@material-ui/pickers/adapter/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { TimerProvider } from './util';
import { Helmet } from "react-helmet";
import './media/fonts.css';
import manifest from './media/manifest.webmanifest';
import favicon from './media/favicon.ico';
import logo192 from './media/logo192.png';
import logo256 from './media/logo256.png';
import logo512 from './media/logo512.png';

function Main(){
  // console.log("render Main");
  const [theme, setTheme] = useState(() => {
    const themeColors = (localStorage.getItem('customThemeColors') || '#006302|#00ba23|light').split('|');
    return createMuiTheme({palette: {primary: {main: themeColors[0]}, secondary: {main: themeColors[1]}, type: themeColors[2] || 'light'}});
  });

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.primary.dark;
    document.getElementById('root').style.backgroundColor = theme.palette.type === 'light' ? '#fafafa' : '#303030';
  }, [theme]);

  return (
    <TimerProvider>
      <ThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <App setTheme={setTheme} />
          <Helmet>
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
            <meta name="theme-color" content={theme.palette.primary.dark}/>
            <link rel="icon" href={favicon}/>
            <link rel="manifest" href={manifest} />
            <link rel="apple-touch-icon" sizes="192x192" href={logo192} />
            <link rel="apple-touch-icon" sizes="256x256" href={logo256} />
            <link rel="apple-touch-icon" sizes="512x512" href={logo512} />
          </Helmet>
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </TimerProvider>
  );
}

render(<Main/>, document.getElementById('root'));
