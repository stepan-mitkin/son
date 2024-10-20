#!/usr/bin/env node

const fs = require("fs").promises
const path = require("path")
const program = require("commander").program
const packageConfig = require("./package.json")
const sonCore = require("./src/sonCore")
const esprima = require('esprima')
const escodegen = require('escodegen')

async function mainCore(filename, options) {    

    if (options.commonjs && options.es) {
        console.log("Cannot have --commonjs and --es options at the same time")
        exit(1)
    }
    try {        
        var son = sonCore()
        var config = {
            verbose: options.verbose,
            relax: options.relax
        }
        if (options.commonjs) {
            config.format = "commonjs"
        } else if (options.es) {
            config.format = "es"
        } else {
            config.format = "browser"
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
        .argument('<path>', 'A folder, a module file, or a function file.')
        .option("-O, --output <folder>", "the output folder")
        .option("-B, --verbose", "Show verbose console output")
        .option("-C, --commonjs", "Generate CommonJS modules")
        .option("-E, --es", "Generate ES modules")
        .option("-X, --relax", "Allow 'if', 'for', and 'switch' statements")
        .action(mainCore);

    program.parse(process.argv);

}

main()