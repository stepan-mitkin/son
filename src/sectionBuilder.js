const { getCall, getLine } = require("./common")


function nextExpression(obj, expr) {
    var step = readExpression(expr)
    switch (obj.state) {
        case "start":
            handleStart(obj, step)
            break
        case "plot":
            handlePlot(obj, step)
            break
        case "noplot":
            handleNoPlot(obj, step)
            break
        default:
            throw new Error("Unexpected state: " + obj.state)
    }
}

function readExpression(expr) {
    var line = getLine(expr)
    if (expr.type === "FunctionDeclaration") {
        throw new Error("SON029: FunctionDeclaration is not allowed in a Son file. Line " + line)
    }
    var call = getCall(expr)
    if (call) {
        if (call.name === "plot") {
            var name = ""
            if (call.arguments.length !== 0) {
                var first = call.arguments[0]
                if (first.type != "Literal" || typeof first.value !== "string" ) {
                    throw new Error("SON028: a string literal is expected in plot(), got " + first.type + ". Line " + line)
                }
                name = first.value
            }            
            return {
                type: "plot",
                line: line,
                name: name
            }             
        }
        if (call.name === "yes" || call.name === "no") {
            if (call.arguments.length !== 1) {
                throw new Error("SON0012: yes/no accepts one argument. Line: " + line)
            }
            return {
                type: "rule",
                line: line,
                condition: call.name,                
                arguments: call.arguments,
                expression: expr
            }
        }
        if (call.name === "section") {
            var name
            if (call.arguments.length === 0) {
                name = ""                
            } else if (call.arguments.length === 1) {
                var arg = call.arguments[0]
                if (arg.type !== "Literal" || typeof arg.value !== "string") {
                    throw new Error("SON0013: the argument of section must be a string. Line: " + line)
                }
                name = arg.value                    
            } else {
                throw new Error("SON0014: section accepts one or zero arguments. Line: " + line)
            }
            return {
                type: "section",
                line: line,
                name: name
            }  
        }
    }

    var type
    if (expr.type === "ReturnStatement" || expr.type === "ThrowStatement") {
        type = "plotend"
    } else {
        type = "code"
    }

    return {
        type: type,
        line: line,
        expression: expr
    }
}

function handleStart(obj, step) {
    switch (step.type) {
        case "code":
        case "plotend":
            obj.current.body.push(step.expression)
            break
        case "rule":
            startPlot(obj, undefined, step.line)
            addToPlot(obj, step.expression)
            obj.state = "plot"
            break  
        case "plot":
            startPlot(obj, step.name, step.line)            
            obj.state = "plot"
            break
        case "section":
            startNextSection(obj, step.name, step.line)
            obj.state = "start"
            break
        default:
            throw new Error("SON0016: Unexpected expression type: " + step.type)
    }
}

function handlePlot(obj, step) {
    switch (step.type) {
        case "code":
        case "rule":            
            addToPlot(obj, step.expression)
            break
        case "plotend":
            addToPlot(obj, step.expression)
            obj.state = "noplot"
            break
        case "plot":
            startPlot(obj, step.name, step.line)            
            obj.state = "plot"
            break            
        case "section":
            startNextSection(obj, step.name, step.line)
            obj.state = "start"
            break
        default:
            throw new Error("SON0017: Unexpected expression type: " + step.type)
    }
}

function handleNoPlot(obj, step) {
    switch (step.type) {
        case "code":
        case "plotend":
            throw new Error("SON0019: yes()/no(), plot(), or section() expected here. Line " + step.line)
        case "rule":            
            startPlot(obj, undefined, step.line)
            addToPlot(obj, step.expression)
            obj.state = "plot"
            break
        case "plot":
            startPlot(obj, step.name, step.line)            
            obj.state = "plot"
            break            
        case "section":
            startNextSection(obj, step.name, step.line)
            obj.state = "start"
            break
        default:
            throw new Error("SON0017: Unexpected expression type: " + step.type)
    }
}

function startPlot(obj, name, line) {
    var plots = obj.current.plots
    if (!name) {
        var plotName = "plot " + (plots.length + 1)
        name = obj.current.name + ", " + plotName
    }
    var plot = {
        name: name,
        line: line,
        body: []
    }
    plots.push(plot)
}

function addToPlot(obj, expr) {
    var plots = obj.current.plots
    var lastPlot = plots[plots.length - 1]
    lastPlot.body.push(expr)
}

function startNextSection(obj, name, line) {
    var ordinal = obj.current.ordinal + 1
    obj.sections.push(obj.current)
    obj.current = createSection(ordinal, name)
    obj.current.line = line
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
        plots: []
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