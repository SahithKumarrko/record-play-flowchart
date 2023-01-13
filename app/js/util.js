var { ipcRenderer } = require('electron');
const path = require("path");
const url = require("url");
const getElementSelector = require("./element_selector.js");

const dom_accessibility_api = require("dom-accessibility-api");
const ariaQuery = require("aria-query");

var appBaseURL = url.parse(path.join(__dirname, "../", "index.html")).href

// The current CY selector generated from the user action.
var current_selector = { element: null, selector: null };
// To handle tab presses. (If isTabPressed==1 and onchange event is fired then the code needs to be corrected by moving the code for onchange event on top of tab press code. As this is how events occur keydown->OnChange->Focus)
var isKeyPressed = -1;
// the Cy selector on which the TAB key is pressed.
var key_pressed_selector_element = {};

var keysPressed = [];

const TAB_CODE = 9, ENTER_CODE = 13;

var settings = { "selector_order": ["cy.findByRole", "cy.findByText", "cy.findByLabelText", "cy.findByPlaceholderText", "cy.findByTestId", "cy.get"], "trim": true, useAllElements: true };

var control_css = `.action-btn{transition: all .25s ease-in-out;font-size: 1.5rem !important;cursor: pointer;}.action-btn:hover{transform:scale(1.15) !important;}#pause,#stop{pointer-events:none}#__flowchartCreator_app_controls__.open,#__flowchartCreator_app_controls__:hover{background:#ffff;box-shadow:rgb(50 50 93 / 25%) 0 13px 27px -5px,rgb(0 0 0 / 30%) 0 8px 16px -8px}.action-btn{transition:.15s ease-in-out;font-size:1.5rem!important;cursor:pointer}#start{color:#28a745}#stop{color:#f8bec5}#pause{color:#bddbfa}#__flowchartCreator_app_controls__{color:rgba(0,0,0,.2);background:transparent;box-shadow: rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px;border:1px solid rgba(0,0,0,0.3);font-weight:100;width:34px;height:34px;padding:0;border-radius:100%;overflow:hidden;display:inline-block;cursor:pointer;bottom:8px;right:8px;position:fixed;transition:.3s}#__flowchartCreator_app_controls__ .open-close{transition:.3s;position:absolute;bottom:4px;width:24px;height:24px;z-index:999999999999;right:2.8px;font-size:24px;color:rgba(0,0,0,.3)}#__flowchartCreator_app_controls__:hover,#__flowchartCreator_app_controls__:hover .open-close{color:#000}#__flowchartCreator_app_controls__.open .open-close{color:#000}#__flowchartCreator_app_controls_box__{color:#000;opacity:0;position:relative;display:flex;justify-content:space-around;align-items:center;height:100%;padding-right:8px;-webkit-transform:translateX(30px);transform:translateX(30px)}#__flowchartCreator_app_controls__.open{width:12rem;height:2.3rem;position:fixed;margin:0;cursor:inherit;z-index:99999999999999;border-radius:3px}#__flowchartCreator_app_controls__.open .open-close{color:#000;font-size:24px;opacity:.7;cursor:pointer;z-index:2}#__flowchartCreator_app_controls__.open .open-close:hover{opacity:1}#__flowchartCreator_app_controls__.open #__flowchartCreator_app_controls_box__{opacity:1!important;-webkit-transform:translateY(0)!important;transform:translateY(0)!important;-moz-transition:-moz-transform .5s .55s,opacity 1s .55s!important;-o-transition:-o-transform .3s .35s,opacity 1s .35s!important;transition:transform .3s .35s,opacity 1s .35s,-webkit-transform .3s .35s!important}`;
var control_html = `<i id="__flowchartCreator_app_controls_toggle_btn__" class="fa fa-cog open-close" data-toggle="false"></i>
<div id="__flowchartCreator_app_controls_box__" style="margin-right: 1rem;">
    <i id="start" title="Start Recording" class="fa fa-play action-btn"></i>
    <i id="pause" title="Pause the recording" class="fa fa-pause action-btn"></i>
    <i id="stop" title="Stop Recording" class="fa fa-stop action-btn"></i>
</div>`;
var data = { url: "", state: "stop", code: [], windowId: -1 };
var addedControls = false;
ipcRenderer.on('response', function (event, response) {
    response = JSON.parse(response);
    console.log("Reee ", response)
    if (response.type == "init") {
        for (var k in response.data) {
            if (k in data) {
                data[k] = response.data[k];
            }
        }
    }
    else if (response.type == "update") {
        for (var k in response.data) {
            if (k in data) {
                if (k != "windowId")
                    data[k] = response.data[k];
            }
        }
    }
    console.log("After update :: ", data);
    updateControls();
    if (data.state == "start") {
        addEventListeners();
    } else {
        removeEventListeners();
    }
});

