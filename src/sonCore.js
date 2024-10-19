const { collectDeclarations, processAst, prependVariables, makeFunction,
    makeFunctionCall, makeAssign,
    parseStructure, createReturnObject, makeId, createVariableDeclaration,
    decorateComputeAll, makeReturn } = require("./ast")
const { getCall, getLine, addToSet, topologicaSort } = require("./common")
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

    var dir = await isDirectory(input)
    if (dir) {
        log("Directory mode: " + input)
        await handleDirectory(input, output)
    } else {
        await handleSingleFile(input, output)
    }
}

async function handleSingleFile(input, output) {
    var feedFile
    try {
        if (input.endsWith(".son")) {
            feedFile = await readSonFile(input)
        } else {
            feedFile = await readJsFile(input)
        }
    } catch (ex) {
        ex.filename = input
        throw ex
    }

    if (feedFile.type === "function") {
        log("Single function mode: " + input)
        await handleFunction(feedFile, output)
    } else if (feedFile.type === "module") {
        log("Module mode: " + input)
        feedFile.format = config.format
        await handleModule(feedFile, output)
    } else {
        var error = new Error("SON0006: File type not supported: " + input)
        error.filename = input
        throw error
    }
}

function createVarContext() {
    return {
        variables: {},
        declarations: {},
        fields: {},
        deps: {},
        algos: {},
        computes: {}
    }
}

