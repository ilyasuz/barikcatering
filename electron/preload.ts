import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // We can expose native APIs here later
});