function sendDataToMain(value, type = "data-update") {
    ipcRenderer.send("request", { type: type, data: value });
}


sendDataToMain({}, "init");

function addControls() {
    var styleTag = document.createElement("style")
    styleTag.innerText = control_css;
    var head = document.getElementsByTagName("head")
    if (!head || head.length == 0) {
        head = [document.body];
    }
    head[0].appendChild(styleTag);
    var linkTag = document.createElement("link");
    linkTag.rel = "stylesheet";
    linkTag.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css";
    head[0].appendChild(linkTag);
    var controls = document.createElement("div");
    controls.id = "__flowchartCreator_app_controls__";
    controls.innerHTML = control_html;
    document.body.appendChild(controls);
    addedControls = true;
}

function updateControls() {
    if (!document.getElementById("__flowchartCreator_app_controls__")) {
        addControls();
    }
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");

    if (data.state == "start") {
        start_btn.style.color = "#b7ffc7";
        start_btn.style.pointerEvents = "none";
        pause_btn.style.color = "#007bff";
        pause_btn.style.pointerEvents = "auto";
        stop_btn.style.color = "#dc3545";
        stop_btn.style.pointerEvents = "auto";
    } else if (data.state == "pause") {
        pause_btn.style.color = "#bddbfa";
        pause_btn.style.pointerEvents = "none";
        start_btn.setAttribute("title", "Resume Recording");
        start_btn.classList = "fa fa-play start-pause action-btn";
        start_btn.style.color = "#007bff";
        start_btn.style.pointerEvents = "auto";
        stop_btn.style.color = "#dc3545";
        stop_btn.style.pointerEvents = "auto";
    }
    else {
        start_btn.style.color = "#28a745";
        start_btn.style.pointerEvents = "auto";
        start_btn.setAttribute("title", "Start Recording");
        start_btn.classList = "fa fa-play action-btn";
        pause_btn.style.color = "#bddbfa";
        pause_btn.style.pointerEvents = "none";
        stop_btn.style.color = "#f8bec5";
        stop_btn.style.pointerEvents = "none";
    }
}

function start_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    start_btn.style.color = "#b7ffc7";
    start_btn.style.pointerEvents = "none";
    pause_btn.style.color = "#007bff";
    pause_btn.style.pointerEvents = "auto";
    stop_btn.style.color = "#dc3545";
    stop_btn.style.pointerEvents = "auto";
    pause_btn.setAttribute("title", "Pause");
    data.url = "";
    data.state = "start";
    addEventListeners();
    sendDataToMain(data);
}

function stop_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    start_btn.style.color = "#28a745";
    start_btn.style.pointerEvents = "auto";
    start_btn.setAttribute("title", "Start Recording");
    start_btn.classList = "fa fa-play action-btn";
    pause_btn.style.color = "#bddbfa";
    pause_btn.style.pointerEvents = "none";
    stop_btn.style.color = "#f8bec5";
    stop_btn.style.pointerEvents = "none";
    data.url = "";
    data.state = "stop";
    removeEventListeners();
    sendDataToMain(data);
}

function pause_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    pause_btn.style.color = "#bddbfa";
    pause_btn.style.pointerEvents = "none";
    start_btn.setAttribute("title", "Resume Recording");
    start_btn.classList = "fa fa-play start-pause action-btn";
    start_btn.style.color = "#007bff";
    start_btn.style.pointerEvents = "auto";
    stop_btn.style.color = "#dc3545";
    stop_btn.style.pointerEvents = "auto";
    data.state = "pause";
    removeEventListeners();
    sendDataToMain(data);
}
function toggleControls() {
    var controls = document.getElementById("__flowchartCreator_app_controls__");
    console.log("Clciked")
    var classes = controls.classList;
    if (classes != "open")
        controls.classList = "open";
    else
        controls.classList = "";
}

