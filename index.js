#!/usr/bin/env node

const fs = require("fs").promises
const path = require("path")
const program = require("commander").program
const packageConfig = require("./package.json")
const sonCore = require("./src/sonCore")
const esprima = require('esprima')

async function mainCore(filename, options) {    

    try {
        var son = sonCore()
        son.inject(path, fs, process, esprima)
        await son.main(filename, options.output)
    } catch (ex) {
        console.log(ex)
    }
}


function main() {


    program
        .name(packageConfig.name)
        .version(packageConfig.version)
        .description(packageConfig.description)
        .argument('<filename>', 'The Son file to parse. Can contain a function, a method, a class, or a module.')
        .option("-o, --output <folder>", "the output folder")
        .action(mainCore);

    program.parse(process.argv);

}

main()