const { getCall, getLine } = require("./common")

function nextExpression(obj, expr) {
    var step = readExpression(expr)
    switch (obj.state) {
        case "start":
            handleStart(obj, step)
            break
        case "fun":
            handleFun(obj, step)
            break
        default:
            throw new Error("Unexpected state: " + obj.state)
    }
}

function readExpression(expr) {
    var line = getLine(expr)
    if (expr.type === "FunctionDeclaration") {
        return {
            type: "function",
            line: line,
            expression: expr
        }
    }
    var call = getCall(expr)
    if (call) {
        if (call.name === "yes" || call.name === "no") {
            if (call.arguments.length !== 1) {
                throw new Error("SON0012: yes/no accepts one argument. Line: " + line)
            }
            return {
                type: "rule",
                line: line,
                condition: call.name,                
                arguments: call.arguments
            }
        }
        if (call.name === "startSection") {
            var name
            if (call.arguments.length === 0) {
                name = ""                
            } else if (call.arguments.length === 1) {
                var arg = call.arguments[0]
                if (arg.type !== "Literal" && typeof arg.value !== "string" ) {
                    throw new Error("SON0013: the argument of startSection must be a string. Line: " + line)
                }
                name = arg.value                    
            } else {
                throw new Error("SON0014: startSection accepts one or zero arguments. Line: " + line)
            }
            return {
                type: "section",
                line: line,
                name: name
            }  
        }
    }

    return {
        type: "code",
        line: line,
        expression: expr
    }
}

function handleStart(obj, step) {
    switch (step.type) {
        case "code":
            obj.current.body.push(step.expression)
            break
        case "rule":
            throw new Error("SON0019: yes/no is unexpected outside of function, line + " + step.line)
        case "function":
            obj.current.scenarios.push(step.expression)
            obj.state = "fun"
            break
        case "section":
            startNextSection(obj, step.name)
            obj.state = "start"
            break
        default:
            throw new Error("SON0016: Unexpected expression type")
    }
}

function startNextSection(obj, name) {
    var ordinal = obj.current.ordinal + 1
    obj.sections.push(obj.current)
    obj.current = createSection(ordinal, name)
}

function handleFun(obj, step) {
    switch (step.type) {
        case "code":
            throw new Error("SON0015: plain code is unexpected after function, line + " + step.line)
        case "rule":
            throw new Error("SON0018: yes/no is unexpected outside of function, line + " + step.line)
        case "function":
            obj.current.scenarios.push(step.expression)
            break
        case "section":
            startNextSection(obj, step.name)
            obj.state = "start"
            break
        default:
            throw new Error("SON0017: Unexpected expression type")
    }
}

function done(obj) {
    if (obj.state === "complete") {
        throw new Error("sectionBuilder is complete")
    }
    startNextSection(obj, undefined)
    obj.current = undefined
    obj.state = "complete"
}

function createSection(ordinal, name) {
    return {
        name: name || ("#" + ordinal),
        ordinal: ordinal,
        body: [],
        scenarios: []
    }
}

function sectionBuilder() {
    var obj = {
        sections: [],
        state: "start",
        current: createSection(1, "")
    }

    obj.nextExpression = function(expr) { nextExpression(obj, expr) }
    obj.done = function() { done(obj) }

    return obj
}


module.exports = sectionBuilder