var clickableElementRoles = ["button", "link", "combobox", "checkbox", "searchbox", "textbox", "radio", "menuitem", "menuitemcheckbox", "menuitemradio", "switch", "dialog", "tab", "menu", "menubar", "toolbar", "navigation", "spinbutton"];
var changeableRoles = ["listbox", "combobox", "textbox", "searchbox", "spinbutton", "slider"];
var typableElementsRoles = ["textbox", "searchbox", "combobox"];
var clickableElements = ["iframe"];
var changeableInputTypes = ["birthday", "time", "week", "month", "datetime-local", "file"];

function deepEqual(x, y) {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
}

function addToFlowChart(action, selector, element = undefined, onChanged = false) {
    if (!selector)
        return;
    // if (!data.code || data.code.length == 0) {
    //     data.code = [{ action: { action: "visit", value: `${window.location.href}` }, details: {} }];
    // }
    var role = element ? dom_accessibility_api.getRole(element) : null;
    var code_lines = data.code;
    var [last_line] = code_lines.slice(-1);
    var action_to_add = { action: action, details: selector.details };
    var isSameasLastLine = last_line ? (deepEqual(last_line, action_to_add)) : false;
    var code_updated = false;
    if (isKeyPressed == 1 && onChanged && (key_pressed_selector_element && deepEqual(key_pressed_selector_element.selector.details, selector.details) && key_pressed_selector_element.element == element)) {
        // code_lines.splice(-1, 0, code);
        code_updated = true;
    }
    else if (!isSameasLastLine) {
        code_lines.push(action_to_add);
        code_updated = true;
    }
    else if (role == "checkbox") {
        code_lines.push(action_to_add);
        code_updated = true;
    }

    if (isKeyPressed >= 0)
        isKeyPressed += 1;
    if (isKeyPressed > 1) {
        isKeyPressed = -1;
        key_pressed_selector_element = {};
    }
    if (code_updated) {
        data.code = code_lines;
        sendDataToMain(data);
    }
    console.log("Code :: ", data.code)
}
function handleClick(event) {
    if (data.state == "start") {
        function verifyClickedAndAddCode(selector) {

            var element = selector.element;
            var tagName = element.tagName.toLowerCase();
            var role = dom_accessibility_api.getRole(element);
            //Controls
            if (element.id == "__flowchartCreator_app_controls_box__" || element.parentNode.id == "__flowchartCreator_app_controls_box__" || element.parentNode.id == "__flowchartCreator_app_controls__") {
                return true;
            }
            //SearchField
            if (element.id == "__f231465sadwsRwqad_electron_app_search_input_field__" || element.parentNode.id == "__f231465sadwsRwqad_electron_app_search_input_field__") {
                return true;
            }
            if (tagName == "html" || tagName == "body" || tagName == "label" || role == "slider") {
                return true;
            }
            if (selector && selector.selector && (settings.useAllElements || clickableElements.indexOf(tagName) != -1 || clickableElementRoles.indexOf(role) != -1 || element.getAttribute("onclick") || element.getAttribute("aria-pressed") || (element.getAttribute("aria-haspopup") && element.getAttribute("aria-haspopup") != "false"))) {
                var l = element.getAttribute("list");
                var isAttrListPresent = false;
                if (l && l.trim()) {
                    if (document.getElementById(l.trim()))
                        isAttrListPresent = true;
                }
                if (role != "combobox" || (role == "combobox" && (tagName == "button" || (tagName != "select" && !isAttrListPresent)))) {
                    var action = { action: "click" }
                    addToFlowChart(action, selector.selector, selector.selector.element);
                }
                return true;
            }
            return false;
        }
        var selector = { element: event.target, selector: getElementSelector.getElementCySelector(event.target) };
        if (current_selector.element == selector.element) {
            selector = current_selector;
        }
        else {
            current_selector = { element: null, selector: null }
        }


        if (!verifyClickedAndAddCode(selector)) {
            var parent = selector.element.parentNode;
            var role = dom_accessibility_api.getRole(parent);
            if (parent.nodeType != Node.DOCUMENT_NODE && (role || settings.useAllElements)) {
                selector = { element: parent, selector: getElementSelector.getElementCySelector(parent) };
                verifyClickedAndAddCode(selector);
            }
        }
    }
}


