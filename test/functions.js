const path = require("path")
const fs = require("fs").promises
const testsCommon = require("./testsCommon")
const { makeSon, getTmp, testSon, parseAndLoad } = testsCommon

QUnit.module('Functions');




testSon("myModule/add.js", assert => {
    assert.equal(7, add(2, 3))
})

testSon("myModule/fizzbuzzNoPlot.js", assert => {
    assert.equal(undefined, fizzbuzzNoPlot(1))
    assert.equal(undefined, fizzbuzzNoPlot(2))
    assert.equal("Fizz", fizzbuzzNoPlot(3))
    assert.equal(undefined, fizzbuzzNoPlot(4))
    assert.equal("Buzz", fizzbuzzNoPlot(5))
    assert.equal("Fizz", fizzbuzzNoPlot(6))
    assert.equal("Buzz", fizzbuzzNoPlot(10))
    assert.equal("FizzBuzz", fizzbuzzNoPlot(15))
})

testSon("myModule/fizzbuzz.js", assert => {
    assert.equal(undefined, fizzbuzz(1))
    assert.equal(undefined, fizzbuzz(2))
    assert.equal("Fizz", fizzbuzz(3))
    assert.equal(undefined, fizzbuzz(4))
    assert.equal("Buzz", fizzbuzz(5))
    assert.equal("Fizz", fizzbuzz(6))
    assert.equal("Buzz", fizzbuzz(10))
    assert.equal("FizzBuzz", fizzbuzz(15))
})

testSon("myModule/sortByName.js", assert => {
    var array = [{"name":"A"},{"name":"B"},{"name":"C"}]
    sortByName(array)
    assert.equal('[{"name":"A"},{"name":"B"},{"name":"C"}]', JSON.stringify(array))
    array = [{"name":"C"},{"name":"B"},{"name":"A"}]
    sortByName(array)
    assert.equal('[{"name":"A"},{"name":"B"},{"name":"C"}]', JSON.stringify(array))    
})

testSon("myModule/fibonacci.js", assert => {
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
    await parseAndLoad(son, "myModule/readTextFromFile.js")
    await parseAndLoad(son, "myModule/writeTextToFile.js")
    var filename = path.join(getTmp(), "hello.txt")
    await writeTextToFile(fs, filename, "hello")
    var content = await readTextFromFile(fs, filename)
    assert.equal("hello", content)
}

