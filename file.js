'use strict';

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");

const getExtName = (file) => {
    return path.extname(file);
};

const getFileName = (file) => {
    const extName=getExtName(file);
    return path.basename(file,extName);
};

const getFileContent = (file) => {
    return fs.readFileSync(file,'utf-8').toString();
};

const saveFileContent = (file,content) => {
    fs.writeFileSync(file, content);
};

exports.getExtName=getExtName;
exports.getFileName=getFileName;
exports.getFileContent=getFileContent;
exports.saveFileContent=saveFileContent;
