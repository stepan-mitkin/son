const testsCommon = require("./testsCommon")
const { exampleFile, makeSon } = testsCommon

QUnit.module('Handling errors');

QUnit.test('JavaScript error in input file', function (assert) {
    expectError("error_badjs.js", assert)
});

QUnit.test('Error in defineFunction', function (assert) {
    expectError("error_badDefineFunction.js", assert)
});


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
    son.main(exampleFile(filename), output).then(success).catch(error)
}