const labelledNodeNames$labels = ['button', 'meter', 'output', 'progress', 'select', 'textarea', 'input'];

function getTextContent(node) {
    if (labelledNodeNames$labels.includes(node.nodeName.toLowerCase())) {
        return '';
    }

    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    return Array.from(node.childNodes).map(childNode => getTextContent(childNode)).join('');
}
function computeAriaSelected(element) {

    if (element.tagName === 'OPTION') {
        return element.selected;
    }
    return checkBooleanAttribute(element, 'aria-selected');
}

function computeAriaChecked(element) {
    if ('indeterminate' in element && element.indeterminate) {
        return undefined;
    }

    if ('checked' in element) {
        return element.checked;
    }
    return checkBooleanAttribute(element, 'aria-checked');
}

function computeAriaPressed(element) {
    return checkBooleanAttribute(element, 'aria-pressed');
}

function computeAriaCurrent(element) {
    var _ref, _checkBooleanAttribut;
    return (_ref = (_checkBooleanAttribut = checkBooleanAttribute(element, 'aria-current')) != null ? _checkBooleanAttribut : element.getAttribute('aria-current')) != null ? _ref : false;
}

function computeAriaExpanded(element) {
    return checkBooleanAttribute(element, 'aria-expanded');
}

function checkBooleanAttribute(element, attribute) {
    const attributeValue = element.getAttribute(attribute);

    if (attributeValue === 'true') {
        return true;
    }

    if (attributeValue === 'false') {
        return false;
    }

    return undefined;
}

function computeHeadingLevel(element) {
    const implicitHeadingLevels = {
        H1: 1,
        H2: 2,
        H3: 3,
        H4: 4,
        H5: 5,
        H6: 6
    };
    const ariaLevelAttribute = element.getAttribute('aria-level') && Number(element.getAttribute('aria-level'));
    return ariaLevelAttribute || implicitHeadingLevels[element.tagName];
}

function queryAllByAttribute(element, attribute, text, trim = false) {
    return Array.from(element.querySelectorAll(`[${attribute}]`)).filter(node => matchStrings(node.getAttribute(attribute), text, trim))
}

function queryByAttribute(element, attribute, text, trim = false) {
    var elements = queryAllByAttribute(element, attribute, text, { trim: trim });
    if (elements.length > 1) {
        return none;
    }
    return elements[0] || null;
}

function evaluateXpath(xpath, count = 1) {
    var res = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (res.snapshotLength == count || count == -1) {
        return res;
    }
    return null;
}

function getAttributesByRegex(element, regex) {
    var attributes = element.attributes;
    var results = [];
    for (let i = 0; i < attributes.length; i++) {
        var attr = attributes[i];
        var isMatched = regex.test(attr.name);
        if (isMatched) {
            results.push({ attribute: attr.name, value: attr.value });
        }
    }
    return results;
}

function isVisible(ele) {
    var style = window.getComputedStyle(ele);
    return style.width !== "0" &&
        style.height !== "0" &&
        style.opacity !== "0" &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';
}
function removeQuotes(str) {
    if (str.indexOf("'") != -1) {
        str = "\"" + str + "\"";
    } else if (str.indexOf('"') != -1) {
        str = "\'" + str + "\'";
    } else {
        str = "\"" + str + "\"";
    }
    return str;
}

function matchStrings(textToMatch, matcher, trim = false) {
    if (trim)
        textToMatch = textToMatch.trim();
    return textToMatch === String(matcher);
}

function getNodeText(node) {
    if (node.matches('input[type=submit], input[type=button], input[type=reset]')) {
        return node.value;
    }

    return Array.from(node.childNodes).filter(child => child.nodeType === Node.TEXT_NODE && Boolean(child.textContent)).map(c => c.textContent).join('');
}

exports.labelledNodeNames$labels = labelledNodeNames$labels;
exports.getTextContent = getTextContent;
exports.computeAriaSelected = computeAriaSelected;
exports.computeAriaChecked = computeAriaChecked;
exports.computeAriaPressed = computeAriaPressed;
exports.computeAriaCurrent = computeAriaCurrent
exports.computeAriaExpanded = computeAriaExpanded;
exports.checkBooleanAttribute = checkBooleanAttribute;
exports.computeHeadingLevel = computeHeadingLevel;
exports.queryAllByAttribute = queryAllByAttribute;
exports.queryByAttribute = queryByAttribute;
exports.evaluateXpath = evaluateXpath;
exports.getAttributesByRegex = getAttributesByRegex;
exports.isVisible = isVisible;
exports.removeQuotes = removeQuotes;
exports.matchStrings = matchStrings;
exports.getNodeText = getNodeText;