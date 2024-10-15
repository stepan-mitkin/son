#!/usr/bin/env node

const fs = require("fs").promises
const path = require("path")
const program = require("commander").program
const packageConfig = require("./package.json")
const sonCore = require("./src/sonCore")
const esprima = require('esprima')
const escodegen = require('escodegen')

async function mainCore(filename, options) {    

    try {        
        var son = sonCore()
        var config = {
            verbose: options.verbose
        }
        son.inject(path, fs, process, esprima, escodegen, config)
        await son.main(filename, options.output)
    } catch (ex) {
        console.log(ex)
        process.exit(1)
    }
}


function main() {


    program
        .name(packageConfig.name)
        .version(packageConfig.version)
        .description(packageConfig.description)
        .argument('<filename>', 'The Son file to parse. Can contain a function, a method, a class, or a module.')
        .option("-O, --output <folder>", "the output folder")
        .option("-B, --verbose", "Show verbose console output")
        .action(mainCore);

    program.parse(process.argv);

}

main()