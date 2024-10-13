const testsCommon = require("./testsCommon")
const { exampleErrorFile, makeSon } = testsCommon

QUnit.module('Handling errors');

tailTest("son0010_badjs.js");
tailTest("son0011_badDefineFunction.js");
tailTest("son0013_startSection_badName.js");
tailTest("son0014_startSection_manyArguments.js");
tailTest("son0015_plainCode_afterFunction.js");
tailTest("son0018_no_afterFunction.js");
tailTest("son0018_yes_afterFunction.js");
tailTest("son0019_no_outsideFunction.js");
tailTest("son0019_yes_outsideFunction.js");


function tailTest(filename) {
    QUnit.test(filename, function (assert) {
        expectError(filename, assert)
    });
}


function expectError(filename, assert) {
    const done = assert.async();
    var success = () => {        
        assert.true(false, "Exception expected")
        done()
    }

    var error = (ex) => {        
        assert.true(true, "Exception asserted")
        done()
    }

    parse(filename, undefined, success, error)
}

function parse(filename, output, success, error) {
    var son = makeSon()
    son.main(exampleErrorFile(filename), output).then(success).catch(error)
}