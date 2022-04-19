'use strict';

const os = require('os');
const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");
const {execCode} = require("./process");

const isExistDir = (path) => {
    return fs.existsSync(path);
};

const makeDir = (path) => {
    fs.mkdirSync(path)
};

const makeDirIfNotExist = (dir) => {
    if (!isExistDir(dir)) {
        makeDir(dir);
    }
};

const getLastPath = (dir) => {
    return path.resolve(dir,'..');
};

const deleteDir = (dir) => {
    if (os.type()=="Windows_NT") {
        throw new Error('暂不支持此系统');
    }
    else if (os.type()=="Darwin") {
        execCode(`rm -rf ${dir}`);
    }
    else if (os.type() == 'Linux') {
        throw new Error('暂不支持此系统');
    }
    else {
        throw new Error('暂不支持此系统');
    }
};

const deleteDirIfExist = (dir) => {
    if (isExistDir(dir)) {
        deleteDir(dir);
    }
};

const copyDir = (fromDir,toDir) => {
    makeDirIfNotExist(toDir);
    const files = fs.readdirSync(
        fromDir,{
        withFileTypes:true,
    });
    files.forEach((file) => {
        const pathFrom =
            path.resolve(fromDir,file.name);
        const pathTo =
            path.resolve(toDir,file.name);
        if (file.isDirectory()) {
            makeDirIfNotExist(pathTo);
            copyDir(pathFrom,pathTo);
        }
        else if (file.isFile()) {
            fs.copyFileSync(pathFrom,pathTo);
        }
        else if (file.isSymbolicLink()) {
            fs.copyFileSync(pathFrom,pathTo);
        }
    })
};

const processAllFiles = (dir,callback) => {
    const files = fs.readdirSync(dir);
    files.forEach((v) => {
        const fullPath = path.join(dir,v);
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
            if (callback) {
                callback(dir,v,fullPath);
            }
        }
        else if (stats.isDirectory()) {
            processAllFiles(fullPath,callback);
        }
    });
};

const processAllPaths = (dir,callback) => {
    const files = fs.readdirSync(dir);
    files.forEach((v) => {
        const fullPath = path.join(dir,v);
        const stats = fs.statSync(fullPath);
        if (stats.isFile()) {
            if (callback) {
                callback(stats,dir,v,fullPath);
            }
        }
        else if (stats.isDirectory() &&
            callback(stats,dir,v,fullPath)) {
            processAllPaths(fullPath,callback);
        }
    });
};

exports.getLastPath=getLastPath;
exports.deleteDirIfExist=deleteDirIfExist;
exports.copyDir=copyDir;
exports.processAllFiles=processAllFiles;
exports.processAllPaths=processAllPaths;
