const {collectDeclarations, processAst, prependVariables, makeFunction,
    parseStructure } = require("./ast")
const { getCall, getLine } = require("./common")
const sectionBuilder = require("./sectionBuilder")
var path, fs, process, esprima, config, escodegen

function log(message) {
    if (config.verbose) {
        console.log(message)
    }
}

async function main(input, output) {
    if (!output) {
        output = process.cwd()
    }
    try {
        var feedFile = await readJsFile(input)
        if (feedFile.type === "function") {
            log("Single function mode: " + input)
            var generated = processSingleFile(feedFile)
            var filename = path.join(output, feedFile.name + ".js")
            await writeFile(filename, generated)
        } else if(feedFile.type === "module") {
            log("Module function mode: " + input)
            await handleModule(feedFile, output)
        } else {
            throw new Error("SON0006: File type not supported: " + input)
        }
    } catch (ex) {
        ex.filename = input
        throw ex
    }
}

function createVarContext() {
    return {
        variables: {},
        declarations: {},
        fields: {}
    }
}

async function readFile(filename) {
    return await fs.readFile(filename, "utf-8")
}

async function writeFile(filename, data) {    
    await fs.writeFile(filename, data, "utf-8")
}

async function readJsFile(filename) {

    var details = path.parse(filename)
    var content, parsed
    try {
        content = await readFile(filename)
    } catch (ex) {
        throw new Error("SON0005: could not read source file: " + ex.message)
    }
    try {
        var wrapped = "async function _wpd_() {" + content + "\n}"
        parsed = esprima.parseScript(wrapped, { loc: true })
    } catch (ex) {
        throw new Error("SON0010: error parsing source file: " + ex.message)
    }
    var body = parsed.body[0].body.body
    if (body.length !== 0) {
        var firstCall = getCall(body[0])
        if (firstCall) {
            if (firstCall.name === "fun"|| firstCall.name === "pfun") {
                var args = firstCall.arguments.map(ensureIdentifier)
                if (!areUnique(args)) {
                    throw new Error("SON0022: parameter names are not unique. Line " + firstCall.line)
                }
                body.shift()
                return {
                    type: "function",
                    filename: filename,
                    private: firstCall.name === "pfun",
                    body: body,
                    name: details.name,
                    arguments: args
                }
            }

            if (firstCall.name === "module") {
                var config = {}
                if (firstCall.arguments.length !== 0) {
                    config = parseStructure(firstCall.arguments[0])
                }
                return {
                    type: "module",
                    filename: filename,
                    body: body,
                    name: details.name,
                    config: config
                }
            }
        }
    }

    return {
        type: "other",
        filename: filename,
        body: body,
        content: content
    }

}

function ensureIdentifier(node) {
    if (node.type !== "Identifier") {
        throw new Error("SON0011: expected identifier, got " + node.type + ". Line " + getLine(node))
    }

    return node.name
}

function processSingleFile(file) {
    prepareAst(file)
    ensureUniqueFunctions(file.body)    
    var machine = sectionBuilder()
    for (var i = 0; i < file.body.length; i++) {
        var expr = file.body[i]
        machine.nextExpression(expr)
    }
    machine.done()
    file.sections = machine.sections
    delete file.body
    ensureUniqueSections(file.sections)
    for (var section of file.sections) {
        section.tree = mergeScenarios(section.scenarios)        
    }
    var body = buildBodyFromSections(file.sections)
    var bigAst = makeFunction(file.name, file.arguments, body)
    if (file.hasAwait) {
        bigAst.async = true
    }
    var result = escodegen.generate(bigAst) + "\n"
    return result
}

function buildBodyFromSections(sections) {
    var body = []
    sections.forEach(section => appendSectionToBody(section, body))
    return body
}

function appendSectionToBody(section, body) {
    section.body.forEach(expr => body.push(expr))
    appendNodeToBody(section.tree, body)
}



function prepareAst(file) {
    var varContext = createVarContext()    
    file.body.forEach(expr => {extractVariables(expr, varContext.declarations)})
    file.body = file.body.map(expr => {return transformStatement(expr, varContext)})    
    prependVariables(file.body, varContext.variables)
    file.hasAwait = varContext.hasAwait
}

function extractVariables(expr, declarations) {    
    if (expr.type === "FunctionDeclaration") {
        expr.body.body.forEach(st => {collectDeclarations(st, declarations)})
    } else {
        collectDeclarations(expr, declarations)
    }
}

function transformStatement(expr, varContext) {
    if (expr.type === "FunctionDeclaration") {
        expr.body.body = expr.body.body.map(st => {return processAst(st, varContext)})
        return expr
    } else {
        return processAst(expr, varContext)
    }
}


