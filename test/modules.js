const nodeEval = require('node-eval');
const path = require("path")
const fs = require("fs").promises
const testsCommon = require("./testsCommon")
const { testSon, makeSon, getTmp, parseAndLoad } = testsCommon

QUnit.module('Modules');


testSon("myModule/myModule.son", assert => {
    var mod = myModule("Dar", "Veter")
    assert.equal("Dar Veter", mod.getNames())
    mod.setNames("Darth", "Vader")
    assert.equal("Darth Vader", mod.getNames())

    var array = [4, 2, 3, 1]
    mod.quickSort(array, 0, array.length, (left, right) => {
        if (left < right) {
            return -1
        } else if (left > right) {
            return 1
        }

        return 0
    })
    assert.equal(1, array[0])
    assert.equal(2, array[1])
    assert.equal(3, array[2])
    assert.equal(4, array[3])
    assert.equal(73, mod.runProp())
})

testSon("relax/relax.son", assert => {
    var mod = relax()
    var index = mod.forStatement(['a', 'b', 'c'], 'c')
    assert.equal(2, index)

    var s1 = mod.forOfStatement([10, 20, 30])
    assert.equal(60, s1)

    var s2 = mod.forInStatement({a: 100, b: 200, c: 300})
    assert.equal(600, s2)
})

testSon("lazy/lazy.son", assert => {
    var callIt = lazy(true)
    var v2 = callIt.getValue2()
    var counter = callIt.getCounter()
    assert.equal(1, counter)
    assert.equal("value2: value1", v2)

    var dcallIt = lazy(false)
    var dv2 = dcallIt.getValue2()
    var dcounter = dcallIt.getCounter()
    assert.equal(0, dcounter)
    assert.equal("value2: no call", dv2)    
})

testSon("examples2", assert => {
    var mod1 = proj1()
    var mod2 = proj2()
    assert.equal(10, mod1.getMyValue())
    assert.equal(20, mod2.getMyValue())
}, ["proj1.js", "proj2.js"])


QUnit.test("asyncProp", assert => {
    var done = assert.async()
    var son = makeSon()
    
    asyncPropTest(assert, son).then(() => {
        done()
    }).catch(ex => {
        console.error(ex)
        assert.true(false)
        done()
    })
})

async function asyncPropTest(assert, son) {
    await parseAndLoad(son, "asyncProp", ["asyncProp.js"])    
    var filename = path.join(getTmp(), "cat.txt")
    await fs.writeFile(filename, "meou", "utf-8")
    var mod = asyncProp(fs, filename)
    var content = await mod.fun1()
    assert.equal("meou", content)
}
