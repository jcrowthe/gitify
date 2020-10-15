const { ipcMain, app } = require('electron');
const { menubar } = require('menubar');
const { autoUpdater } = require('electron-updater');
const { onFirstRunMaybe } = require('./first-run');
const path = require('path');

const iconIdle = path.join(__dirname, 'assets', 'images', 'tray-idleTemplate.png');
const iconActive = path.join(__dirname, 'assets', 'images', 'tray-active.png');

const browserWindowOpts = {
  width: 500,
  height: 400,
  minWidth: 500,
  minHeight: 400,
  resizable: true,
  webPreferences: {
    overlayScrollbars: true,
    nodeIntegration: true,
  },
};

app.on('ready', async () => {
  await onFirstRunMaybe();
})

const menubarApp = menubar({
  icon: iconIdle,
  index: `file://${__dirname}/index.html`,
  browserWindow: browserWindowOpts,
  preloadWindow: true,
});

menubarApp.on('ready', () => {
  menubarApp.tray.setIgnoreDoubleClickEvents(true);

  autoUpdater.checkForUpdatesAndNotify();

  ipcMain.on('reopen-window', () => menubarApp.showWindow());
  ipcMain.on('app-quit', () => menubarApp.app.quit());
  ipcMain.on('update-icon', (_, arg) => {
    if (!menubarApp.tray.isDestroyed()) {
      if (arg === 'TrayActive') {
        menubarApp.tray.setImage(iconActive);
      } else {
        menubarApp.tray.setImage(iconIdle);
      }
    }
  });

  menubarApp.window.webContents.on('devtools-opened', () => {
    menubarApp.window.setSize(800, 600);
    menubarApp.window.center();
    menubarApp.window.resizable = true;
  });

  menubarApp.window.webContents.on('devtools-closed', () => {
    const trayBounds = menubarApp.tray.getBounds();
    menubarApp.window.setSize(
      browserWindowOpts.width,
      browserWindowOpts.height
    );
    menubarApp.positioner.move('trayCenter', trayBounds);
    menubarApp.window.resizable = false;
  });
});