function mergeScenarios(scenarios) {
    if (scenarios.length === 0) {
        return undefined
    }

    var root = convertToNodeList(scenarios[0])
    for (var i = 1; i < scenarios.length; i++) {
        var next = convertToNodeList(scenarios[i])
        mergeNodes(root, next)
    }

    return root
}

function mergeNodes(main, addition) {
    if (!main || !addition) {
        return
    }
    
    if (main.type !== addition.type || main.text !== addition.text) {
        throw new Error("SON0022: scenarios are not mutually exclusive. Line " + addition.line)
    }

    if (main.type === "rule") {
        if (main.condition === addition.condition) {
            mergeNodes(main.down, addition.down)
        } else {
            if (main.right) {
                mergeNodes(main.right, addition.down)
            } else {
                main.right = addition.down
            }
        }
    } else {
        mergeNodes(main.down, addition.down)
    }
}

function convertToNodeList(funcExpr) {

    var body = funcExpr.body.body
    if (body.length === 0) {
        return undefined
    }

    var head = convertExpressionToNode(body[0])
    var prev = head
    for (var i = 1; i < body.length; i++) {
        var next = convertExpressionToNode(body[i])
        prev.down = next
        prev = next
    }



    return head
}

function appendNodeToBody(node, body) {
    var upper, lower
    if (!node) { return }
    if (node.type === "rule") {
        if (node.condition === "yes") {
            upper = node.down
            lower = node.right
        }
        else {
            upper = node.right
            lower = node.down            
        }
        var ifStatement = makeIfStatement(node.expression, upper, lower)
        body.push(ifStatement)
    } else {
        body.push(node.expression)
        appendNodeToBody(node.down, body)
    }    
}

function makeIfStatement(condition, upper, lower) {
    var ifStatement  = {
        type: "IfStatement",
        test: condition,
        consequent: {
          type: "BlockStatement",
          body: []
        },
        alternate: null
    }
    appendNodeToBody(upper, ifStatement.consequent.body)
    if (lower) {
        var alternate = {
            type: "BlockStatement",
            body: []
        }
        appendNodeToBody(lower, alternate.body)
        ifStatement.alternate = alternate
    }
    return ifStatement
}

function printList(node, depth) {
    depth = depth || 0
    if (!node) { return }
    var indent = ' '.repeat(depth * 4)
    if (node.type === "rule") {
        console.log(indent, "if", node.text)
        if (node.condition === "yes") {
            printList(node.down, depth + 1)
            if (node.right) {
                console.log(indent, "else")
                printList(node.right, depth + 1)
            }
            console.log(indent, "end")
        } else {
            printList(node.right, depth + 1)
            if (node.down) {
                console.log(indent, "else")
                printList(node.down, depth + 1)
            }
            console.log(indent, "end")
        }           
    } else {
        console.log(indent, node.text)
        printList(node.down, depth)
    }
}

function convertExpressionToNode(expression) {
    var call = getCall(expression)
    if (call && (call.name === "yes" || call.name === "no")) {
        if (call.arguments.length !== 1) {
            throw new Error("yes/no must have exactly one argument. Line " + call.line)
        }
        var expr = call.arguments[0]
        return {
            type: "rule",
            condition: call.name,
            line: call.line,
            expression: expr,
            text: escodegen.generate(expr)
        }
    }

    return {
        type: "action",
        line: getLine(expression),
        expression: expression,
        text: escodegen.generate(expression)
    }
}

function ensureUniqueFunctions(body) {
    var values = {}
    for (var expr of body) {
        if (expr.type === "FunctionDeclaration" && expr.id.type === "Identifier") {
            var name = expr.id.name
            if (name in values) {
                throw new Error("SON0021: function name not unique: " + name + ". Line " + getLine(expr))
            }
            values[name] = true
        }
    }
}

function ensureUniqueSections(sections) {
    var values = {}
    for (var section of sections) {
        if (section.name in values) {
            throw new Error("SON0020: section name not unique: " + section.name + ". Line " + section.line)
        }
        values[section.name] = true
    }
}


function sonCore() {
    var unit = {}
    unit.inject = function (path_, fs_, prosess_, esprima_, escodegen_, config_) {
        path = path_
        fs = fs_
        process = prosess_
        esprima = esprima_
        escodegen = escodegen_
        config = config_
    }

    unit.main = main
    return unit
}

function areUnique(items) {
    var values = {}
    for (var item of items) {
        if (item in values) {
            return false
        }
        values[item] = true
    }
    return true
}

async function handleModule(moduleFile, output) {
    var folder = path.dirname(moduleFile.filename)
    console.log(moduleFile.name, moduleFile.config, moduleFile.filename, folder)
    var filenames = await fs.readdir(folder)
    var varContext = createVarContext()
    console.log(filenames)
}

module.exports = sonCore