function createVarContextFromModule(moduleContext) {
    var result = {
        variables: {},
        declarations: {},
        fields: {},
        deps: {},
        algos: moduleContext.algos,
        computes: moduleContext.computes
    }

    Object.assign(result.declarations, moduleContext.declarations)
    Object.assign(result.declarations, moduleContext.variables)
    return result
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
            if (firstCall.name === "fun" || firstCall.name === "pfun") {
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
            if (firstCall.name === "prop") {
                if (firstCall.arguments.length !== 0) {
                    throw new Error("SON0030: a property cannot have arguments. Line " + firstCall.line)
                }
                body.shift()
                return {
                    type: "property",
                    filename: filename,
                    body: body,
                    name: details.name,
                    arguments: []
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

async function readSonFile(filename) {
    var details = path.parse(filename)
    var content, parsed
    try {
        content = await readFile(filename)
    } catch (ex) {
        throw new Error("SON0005: could not read source file: " + ex.message)
    }
    try {
        parsed = esprima.parseModule(content, { loc: true })
    } catch (ex) {
        throw new Error("SON0010: error parsing source file: " + ex.message)
    }

    var body = parsed.body
    var before = []
    var after = []
    var mod = undefined
    for (var expr of body) {
        var call = getCall(expr)
        if (call && call.name === "module") {
            var args = []
            var configuration = extractConfig(call.arguments, args)
            mod = {
                type: "module",
                filename: filename,
                body: body,
                name: details.name,
                arguments: args,
                config: configuration
            }
        } else if (mod) {
            after.push(expr)
        } else {
            before.push(expr)
        }
    }
    if (!mod) {
        throw new Error("SON0028: a module file must have a module() statement")
    }
    mod.body = after
    mod.before = before
    return mod
}


function extractConfig(input, output) {
    var configuration = undefined
    var names = {}
    for (var arg of input) {
        if (arg.type === "Identifier") {
            var name = arg.name
            if (name in names) {
                throw new Error("SON0022: argument name is not unique: " + name + ". Line " + getLine(arg))
            }
            names[name] = true
            output.push(name)
        } else if (arg.type === "ObjectExpression") {
            if (configuration) {
                throw new Error("SON0026: only one config object is allowed in a module. Line " + getLine(arg))
            }
            configuration = parseStructure(arg)
        } else {
            throw new Error("SON0011: expected identifier or config, got " + arg.type + ". Line " + getLine(arg))
        }
    }
    return configuration || {}
}

function ensureIdentifier(node) {
    if (node.type !== "Identifier") {
        throw new Error("SON0011: expected identifier, got " + node.type + ". Line " + getLine(node))
    }

    return node.name
}

async function handleFunction(file, output) {
    try {
        file.varContext = createVarContext()
        var bigAst = generateFunction(file)
        var generated = escodegen.generate(bigAst) + "\n"
        var filename = path.join(output, file.name + ".js")
        await writeFile(filename, generated)
    } catch (ex) {
        ex.filename = file.filename
        throw ex
    }
}

function generateFunctionWrapped(file) {    
    try {
        file.ast = generateFunction(file)
    } catch (ex) {
        ex.filename = file.filename
        throw ex
    }
}

function generateFunction(file) {
    var varContext = file.varContext
    prepareAst(file, varContext)
    var machine = sectionBuilder()
    for (var i = 0; i < file.body.length; i++) {
        var expr = file.body[i]
        machine.nextExpression(expr)
    }
    machine.done()
    file.sections = machine.sections
    delete file.body
    ensureUniqueSections(file.sections)
    ensureUniquePlots(file.sections)
    for (var section of file.sections) {
        section.tree = mergeScenarios(section.plots)
    }
    var body = buildBodyFromSections(file.sections)
    var name = file.name
    if (file.type === "property") {
        name = decorateProperty(name)
    }    
    var bigAst = makeFunction(name, file.arguments, body)
    if (file.hasAwait) {
        bigAst.async = true
    }
    return bigAst
}

function decorateProperty(name) {
    return "__compute_" + name
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



function prepareAst(file, varContext) {
    addToSet(file.arguments, varContext.declarations)
    file.body.forEach(expr => { extractVariables(expr, varContext.declarations) })
    file.body = file.body.map(expr => { return transformStatement(expr, varContext) })
    prependVariables(file.body, varContext.variables)
    file.hasAwait = varContext.hasAwait
    file.deps = varContext.deps    
}

function collectDeclarationsFromBody(body, declarations) {
    body.forEach(st => { collectDeclarations(st, declarations) })
}

function processAstInBody(body, varContext) {
    return body.map(st => { return processAst(st, varContext) })
}

function extractVariables(expr, declarations) {
    if (expr.type === "FunctionDeclaration") {
        collectDeclarationsFromBody(expr.body.body, declarations)
    } else {
        collectDeclarations(expr, declarations)
    }
}



function transformStatement(expr, varContext) {
    if (expr.type === "FunctionDeclaration") {
        expr.body.body = processAstInBody(expr.body.body, varContext)
        return expr
    } else {
        return processAst(expr, varContext)
    }
}


function mergeScenarios(plots) {
    if (plots.length === 0) {
        return undefined
    }

    var root = convertToNodeList(plots[0])
    for (var i = 1; i < plots.length; i++) {
        var next = convertToNodeList(plots[i])
        mergeNodes(root, next)
    }

    return root
}

function mergeNodes(main, addition) {
    if (!main || !addition) {
        return
    }

    if (main.type !== addition.type || main.text !== addition.text) {
        throw new Error("SON0022: plots are not mutually exclusive. Line " + addition.line)
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

function convertToNodeList(plot) {

    var body = plot.body
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
    var ifStatement = {
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

function ensureUniquePlots(sections) {
    var values = {}
    for (var section of sections) {
        for (var plot of section.plots) {
            if (plot.name in values) {
                throw new Error("SON0021: plot name is not unique: " + plot.name + ". Line " + plot.line)
            }
            values[plot.name] = true
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

async function getFiles(folder, moduleFile, jsFiles, folders) {
    var norm = path.normalize(moduleFile.filename)
    var filenames = await fs.readdir(folder)
    for (var filename of filenames) {
        var full = path.normalize(path.join(folder, filename))
        if (full === norm) { continue }
        var dir = await isDirectory(full)
        if (filename.endsWith(".son")) {
            throw new Error("SON0027: unexpected .son file in a module subfolder: " + full)
        }
        if (filename.endsWith(".js")) {
            jsFiles[full] = true
        } else if (dir) {
            folders[full] = true
        }
    }
}

async function scanFolderForSon(folder, sonFiles, folders) {
    var filenames = await fs.readdir(folder)
    for (var filename of filenames) {
        var full = path.normalize(path.join(folder, filename))
        var dir = await isDirectory(full)
        if (dir) {
            folders.push(full)
        } else if (filename.endsWith(".son")) {
            sonFiles.push(full)
            if (sonFiles.length > 1) {
                throw new Error("SON0029: several .son files in a folder: " + full)
            }
        }
    }
}


async function isDirectory(filename) {
    var stats = await fs.stat(filename)
    return stats.isDirectory()
}

async function scanModuleFolder(moduleFile, folder, varContext) {
    var jsFiles = {}
    var folders = {}
    await getFiles(folder, moduleFile, jsFiles, folders)

    for (var filename in jsFiles) {
        await addFileToModule(moduleFile, filename, varContext)
    }

    for (var foldername in folders) {
        await scanModuleFolder(moduleFile, foldername, varContext)
    }
}

async function addFileToModule(moduleFile, filename, varContext) {
    try {
        log("Adding file " + filename)
        var file = await readJsFile(filename)
        file.varContext = createVarContextFromModule(varContext)
        if (file.type === "function") {
            file.varContext.prop = false
            moduleFile.functions.push(file)
            addToAlgos(moduleFile, file)
        } else if (file.type === "property") {
            file.varContext.prop = true
            moduleFile.properties.push(file)
            addToAlgos(moduleFile, file)
        } else if (file.type === "other") {
            moduleFile.others.push(file)
        }
    } catch (ex) {
        ex.filename = filename
        throw ex
    }
}

function addToAlgos(moduleFile, file) {
    if (file.name in moduleFile.algos) {
        throw new Error("SON0031: function name is not unique: " + file.name)
    }
    moduleFile.algos[file.name] = file
}

function checkConfig(moduleFile) {
    var moduleType = moduleFile.config.type || "functions"
    if (moduleType !== "functions" && moduleType !== "object") {
        throw new Error("SON0025: Unsupported module type: " + moduleType + ". Allowed values: functions, object")
    }
    moduleFile.moduleType = moduleType
}

function addHeader(moduleFile, blocks) {
    if (moduleFile.format === "es" || moduleFile.format === "commonjs") {
        if (moduleFile.before.length > 0) {
            pushExpressions(moduleFile.before, blocks)
            blocks.push("")
        }
    }
    if (moduleFile.moduleType === "object") {
        var args = moduleFile.arguments.join(", ")
        var fun = "function " + moduleFile.name + "(" + args + ") {"
        if (moduleFile.format === "es") {
            fun = "export " + fun
        }
        blocks.push(fun)
        blocks.push("")
    }
    pushExpressions(moduleFile.body, blocks)
}

function pushExpressions(body, blocks) {
    body.forEach(expr => {
        blocks.push(escodegen.generate(expr))
    })
}

function addFooter(moduleFile, blocks) {
    if (moduleFile.moduleType === "object") {
        var ast = makeReturn(generateExportedObject(moduleFile))
        var content = escodegen.generate(ast)
        blocks.push(content)
        blocks.push("}")
        if (moduleFile.format === "commonjs") {
            blocks.push(escodegen.generate(generateModuleExport(makeId(moduleFile.name))) + ";")
        }
    } else {
        if (moduleFile.format === "commonjs") {
            blocks.push(escodegen.generate(generateModuleExport(generateExportedObject(moduleFile))) + ";")
        }
    }
    blocks.push("")
}

function generateModuleExport(exports) {
    return {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
                "type": "Identifier",
                "name": "module"
            },
            "property": {
                "type": "Identifier",
                "name": "exports"
            }
        },
        "right": exports
    }
}

function generateExportedObject(moduleFile) {
    var lines = moduleFile.functions
        .filter(fun => {return !fun.private})
        .map(fun => { return fun.name })
    return createReturnObject(lines)
}

function addOtherBlock(other, blocks) {
    blocks.push(other.content)
    blocks.push("")
}

function addFunctionBlock(moduleFile, fun, blocks) {
    var content = escodegen.generate(fun.ast) + "\n"
    if (moduleFile.format === "es" && !fun.private && moduleFile.moduleType === "functions") {
        content = "export " + content
    }
    blocks.push(content)
}

async function saveModuleSource(moduleFile, content, output) {
    var ext = ".js"
    if (moduleFile.format === "es") {
        ext = ".mjs"
    }

    var filename = path.join(output, moduleFile.name + ext)
    await writeFile(filename, content)
}

function addPropertyVariables(moduleFile, blocks) {
    var names = moduleFile.properties.map(prop => prop.name)
    if (names.length !== 0) {
        var declare = createVariableDeclaration(names)
        var src = escodegen.generate(declare)
        blocks.push(src)
    }
}

function generateInvokeCalculate(name) {
    return makeAssign(
        makeId(name),
        makeFunctionCall(makeId(decorateProperty(name)), [])
    )
}

function generateCompute(moduleFile, name) {    
    var prop = moduleFile.algos[name]
    var sortedDeps = getAllDeps(moduleFile, prop)
    var deps = sortedDeps.map(generateInvokeCalculate)
    var fun = {
        ast:makeFunction(decorateComputeAll(name), [], deps),
        private:true
    } 
    moduleFile.functions.push(fun)
}

function getAllDeps(moduleFile, prop) {
    var start = prop.name
    var getAdjacentNodes = key => {
        var current = moduleFile.algos[key]
        return Object.keys(current.deps)
    }
    var reportError = (key, message) => {
        var current = moduleFile.algos[key]
        throw new Error("SON0035: detected a cycle in property dependencies: " + message + ". File " + current.filename)
    }
    var deps = topologicaSort(start, getAdjacentNodes, reportError)
    return deps.filter(dep => { return moduleFile.algos[dep].type === "property"})
}

async function handleModule(moduleFile, output) {
    try {
        moduleFile.functions = []
        moduleFile.properties = []
        moduleFile.others = []
        moduleFile.algos = {}
        moduleFile.computes = {}

        checkConfig(moduleFile)
        moduleFile.fullPath = path.normalize(moduleFile.filename)
        var varContext = createVarContext()
        varContext.algos = moduleFile.algos        
        varContext.computes = moduleFile.computes        
        addToSet(moduleFile.arguments, varContext.declarations)
        collectDeclarationsFromBody(moduleFile.body, varContext.declarations)
        moduleFile.body = processAstInBody(moduleFile.body, varContext)
        prependVariables(moduleFile.body, varContext.variables)

        var folder = path.dirname(moduleFile.filename)
    } catch (ex) {
        ex.filename = moduleFile.filename
        throw ex
    }
    await scanModuleFolder(moduleFile, folder, varContext)        
    moduleFile.functions.forEach(generateFunctionWrapped)
    moduleFile.properties.forEach(generateFunctionWrapped)    
    for (var name in moduleFile.computes) {
        generateCompute(moduleFile, name)
    }

    var blocks = []
    addHeader(moduleFile, blocks)
    addPropertyVariables(moduleFile, blocks)    
    moduleFile.others.forEach(other => addOtherBlock(other, blocks))
    moduleFile.functions.forEach(fun => addFunctionBlock(moduleFile, fun, blocks))
    moduleFile.properties.forEach(prop => addFunctionBlock(moduleFile, prop, blocks))
    addFooter(moduleFile, blocks)

    var content = blocks.join("\n")
    await saveModuleSource(moduleFile, content, output)
}

async function handleDirectory(folder, output) {
    log("Scanning folder " + folder)
    var sonFiles = []
    var folders = []
    await scanFolderForSon(folder, sonFiles, folders)
    if (sonFiles.length > 0) {
        await handleSingleFile(sonFiles[0], output)
    } else {
        for (var subfolder of folders) {
            await handleDirectory(subfolder, output)
        }
    }
}

module.exports = sonCore