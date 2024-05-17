const { app, shell, BrowserWindow, ipcMain } = require('electron');
const { join } =require('path');
const { MAIN_WINDOW, configureStore } = require('@synnaxlabs/drift');
const  { ElectronRuntime, listenOnMain } = require('@synnaxlabs/drift/electron');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    title: MAIN_WINDOW,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: "/Users/emilianobonilla/Desktop/synnaxlabs/synnax/console-electron/preload.js",
      sandbox: false
    }
  })
  listenOnMain({
    mainWindow,
    createWindow: (props) => {
      const { size, minSize, maxSize, position, visible, ...rest } = props
      console.log(props)
      const win = new BrowserWindow({
        x: position?.x,
        y: position?.y,
        width: size?.width,
        height: size?.height,
        minWidth: minSize?.width,
        minHeight: minSize?.height,
        frame: false,
        maxWidth: maxSize?.width,
        maxHeight: maxSize?.height,
        show: visible,
        webPreferences: {
          preload: join(__dirname, 'preload.js'),
          sandbox: false
        }
      })
    win.removeMenu()
    win.loadURL("http://localhost:5173")
      return win
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  mainWindow.loadURL("http://localhost:5173")
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
//   electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
//   app.on('browser-window-created', (_, window) => {
//     optimizer.watchWindowShortcuts(window)
//   })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
