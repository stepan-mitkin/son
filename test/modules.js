const nodeEval = require('node-eval');
const path = require("path")
const fs = require("fs").promises
const testsCommon = require("./testsCommon")
const { testSon } = testsCommon

QUnit.module('modules');


testSon("myModule.son", assert => {
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