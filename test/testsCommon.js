const fs = require("fs").promises
const path = require("path")
const sonCore = require("../src/sonCore")
const esprima = require('esprima')


function makeSon() {
    var son = sonCore()
    var config = {
        verbose: false
    }
    son.inject(path, fs, process, esprima, config)
    return son
}

function exampleFile(filename) {
    var full = path.join(__dirname, "../", "examples", filename)
    return path.normalize(full)
}

function exampleErrorFile(filename) {
    var full = path.join(__dirname, "..", "examples", "errors", filename)
    return path.normalize(full)
}


module.exports = {
    makeSon,
    exampleFile,
    exampleErrorFile
}