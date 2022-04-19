'use strict';

const path = require('path');
const fs = require("fs");
const {execSync} = require("child_process");

const execCode = (code) => {
    return execSync(code);
};

exports.execCode=execCode;
