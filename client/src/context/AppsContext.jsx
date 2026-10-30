import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, errText } from '../api.js';

const Ctx = createContext(null);
export const useApps = () => useContext(Ctx);

export function AppsProvider({ children }) {
  const [apps, setApps] = useState([]);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.config(), api.applications()])
      .then(([c, a]) => {
        setConfig(c);
        setApps(a);
      })
      .catch((e) => setError(errText(e)));
  }, []);

  // replace one application (after an edit, flag or recommendation) or add a new one
  const upsert = useCallback(
    (app) => setApps((list) => (list.some((x) => x.appId === app.appId) ? list.map((x) => (x.appId === app.appId ? app : x)) : [...list, app])),
    []
  );

  return <Ctx.Provider value={{ apps, config, error, ready: !!config, upsert }}>{children}</Ctx.Provider>;
}
