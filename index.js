'use strict';

const path = require('path');
const fs = require("fs");
const {exec} = require("child_process");
const {getLastPath,deleteDirIfExist,copyDir,generateFolder,processAllPaths} = require("./folder");
const {getExtName,getFileName,getFileContent,saveFileContent} = require("./file");
const {initWords,randomWords,randomWord,getRandomIndex} = require("./random");
const format = require('string-format');
const {getSpace,upperWordFirst,upperStringFirst} = require("./string");
const linq = require("linq");
const {hasValue,isArrayData} = require("./array");

//目标：
//1.修改oc和swift类的类名和其引用关系
//2.为oc和swift类注入一些骚方法和属性
//3.修改Assets文件夹下面的所有图片名称
//4.修改oc每一个分类名称
//5.修改修改工程名
//修改字符串常量

//流程：
//1.遍历工程拿到所有关注点文件；
//2.对所有关注点文件生成预处理项目；
//3.遍历预处理项目，做一些后置配置；
//4.遍历配置好的每个预处理项目，修改源码文件；

//项目配置
const const_param_required_config = ["project"];
const const_param_match_template = `--(.*)=(.*)`;
let var_project_root = "";
let var_project_temp = "";
let var_reg_not_focus_path = [];
//代码配置
const const_h_replace_prop_template =
    `(@interface.*{target}.*)`;
const const_h_prop_count = 90;
const const_h_prop_usable_types = [
    {
        qualifier:"strong",
        type:"UIImage *",
        filler:false,
        prefix:"view_",
    },
    {
        qualifier:"copy",
        type:"NSString *",
        filler:false,
        prefix:"str_",
    },
    {
        qualifier:"strong",
        type:"NSDate *",
        filler:false,
        prefix:"date_",
    },
    // {
    //     qualifier:"assign",
    //     type:"NSInteger",
    //     filler:true,
    //     prefix:"int_",
    // },
    {
        qualifier:"strong",
        type:"NSDictionary *",
        filler:false,
        prefix:"dict_",
    },
    {
        qualifier:"strong",
        type:"UIView *",
        filler:false,
        prefix:"view_",
    },
    {
        qualifier:"strong",
        type:"UILabel *",
        filler:false,
        prefix:"view_",
    },
    {
        qualifier:"strong",
        type:"UITableView *",
        filler:false,
        prefix:"view_",
    },
    {
        qualifier:"strong",
        type:"UIImageView *",
        filler:false,
        prefix:"view_",
    }
];
const const_h_prop_name_min_words = 1;
const const_h_prop_name_max_words = 2;
const const_h_prop_template =
    "@property (nonatomic, {qualifier}) {type}{filler}{prefix}{name};";
const const_h_replace_func_template =
    `(@interface.*{target}[\\s\\S]*?)(@end)`;
const const_h_func_param_max_count = 6;
const const_h_func_param_usable_types =
    const_h_prop_usable_types.map((v)=>{
    return {type:v.type};
});
const const_h_func_param_template =
    `arg{name}:({type})arg{name}`;
const const_h_func_count = 80;
const const_h_func_usable_types= [];
const_h_prop_usable_types.forEach((v)=>{
    const_h_func_usable_types.push({
        type:v.type,
        prefix:"do_",
    });
    const_h_func_usable_types.push({
        type:v.type,
        prefix:"get_",
    });
});
const const_h_func_template =
    `- ({type}){prefix}{name}{param};`;
const const_m_replace_func_template =
    `(@implementation.*{target}[\\s\\S]*?)(@end)`;
const const_reg_m_func_match = /(.*?);/g;
const const_m_func_template =
    `$1 {\n${getSpace(4)}NSLog(@"");\n${getSpace(4)}return nil;\n}`;

const allFocusEditItem = [
    // {
    //     keyword:"[搜索|定位|标识|索引|目标]关键词；字符串",
    //     itemType:"item类型；字符串",
    //     itemPath:"item全路径；字符串",
    //     actionType:"操作/行为类型；字符串",
    //     actionData:"操作/行为相关数据；任何js类型",
    // }
];

