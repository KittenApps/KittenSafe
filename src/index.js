import * as React from 'react';
import { useState, useEffect } from 'react';
import { render } from "react-dom";
import App from './App';
import { LocalizationProvider } from '@material-ui/pickers';
import DateFnsUtils from '@material-ui/pickers/adapter/date-fns';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { TimerProvider } from './util';
import { Helmet } from 'react-helmet';
import './media/fonts.css';
import manifest from './media/manifest.webmanifest';
import favicon from './media/favicon.ico';
import logo192 from './media/logo192.png';
import logo256 from './media/logo256.png';
import logo512 from './media/logo512.png';

class ErrorBoundary extends React.PureComponent {
  constructor(props){
    super(props);
    this.state = {error: null, stack: null};
  }

  componentDidCatch(error, errorInfo){
    this.setState({error, stack: errorInfo.componentStack});
  }

  render(){
    if (this.state.error !== null){
      return (
        <React.Fragment>
          <h1>Oops, something went wrong! :(</h1>
          <p><b>Pleas give the following information to a hard working tech kitten (use our Discord for example).</b></p>
          <p><u>Error: </u>{this.state.error.toString()}</p>
          <p><u>Stack: </u>{this.state.stack}</p>
        </React.Fragment>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <TimerProvider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={DateFnsUtils}>
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
          </LocalizationProvider>
        </ThemeProvider>
      </TimerProvider>
    </ErrorBoundary>
  );
}

render(<Main/>, document.getElementById('root'));
