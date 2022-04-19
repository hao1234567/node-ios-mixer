# node-ios-mixer
iOS代码防重工具

## 项目背景：
开发iOS过程中，有时候我们可能会上架差不多的应用，比如一个App叫XXX，另一个App叫XXX-极速版。上架过程中，苹果可能会提示重复代码，所以写了这个工具为项目生成并注入一些代码以产生代码层面的差异。

## 使用说明：
1、配置好node环境（项目基于node16开发）；
2、clone代码到本地；
3、打开终端，输入：node <path_to_this_project_root>/index.js --project=<target_project_root> ；
3.1、path_to_this_project_root：node-ios-mixer目录；
3.2、target_project_root：ios项目目录；
