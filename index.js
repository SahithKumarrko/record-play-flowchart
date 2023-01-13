const debug = true;

const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require("path")
const url = require("url");
const fs = require("fs");
const fsPromises = require("fs").promises;
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
var current_state = data.state; 1
var menu;

// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true
const isMac = process.platform === 'darwin'


function setMenu() {
    var template = [
        {
            label: "Run",
            submenu: [
                {
                    label: "Start",
                    id: "run-start",
                    click: () => {
                        data.state = "start";
                        sendMessagetoAllTabs(data, "update");
                    }
                },
                {
                    label: "Pause",
                    id: "run-pause",
                    enabled: false,
                    click: () => {
                        data.state = "pause";
                        sendMessagetoAllTabs(data, "update");
                    }
                },
                {
                    label: "Stop",
                    id: "run-stop",
                    enabled: false,
                    click: () => {
                        data.state = "stop";
                        sendMessagetoAllTabs(data, "update");
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
    ];
    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

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
    });
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
        data.code.push({ action: { type: "navigation", value: url || "" }, details: { options: { isInPlace: webNavigations[windowId] || true } } });
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
app.on("ready", function () {
    createWindow();
    setMenu();
});
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
        if (current_state != data.state) {
            current_state = data.state;
            if (data.state == "start") {
                menu.getMenuItemById('run-start').enabled = false;
                menu.getMenuItemById('run-stop').enabled = true;
                menu.getMenuItemById('run-pause').enabled = true;
            } else if (data.state == "pause") {
                menu.getMenuItemById('run-start').enabled = true;
                menu.getMenuItemById('run-stop').enabled = true;
                menu.getMenuItemById('run-pause').enabled = false;
            }
            else {
                menu.getMenuItemById('run-start').enabled = true;
                menu.getMenuItemById('run-stop').enabled = false;
                menu.getMenuItemById('run-pause').enabled = false;
            }
        }
        if (!fs.existsSync(path.join(__dirname, "data"))) {
            fs.mkdirSync(path.join(__dirname, "data"))
        }
        await fsPromises.writeFile(path.join(__dirname, "data", "data.json"), JSON.stringify(data, null, 4));
        sendMessagetoAllTabs(data, "update");
    }
});


