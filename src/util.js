import React, { createContext, useState, useEffect } from 'react';

export function readFileAsBuffer(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsArrayBuffer(file);
  });
}

export const TimerContext = createContext(new Date());
TimerContext.displayName = 'TimerContext';

export const TimerProvider = (props) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timeout = setTimeout(() => setNow(new Date()), 1000);
    return () => clearTimeout(timeout);
  }, [now]);

  return <TimerContext.Provider value={now} {...props} />;
};
