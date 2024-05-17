const { app, shell, BrowserWindow, ipcMain } = require("electron");
const { dirname, join } = require("path");
const { MAIN_WINDOW, configureStore } = require("@synnaxlabs/drift");
const { ElectronRuntime, listenOnMain } = require("@synnaxlabs/drift/electron");
const { fileURLToPath } = require("url");

const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = join(__dirname, "..");
export const MAIN_DIST = join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const loadRender = (win: BrowserWindow) => {
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(RENDERER_DIST, "index.html"));
  }
};

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

function createWindow() {
  // Create the browser window.
  const preload = join(MAIN_DIST, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    title: MAIN_WINDOW,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: preload,
      sandbox: false,
    },
  });
  loadRender(mainWindow);
  listenOnMain({
    mainWindow,
    createWindow: (props) => {
      const { size, minSize, maxSize, position, visible, ...rest } = props;
      const win = new BrowserWindow({
        ...props,
        frame: false,
        webPreferences: {
          preload: join(MAIN_DIST, "preload.js"),
          sandbox: false,
        },
      });
      loadRender(win);
      return win;
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    app.quit();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // mainWindow.loadURL("http://localhost:5173");
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
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
