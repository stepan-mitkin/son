const nodeEval = require('node-eval');
const path = require("path")
const fs = require("fs").promises
const testsCommon = require("./testsCommon")
const { testSon } = testsCommon

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
})

testSon("examples2", assert => {
    var mod1 = proj1()
    var mod2 = proj2()
    assert.equal(10, mod1.getMyValue())
    assert.equal(20, mod2.getMyValue())
}, ["proj1.js", "proj2.js"])