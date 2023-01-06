const debug = false;

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const electronReload = require('electron-reload')
const path = require("path")
const url = require("url");
const fs = require("fs");
const fsPromises = require("fs").promises;
var current_window = -1;
const contextMenu = require("electron-context-menu");
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    ignored: [/data\/data.json/]
});
let win;
var windows = [];
var data = { url: "", state: "stop", code: [] };
var webNavigations = {};
var initialLoad = true;
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true
function createWindow() {
    win = new BrowserWindow({
        enableRemoteModule: true,
        // frame: false,
        // titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: true,
            devTools: debug,
            nodeIntegrationInSubFrames: true,
            preload: path.join(__dirname, "app", "js", 'util.js')
        }
    });
    win.loadURL(url.parse(path.join(__dirname, "app", "index.html")).href);
    win.on("closed", () => {
        win = null;
    })
    // win.on("close", handleBrowserWindowClosed)
    // win.webContents.on("did-finish-load", () => {
    //     console.log("Navigated :: ");
    //     handleFinishLoad(win);
    // });

    win.webContents.setWindowOpenHandler(({ url }) => {

        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                enableRemoteModule: true,
                // frame: false,
                // titleBarStyle: 'hidden',
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true,
                    contextIsolation: true,
                    devTools: debug,
                    nodeIntegrationInSubFrames: true,
                    preload: path.join(__dirname, "app", "js", 'util.js')
                }
            }
        }

    })
}

function handleFinishLoad(windowId) {
    if (data.state == "start") {
        var url = "";
        try {
            url = BrowserWindow.fromId(windowId).webContents.getURL();
        } catch (err) { }
        console.log("URL :: ", url);
        data.code.push({ action: {}, details: { type: "navigation", value: url || "", options: { isInPlace: webNavigations[windowId] || false } } });
        // sendMessagetoTab(data, "update");
        delete webNavigations[windowId];
        sendMessagetoAllTabs(data, "update");

    }

}

function handleBrowserWindowClosed(event) {
    var window = event.sender;
    var ind = windows.indexOf(window);
    if (ind != -1) {
        windows.splice(ind, 1)
        delete webNavigations[window.id];
    }
}

app.on("browser-window-created", (event, window) => {
    if (windows.indexOf(window) == -1) {
        current_window = window.id;
        webNavigations[window.id] = windows.length == 0 ? false : true;

        window.on("close", handleBrowserWindowClosed);

        windows.push(window);
        window.webContents.on("did-frame-finish-load", (event, isMainFrame, frameProcessId, frameRoutingId) => {
            if (isMainFrame) {

                if (!(windows.indexOf(window) == 0 && initialLoad)) {
                    handleFinishLoad(event.sender.id);
                }

            }
        });

        window.webContents.setWindowOpenHandler(({ url }) => {

            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    enableRemoteModule: true,
                    // frame: false,
                    // titleBarStyle: 'hidden',
                    webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true,
                        contextIsolation: true,
                        devTools: debug,
                        nodeIntegrationInSubFrames: true,
                        preload: path.join(__dirname, "app", "js", 'util.js')
                    }
                }
            }

        })
        initialLoad = false;
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
                console.log("Refreshing...");
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
    showInspectElement: debug,
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

async function sendMessagetoTab(sender, value, type = "init") {
    value = JSON.stringify({ type: type, data: value })

    await sender.webContents.send('response', value);
}

async function sendMessagetoAllTabs(value, type = "init") {
    var browserWindows = BrowserWindow.getAllWindows();
    for (var i = 0; i < browserWindows.length; i++) {
        var window = BrowserWindow.fromId(browserWindows[i].id);
        await sendMessagetoTab(window, value, type);
    }
}
const delay = ms => new Promise(res => setTimeout(res, ms));
const checkIfVisible = windowId => new Promise(async (res) => {
    while (true) {
        try {
            if (BrowserWindow.fromId(windowId).isVisible)
                break;
            else
                await delay(1000);
        }
        catch (err) {
            break;
        }
    }
    res("done");
});
ipcMain.on('request', async function (event, request) {
    if (request.type == "init") {
        await checkIfVisible(event.sender.id);
        sendMessagetoTab(BrowserWindow.fromId(event.sender.id), { ...data, windowId: event.sender.id });
    }
    else if (request.type == "data-update") {
        for (var k in request.data) {
            if (k in data) {
                data[k] = request.data[k];
            }
        }
        if (!fs.existsSync(path.join(__dirname, "data"))) {
            fs.mkdirSync(path.join(__dirname, "data"))
        }
        await fsPromises.writeFile(path.join(__dirname, "data", "data.json"), JSON.stringify(data, null, 4));
        sendMessagetoAllTabs(data, "update");
    }
});


