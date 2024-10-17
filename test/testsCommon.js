const nodeEval = require('node-eval');
const fs = require("fs").promises
const path = require("path")
const sonCore = require("../src/sonCore")
const esprima = require('esprima')
const escodegen = require('escodegen')


function makeSon() {
    var son = sonCore()
    var config = {
        verbose: false
    }
    son.inject(path, fs, process, esprima, escodegen, config)
    return son
}

function exampleFile(filename) {
    var full = path.join(__dirname, "../", "examples", filename)
    return path.normalize(full)
}

function exampleErrorFile(filename) {
    var full = path.join(__dirname, "..", "errors", filename)
    return path.normalize(full)
}

async function makeTmp() {
    var folder = getTmp()
    try {
        await fs.mkdir(folder);
    } catch (ex) {
    }    
}

function getTmp() {
    var full = path.join(__dirname, "..", "tmp")
    return path.normalize(full)
}


function testSon(filename, callback) {
    QUnit.test(filename, assert => {
        var done = assert.async()
        var son = makeSon()
        runTest(assert, son, filename, callback).then(() => {
            done()
        }).catch(ex => {
            console.error(ex)
            assert.true(false)
            done()
        })
    })    
}


async function runTest(assert, son, filename, callback) {
    await parseAndLoad(son, filename)
    callback(assert)
}

async function parseAndLoad(son, filename) {
    await makeTmp()
    var fullName = exampleFile(filename)
    var output = getTmp() 
    await son.main(fullName, output)
    if (filename.endsWith(".son")) {
        filename = filename.replace(".son", ".js")
    }
    var srcFile = path.join(output, filename)
    var source = await fs.readFile(srcFile, "utf-8")    
    nodeEval(source, srcFile)    
}

module.exports = {
    testSon,
    makeSon,
    getTmp,
    makeTmp,
    exampleFile,
    exampleErrorFile
}