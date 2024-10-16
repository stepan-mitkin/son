const nodeEval = require('node-eval');
const path = require("path")
const fs = require("fs").promises
const testsCommon = require("./testsCommon")
const { exampleFile, makeSon } = testsCommon

QUnit.module('Functions');


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

testSon("add.js", assert => {
    assert.equal(7, add(2, 3))
})

testSon("fizzbuzz.js", assert => {
    assert.equal(undefined, fizzbuzz(1))
    assert.equal(undefined, fizzbuzz(2))
    assert.equal("Fizz", fizzbuzz(3))
    assert.equal(undefined, fizzbuzz(4))
    assert.equal("Buzz", fizzbuzz(5))
    assert.equal("Fizz", fizzbuzz(6))
    assert.equal("FizzBuzz", fizzbuzz(15))
})

testSon("sortByName.js", assert => {
    var array = [{"name":"A"},{"name":"B"},{"name":"C"}]
    sortByName(array)
    assert.equal('[{"name":"A"},{"name":"B"},{"name":"C"}]', JSON.stringify(array))
    array = [{"name":"C"},{"name":"B"},{"name":"A"}]
    sortByName(array)
    assert.equal('[{"name":"A"},{"name":"B"},{"name":"C"}]', JSON.stringify(array))    
})

testSon("fibonacci.js", assert => {
    assert.equal(0, fibonacci(0))
    assert.equal(1, fibonacci(1))
    assert.equal(1, fibonacci(1))
    assert.equal(2, fibonacci(3))
    assert.equal(3, fibonacci(4))
    assert.equal(5, fibonacci(5))
    assert.equal(8, fibonacci(6))
    assert.equal(13, fibonacci(7))
})

QUnit.test("async/await", assert => {
    var done = assert.async()
    var son = makeSon()
    
    runAsyncTest(assert, son).then(() => {
        done()
    }).catch(ex => {
        console.error(ex)
        assert.true(false)
        done()
    })
})

async function runAsyncTest(assert, son) {
    await parseAndLoad(son, "readTextFromFile.js")
    await parseAndLoad(son, "writeTextToFile.js")
    var filename = path.join(getTmp(), "hello.txt")
    await writeTextToFile(fs, filename, "hello")
    var content = await readTextFromFile(fs, filename)
    assert.equal("hello", content)
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
    var srcFile = path.join(output, filename)
    var source = await fs.readFile(srcFile, "utf-8")    
    nodeEval(source, srcFile)    
}