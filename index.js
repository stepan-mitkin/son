#!/usr/bin/env node
const fs = require("fs").promises
const path = require("path")
const program = require("commander").program
const packageConfig = require("./package.json")
const sonCore = require("./src/sonCore")


function mainCore(filename, options) {    

    var son = sonCore()
    son.inject(path, fs, process)
    son.main(filename, options.output)
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