function configProjectPath(config) {
    var_project_root=config;
    var_project_temp=`${getLastPath(var_project_root)}/temp`;
    var_reg_not_focus_path=[
        `${var_project_temp}/Pods[\\s\\S]*`,
        `${var_project_temp}/[^/]*Tests[\\s\\S]*`,
        `${var_project_temp}/[^/]*UITests[\\s\\s]*`,
        `${var_project_temp}/Podfile`,
        `${var_project_temp}/Podfile.lock`,
        `${var_project_temp}/LICENSE`,
        `${var_project_temp}/README.md`,
        `${var_project_temp}/[^/]*.xcodeproj[\\s\\S]*`,
        `${var_project_temp}/[^/]*.xcworkspace[\\s\\S]*`
    ];
}

function processConfigItem(cmd,config) {
    if (cmd == "project") {
        configProjectPath(config);
    }
}

function processConfigParam() {
    //提取项目配置并检查语法
    const args = process.argv.slice(2);
    const params=[];
    args.forEach((v)=>{
        const reg = new RegExp(const_param_match_template,"g");
        const items = reg.exec(v);
        if (!items||items.length<3) {
            throw new Error(`语法异常：${v}`);
        }
        params.push({
            cmd:items[1],
            config:items[2],
        });
    });
    //检查必选配置项
    const cmdParams=params.map((v)=>v.cmd);
    const_param_required_config.forEach((v)=>{
        if (!hasValue(cmdParams,v)) {
            throw new Error(`缺少必选参数：--${v}`);
        }
    });
    //配置上下文配置变量
    params.forEach(v=>processConfigItem(v.cmd,v.config));
}

function isNotFocusPath(fullPath) {
    let isNotFocus=false;
    const arrPath=var_reg_not_focus_path;
    for (let i = 0; i < arrPath.length; i++) {
        const path=arrPath[i];
        const reg = new RegExp(path,"g");
        if (reg.test(fullPath)) {
            isNotFocus=true;
            break;
        }
    }
    return isNotFocus;
}

function isController(filePath) {
    //检查继承链，判断是否为controller
    //先暂时写为简单判断
    const regIsController = /controller/gi;
    const fileName = getFileName(filePath);
    return regIsController.test(fileName);
}

function processDotHFile(filePath) {
    //检查继承链，判断是否为controller
    //先暂时写为简单判断
    if (!isController(filePath)) {
        return;
    }
    //为.h文件生成属性列表
    const arrDotHNewProp = [];
    for (let i = 0; i < const_h_prop_count; i++) {
        const randomIndex =
            getRandomIndex(const_h_prop_usable_types.length);
        const randomPropType =
            const_h_prop_usable_types[randomIndex];
        const words = randomWords(
            const_h_prop_name_min_words,
            const_h_prop_name_max_words
        );
        const propTypeParamMapping = {
            qualifier:randomPropType.qualifier,
            type:randomPropType.type,
            filler:randomPropType.filler?" ":"",
            prefix:randomPropType.prefix,
            name:words.map(v=>upperWordFirst(v)).join("_"),
        };
        const propItem = format(
            const_h_prop_template,
            propTypeParamMapping
        );
        arrDotHNewProp.push(propItem);
    }
    const focusPropEditItem = {
        keyword:getFileName(filePath),
        itemType:"h",
        itemPath:filePath,
        actionType:"add_property",
        actionData:arrDotHNewProp,
    };
    allFocusEditItem.push(focusPropEditItem);
    //为.h文件生成方法列表
    const arrDotHNewFunc = [];
    for (let i = 0; i < const_h_func_count; i++) {
        const arrFuncParams = [];
        const funcParamWords = randomWords(
            0,
            const_h_func_param_max_count
        );
        for (let j = 0; j < funcParamWords.length; j++) {
            const randomIndex =
                getRandomIndex(const_h_func_param_usable_types.length);
            const randomFuncParamType =
                const_h_func_param_usable_types[randomIndex];
            const word = funcParamWords[j];
            const funcParamTypeMapping = {
                type:randomFuncParamType.type,
                name:upperWordFirst(word),
            };
            const paramItem = format(
                const_h_func_param_template,
                funcParamTypeMapping
            );
            arrFuncParams.push(paramItem);
        }
        const randomIndex =
            getRandomIndex(const_h_func_usable_types.length);
        const randomFuncType =
            const_h_func_usable_types[randomIndex];
        const words = randomWords(1,2);
        const funcTypeMapping = {
            type:randomFuncType.type,
            prefix:randomFuncType.prefix,
            name:words.map(v => upperWordFirst(v)).join(""),
            param:upperStringFirst(arrFuncParams.join(" ")),
        };
        const funcItem = format(const_h_func_template,funcTypeMapping);
        arrDotHNewFunc.push(funcItem);
    }
    const focusFuncEditItem = {
        keyword:getFileName(filePath),
        itemType:"h",
        itemPath:filePath,
        actionType:"add_function",
        actionData:arrDotHNewFunc,
    };
    allFocusEditItem.push(focusFuncEditItem);
}

