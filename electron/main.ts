import { app, BrowserWindow, nativeTheme, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

nativeTheme.themeSource = 'dark';

// Catch uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

if (process.platform === 'win32') {
  app.setAppUserModelId('com.barik.muhasebe');
}

function createWindow() {
  const iconPath = path.join(__dirname, '../public/logo.png');
  const winIconPath = path.join(__dirname, '../build/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    icon: process.platform === 'win32' ? winIconPath : iconPath,
    ...(process.platform === 'win32'
      ? { backgroundMaterial: 'acrylic' }
      : { backgroundColor: '#00000000', transparent: true }),
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      dialog.showErrorBox('Loading Error', `Could not load application interface:\n${err.message}`);
    });
  }
  
  mainWindow.removeMenu();
  
  // Register keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow?.webContents.reload();
        event.preventDefault();
      }
      if (input.key === 'F12') {
        mainWindow?.webContents.toggleDevTools();
        event.preventDefault();
      }
    }
  });

  mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
