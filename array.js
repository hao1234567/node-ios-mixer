'use strict';

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");

const isArrayData = (data) => {
    return data && Array.isArray(data);
};

const hasValue = (values,value) => {
    return values.indexOf(value) !== -1;
};

exports.hasValue=hasValue;
exports.isArrayData=isArrayData;
