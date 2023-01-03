var { ipcRenderer } = require('electron');

var control_css = `.action-btn{transition: all .25s ease-in-out;font-size: 1.5rem !important;cursor: pointer;}.action-btn:hover{transform:scale(1.15) !important;}#pause,#stop{pointer-events:none}#__flowchartCreator_app_controls__.open,#__flowchartCreator_app_controls__:hover{background:#ffff;box-shadow:rgb(50 50 93 / 25%) 0 13px 27px -5px,rgb(0 0 0 / 30%) 0 8px 16px -8px}.action-btn{transition:.15s ease-in-out;font-size:1.5rem!important;cursor:pointer}#start{color:#28a745}#stop{color:#f8bec5}#pause{color:#bddbfa}#__flowchartCreator_app_controls__{color:rgba(0,0,0,.2);background:rgba(255,255,255,.3);font-weight:100;width:34px;height:34px;padding:0;border-radius:100%;overflow:hidden;display:inline-block;cursor:pointer;bottom:8px;right:8px;position:absolute;transition:.3s}#__flowchartCreator_app_controls__ .open-close{transition:.3s;position:absolute;bottom:6px;width:24px;height:24px;z-index:999999999999;right:3.5px;font-size:24px;color:rgba(255,255,255,.3)}#__flowchartCreator_app_controls__:hover,#__flowchartCreator_app_controls__:hover .open-close{color:#000}#__flowchartCreator_app_controls__.open .open-close{color:#000}#__flowchartCreator_app_controls_box__{color:#000;opacity:0;position:relative;display:flex;justify-content:space-around;align-items:center;height:100%;padding-right:8px;-webkit-transform:translateX(30px);transform:translateX(30px)}#__flowchartCreator_app_controls__.open{width:12rem;height:2.3rem;position:absolute;margin:0;cursor:inherit;z-index:99999999999999;border-radius:3px}#__flowchartCreator_app_controls__.open .open-close{color:#000;font-size:24px;opacity:.7;cursor:pointer;z-index:2}#__flowchartCreator_app_controls__.open .open-close:hover{opacity:1}#__flowchartCreator_app_controls__.open #__flowchartCreator_app_controls_box__{opacity:1!important;-webkit-transform:translateY(0)!important;transform:translateY(0)!important;-moz-transition:-moz-transform .5s .55s,opacity 1s .55s!important;-o-transition:-o-transform .3s .35s,opacity 1s .35s!important;transition:transform .3s .35s,opacity 1s .35s,-webkit-transform .3s .35s!important}`;
var control_html = `<i id="__flowchartCreator_app_controls_toggle_btn__" class="fa fa-cog open-close" data-toggle="false"></i>
<div id="__flowchartCreator_app_controls_box__" style="margin-right: 1rem;">
    <i id="start" title="Start Recording" class="fa fa-play action-btn"></i>
    <i id="pause" title="Pause the recording" class="fa fa-pause action-btn"></i>
    <i id="stop" title="Stop Recording" class="fa fa-stop action-btn"></i>
</div>`;
var data = { url: "", state: "stop" };

ipcRenderer.on('on-parent-recv', function (event, data) {
    ipcRenderer.send('data-from-child', { value: 'hello' });
});
ipcRenderer.send('data-from-child', { value: 'loaded' });
var inspecting_element = {};
var clicked = false;
function get_height(element) {
    var elementHeight, elementMargin, elementBorder;
    elementHeight = parseFloat(document.defaultView.getComputedStyle(element, '').getPropertyValue('height').replaceAll(/px|rem|vh|vhmax|%/ig, ""));
    var mb = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-bottom'));
    var mt = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-top'))
    elementMargin = ((isNaN(mt) || mt < 0) ? 0 : mt) + ((isNaN(mb) || mb < 0) ? 0 : mb);
    var bb = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('border-bottom'));
    var bt = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('border-top'))
    elementBorder = ((isNaN(bt) || bt < 0) ? 0 : bt) + ((isNaN(bb) || bb < 0) ? 0 : bb);
    return elementHeight + elementMargin + elementBorder;
}

