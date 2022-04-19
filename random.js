'use strict';

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");
const {processAllPaths} = require("./folder");
const {getFileContent} = require("./file");

let arrWords = [];

function initWords() {
    // console.log("开始");
    // processAllPaths(__dirname,(stats,dir,v,fullPath)=>{
    //     console.log(fullPath);
    //     if (stats.isFile()) {
    //         console.log(getFileContent(fullPath));
    //     }
    //     return true;
    // });
    // console.log("结束");
    const file = "./english-words/words_dictionary.json";
    const pathFile = path.join(__dirname, file);
    const data = fs.readFileSync(pathFile);
    const words = data.toString();
    const json = JSON.parse(words);
    arrWords = Object.keys(json);
}

function getRandomIndex(count) {
    return Math.floor(Math.random()*count);
}

function randomWords(min=1,max=1) {
    const words = [];
    const count = getRandomIndex(max)+min;
    for (let i = 0; i < count; i++) {
        const randomIndex =
            getRandomIndex(arrWords.length);
        words.push(arrWords[randomIndex]);
    }
    return words;
}

function randomWord() {
    return randomWords(1,1)[0];
}

exports.initWords=initWords;
exports.getRandomIndex=getRandomIndex;
exports.randomWords=randomWords;
exports.randomWord=randomWord;
