'use strict';

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");

const getSpace = (count) =>{
    const spaces=[];
    for (let i = 0; i < count; i++) {
        spaces.push(" ");
    }
    return spaces.join("");
};

const upperWordFirst = (word) => {
    return word.replace(/\b(\w)(\w*)\b/g,(p0,p1,p2) => {
        return p1.toUpperCase() + p2.toLowerCase();
    });
};

const upperStringFirst = (content) => {
    return content.replace(/(\w)(.*)/g,(p0,p1,p2) => {
        return p1.toUpperCase() + p2;
    });
};

exports.getSpace=getSpace;
exports.upperWordFirst=upperWordFirst;
exports.upperStringFirst=upperStringFirst;