function handleOnChangeEvent(event) {
    if (data.state == "start") {
        var element = null, selector = null;
        if (current_selector.selector) {
            element = current_selector.element;
            selector = current_selector.selector;
        } else {
            element = event.target;
            selector = getElementSelector.getElementCySelector(element);
        }
        if (!selector)
            return;

        if (element.id == "__f231465sadwsRwqad_electron_app_search_input_field__" || element.parentNode.id == "__f231465sadwsRwqad_electron_app_search_input_field__") {
            return;
        }
        var role = dom_accessibility_api.getRole(element);
        var ignoreRolesForOnChange = clickableElementRoles.filter((v) => { return changeableRoles.indexOf(v) == -1 })
        var tagName = element.tagName.toLowerCase();
        var l = element.getAttribute("list");

        var isTypable = typableElementsRoles.indexOf(role) != -1 || (tagName == "input" && element.type == "password");
        if (settings.useAllElements || changeableRoles.indexOf(role) != -1 || changeableInputTypes.indexOf((element.type || "").trim())) {
            if (ignoreRolesForOnChange.indexOf(role) == -1) {
                var value = element.value;
                if (value || (value == "" && isTypable)) {
                    var action = {}
                    if (role == "listbox") {
                        action.action = "select";
                        action.value = value;
                    }
                    else if (isTypable) {
                        action.action = "type";
                        action.value = value;
                    }
                    else if (element.type == "file") {
                        action.action = "upload";
                        var listOfFiles = [];
                        for (var i = 0; i < element.files.length; i++) {
                            // listOfFiles.push(`"${URL.createObjectURL(element.files[i])}"`);
                            listOfFiles.push(`"${element.files[i].name}"`)
                        }
                        action.value = listOfFiles;

                    }
                    else {
                        action.action = "invoke";
                        action.attr = "attr";
                        action.value = value;
                    }
                    addToFlowChart(action, selector, selector.element, true);
                }
            }
        }
    }
}

function handleFocus(event) {
    if (data.state == "start") {
        var element = event.target;
        current_selector.element = element;
        current_selector.selector = getElementSelector.getElementCySelector(element);
    }
}

function handleKeyUp(event) {
    var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    var index = keysPressed.indexOf(vKey);
    if (index > -1) {
        keysPressed.splice(index, 1);
    }
}

//When some key is released
function handleKeyDown(event) {
    //Identifies the key
    var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    if (keysPressed.indexOf(vKey) <= -1) {
        keysPressed.push(vKey);
    }
    if (window.location.href.toLocaleLowerCase().indexOf(appBaseURL) == -1 && (keysPressed.length == 1 && (vKey == ENTER_CODE || vKey == TAB_CODE)) && data.state == "start") {
        var selector = null;
        var element = document.activeElement;
        selector = getElementSelector.getElementCySelector(element);
        if (selector) {
            var code = "";
            key_pressed_selector_element = { selector: selector, element: selector.element };
            isKeyPressed = -1;
            handleOnChangeEvent(event);
            isKeyPressed = 0;
            var action = { action: "keyPress", value: vKey }
            if (vKey == 13) {
                var role = dom_accessibility_api.getRole(element);
                if (role == "textbox" || role == "searchbox") {
                    addToFlowChart(action, selector)
                }
            }
            else if (vKey == 9) {
                addToFlowChart(action, selector);
            }
        }
    }

}

function addEventListeners() {
    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleOnChangeEvent, true);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focus", handleFocus, true);
}

function removeEventListeners() {
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("change", handleOnChangeEvent, true);
    document.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("focus", handleFocus, true);
}

document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById("__flowchartCreator_app_controls__")) {
        addControls();
    }
    updateControls();
    document.getElementById("__flowchartCreator_app_controls_toggle_btn__").addEventListener("click", toggleControls);
    document.getElementById("start").addEventListener("click", start_recording);
    document.getElementById("stop").addEventListener("click", stop_recording);
    document.getElementById("pause").addEventListener("click", pause_recording);
});