const helpers = require("./helpers.js");
const queryAllByText = (container, text, {
    selector = '*',
    trim
} = {}) => {

    let baseArray = [];

    if (typeof container.matches === 'function' && container.matches(selector)) {
        baseArray = [container];
    }

    return [...baseArray, ...Array.from(container.querySelectorAll(selector))] // TODO: `matches` according lib.dom.d.ts can get only `string` but according our code it can handle also boolean :)
        .filter(node => helpers.matchStrings(helpers.getNodeText(node), text, trim));
};

exports.queryAllByText = queryAllByText;