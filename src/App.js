import React from 'react';
import EncryptionPanel from './EncryptionPanel';
import DecryptionPanel from './DecryptionPanel';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

function App() {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <h3>Encrypt:</h3>
      <EncryptionPanel />
      <h3>Decrypt:</h3>
      <DecryptionPanel />
    </MuiPickersUtilsProvider>
  );
}

export default App;
