import { createContext } from 'react';

export function readFileAsBuffer(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsArrayBuffer(file);
  });
}

export const TimerContext = createContext(new Date());