function get_width(element) {
    var elementWidth, elementMargin, elementBorder;
    elementWidth = parseFloat(document.defaultView.getComputedStyle(element, '').getPropertyValue('width').replaceAll(/px|rem|vh|vhmax|%/ig, ""));
    var ml = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-left'));
    var mr = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('margin-right'))
    elementMargin = ((isNaN(mr) || mr < 0) ? 0 : mr) + ((isNaN(ml) || ml < 0) ? 0 : ml);
    var bl = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('border-left'));
    var br = parseInt(document.defaultView.getComputedStyle(element, '').getPropertyValue('border-right'))
    elementBorder = ((isNaN(br) || br < 0) ? 0 : br) + ((isNaN(bl) || bl < 0) ? 0 : bl);
    return elementWidth + elementMargin + elementBorder;
}

function _createMark(element, cy_selector) {
    var rect = element.getBoundingClientRect();
    var win = element.ownerDocument.defaultView;
    var top = rect.top;
    var left = rect.left + win.pageXOffset;
    var right = rect.right;
    var width = get_width(document.body);
    var element_height = get_height(element);
    top = top < 36 ? ((isNaN(element_height) ? 16 : element_height) + top + 5) : (rect.top - 28);

    var e = document.getElementById("__cy_selector_extension__");
    if (e != null)
        e.remove();
    var div_ele = document.createElement("div");
    div_ele.id = "__cy_selector_extension__";
    var colors = { "textColor": "white", "backgroundColor": "rgb(0,0,0)" };
    div_ele.innerHTML += "<div id='__fbrowser_selection_mark_area_content__' style='pointer-events: none;margin:0;z-index:200000;padding: 4px 6px !important;border-radius:6px;color:" + colors["textColor"] + ";background-color:" + colors["backgroundColor"] + ";font-weight:bold;font-size:16px;position:fixed;top:" + top + "px;" + ((width - left < 200) ? `right:${width - right}px;` : `left:${left}px;`) + "'>" + cy_selector + "</div>";
    document.body.append(div_ele);
}

function _clear() {
    if ("current_element" in inspecting_element) {
        var ele = inspecting_element["current_element"];
        ele.style = inspecting_element["style"];
        if (inspecting_element["inline-style"] && inspecting_element["inline-style"].trim())
            ele.setAttribute("style", inspecting_element["inline-style"]);
        else
            ele.removeAttribute("style");
    }
    var e = document.getElementById("__cy_selector_extension__");
    if (e != null)
        e.remove();
    clicked = false;
}

function handleMouseOver(e) {
    if (!clicked) {
        _clear();
        e = e || window.event;
        var element = e.target || e.srcElement;
        var text = element.textContent || element.innerText;
        var s = element.style;
        inspecting_element["current_element"] = element;
        inspecting_element["style"] = s;
        inspecting_element["inline-style"] = element.getAttribute("style")
        element.style.backgroundColor = "#0175c26b";
        element.style.border = "2px solid orange";
        var selector = "Element hovered";
        _createMark(element, selector);
    }
}

function handleClick(event) {
    if (document.getElementById("__cy_selector_extension__")) {
        // event.preventDefault();
        // event.stopPropagation();
        clicked = true;
        var e = document.getElementById("__fbrowser_selection_mark_area_content__");
        if (e) {
            e.style.pointerEvents = "auto";
        }
    }
}
function handleKeyUp(event) {
    var vKey = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
    // If Escape key is pressed
    if (vKey == 27) {
        _clear();
    }
}

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
}

function pause_recording() {
    var start_btn = document.getElementById("start");
    var stop_btn = document.getElementById("stop");
    var pause_btn = document.getElementById("pause");
    pause_btn.style.color = "#bddbfa";
    pause_btn.style.pointerEvents = "none";
    start_btn.setAttribute("title", "Resume Recording");
    start_btn.classList = "fa fa-play start-pause action-btn";
    start_btn.style.color = "#28a745";
    start_btn.style.pointerEvents = "auto";
    stop_btn.style.color = "#f8bec5";
    stop_btn.style.pointerEvents = "none";
    data.state = "pause";
    removeEventListeners();
}
function toggleControls() {
    var controls = document.getElementById("__flowchartCreator_app_controls__");
    var classes = controls.classList;
    if (classes != "open")
        controls.classList = "open";
    else
        controls.classList = "";
}

function addEventListeners() {
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keyup", handleKeyUp);
}

function removeEventListeners() {
    _clear();
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keyup", handleKeyUp);
}

document.addEventListener('DOMContentLoaded', function () {
    addControls();
    document.getElementById("__flowchartCreator_app_controls_toggle_btn__").addEventListener("click", toggleControls);
    document.getElementById("start").addEventListener("click", start_recording);
    document.getElementById("stop").addEventListener("click", stop_recording);
    document.getElementById("pause").addEventListener("click", pause_recording);
});