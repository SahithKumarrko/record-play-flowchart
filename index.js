const { app, BrowserWindow, shell, ipcMain } = require('electron');
const electronReload = require('electron-reload')
const path = require("path")
const url = require("url");
const contextMenu = require("electron-context-menu");
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});
let win;
var windows = [];
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true
function createWindow() {
    win = new BrowserWindow({

        // frame: false,
        // titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            devTools: true,
            nodeIntegrationInSubFrames: true,
            preload: path.join(__dirname, "app", "js", 'util.js')
        }
    });
    win.loadURL(url.parse(path.join(__dirname, "app", "index.html")).href);
    win.on("closed", () => {
        win = null;
    })
    win.on("close", handleBrowserWindowClosed)
    // Send
    sendData();
    win.webContents.setWindowOpenHandler(({ url }) => {

        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: true,
                devTools: true,
                // frame: false,
                // titleBarStyle: 'hidden',
                nodeIntegrationInSubFrames: true,
                webPreferences: {
                    preload: path.join(__dirname, "app", "js", 'util.js')
                }
            }
        }

    })
}

function handleBrowserWindowClosed(event) {
    var window = event.sender;
    var ind = windows.indexOf(window);
    console.log("Browser closed :: ", ind);
    if (ind != -1)
        windows.splice(ind, 1)
}

app.on("browser-window-created", (event, window) => {
    console.log("New window created");
    if (windows.indexOf(window) == -1) {
        window.on("close", handleBrowserWindowClosed);
        windows.push(window);
        console.log("Added to windows")
        window.webContents.setWindowOpenHandler(({ url }) => {

            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    nodeIntegration: true,
                    enableRemoteModule: true,
                    contextIsolation: true,
                    devTools: true,
                    nodeIntegrationInSubFrames: true,
                    webPreferences: {
                        preload: path.join(__dirname, "app", "js", 'util.js')
                    }
                }
            }

        })
    }
});

contextMenu({
    prepend: (defaultActions, parameters, browserWindow) => [
        {
            label: 'Go Back',
            visible: BrowserWindow.getFocusedWindow().webContents.canGoBack(),
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.goBack();
            }
        },
        {
            label: 'Go Forward',
            visible: BrowserWindow.getFocusedWindow().webContents.canGoForward(),
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.goForward();
            }
        },
        {
            label: 'Reload',
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.reload();
            }
        }
    ],
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    showSelectAll: true,
    showCopyImage: true,
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showCopyVideoAddress: true,
    showSaveVideo: true,
    showSaveVideoAs: true,
    showCopyLink: true,
    showSaveLinkAs: true,
    showInspectElement: true,
    showServices: true,
})
app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform != "darwin")
        app.quit();
})

app.on("activate", () => {
    if (win == null)
        createWindow();
})

ipcMain.on('data-from-child', function (event, data) {
    console.log('From target', data)
});

// Send 
function sendData() {
    win.webContents.send('on-parent-recv', null);
}
