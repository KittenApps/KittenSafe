import React, { createContext, useState, useEffect } from 'react';

export function readFileAsBuffer(file){
  if (file.markdown) return Promise.resolve(new TextEncoder('utf-8').encode(file.markdown));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(new Uint8Array(e.target.result));
    reader.readAsArrayBuffer(file);
  });
}

export const TimerContext = createContext(new Date());
TimerContext.displayName = 'TimerContext';

export const TimerProvider = (props) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <TimerContext.Provider value={now} {...props} />;
};