function processDotMFile(filePath) {
    //检查继承链，判断是否为controller
    //先暂时写为简单判断
    if (!isController(filePath)) {
        return;
    }
    //为.m文件生成空预处理项
    const focusFuncEditItem = {
        keyword:getFileName(filePath),
        itemType:"m",
        itemPath:filePath,
        actionType:"add_function",
        actionData:null,
    };
    allFocusEditItem.push(focusFuncEditItem);
}

function processFile(dir,file,fullPath) {
    const extName=getExtName(file);
    if (extName == ".h") {
        processDotHFile(fullPath);
    }
    else if (extName == ".m") {
        processDotMFile(fullPath);
    }
    else if (extName == ".swift") {
    }
    else if (extName == ".xib") {
    }
}

function processPath(stats,dir,file,fullPath) {
    if (isNotFocusPath(fullPath)) {
        return false;
    }
    if (stats.isFile()) {
        processFile(dir,file,fullPath);
    }
    else if (stats.isDirectory()) {
    }
    return true;
}

function processFocusEditItems() {
    //为.m文件补全预处理项：生成方法实现
    allFocusEditItem.forEach((v)=>{
        if (v.itemType == "m" &&
            v.actionType == "add_function") {
            const target=linq.from(allFocusEditItem)
                .first(t=>t.keyword==v.keyword&&
                    t.itemType=="h"&&t.actionType==v.actionType);
            if (target && isArrayData(target.actionData)) {
                const actionData=
                    target.actionData.map((f)=>{
                    const func=f.replace(
                        const_reg_m_func_match,
                        const_m_func_template
                    );
                    return func;
                });
                v.actionData=actionData;
            }
        }
    });
}

function applyAllFocusEditItems() {
    allFocusEditItem.forEach((v)=>{
        let fileContent = getFileContent(v.itemPath);
        if (v.itemType == "h") {
            if (v.actionType == "add_property" &&
                isArrayData(v.actionData)) {
                const props = v.actionData.join("\n");
                const regTemplateParam = {
                    target:v.keyword,
                };
                const regContent = format(
                    const_h_replace_prop_template,
                    regTemplateParam
                );
                const regReplace =
                    new RegExp(regContent,"g");
                fileContent=fileContent.replace(
                    regReplace,
                    `$1\n${props}`
                );
            }
            else if (v.actionType == "add_function" &&
                isArrayData(v.actionData)) {
                const funcs = v.actionData.join("\n");
                const regTemplateParam = {
                    target:v.keyword,
                };
                const regContent = format(
                    const_h_replace_func_template,
                    regTemplateParam
                );
                const regReplace =
                    new RegExp(regContent,"g");
                fileContent=fileContent.replace(
                    regReplace,
                    `$1\n${funcs}\n$2`
                );
            }
        }
        else if (v.itemType == "m") {
            if (v.actionType == "add_function"
                && isArrayData(v.actionData)) {
                const funcs = v.actionData.join("\n");
                const regTemplateParam = {
                    target:v.keyword,
                };
                const regContent = format(
                    const_m_replace_func_template,
                    regTemplateParam
                );
                const regReplace =
                    new RegExp(regContent,"g");
                fileContent=fileContent.replace(
                    regReplace,
                    `$1\n${funcs}\n$2`
                );
            }
        }
        else if (v.itemType == ".swift") {
        }
        else if (v.itemType == ".xib") {
        }
        saveFileContent(v.itemPath,fileContent);
    });
}

function doPreProcessing() {
    processConfigParam();
    initWords();
    deleteDirIfExist(var_project_temp);
    copyDir(var_project_root,var_project_temp);
}

function doProcessing() {
    //扫描文件生成继承关系树
    processAllPaths(var_project_temp,processPath);
    processFocusEditItems();
    applyAllFocusEditItems();
}

function doPostProcessing() {
}

function main() {
    doPreProcessing();
    doProcessing();
    doPostProcessing();
}

main();
