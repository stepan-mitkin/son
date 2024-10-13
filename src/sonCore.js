const { getCall, getLine } = require("./common")
const sectionBuilder = require("./sectionBuilder")
var path, fs, process, esprima, config

function log(message) {
    if (config.verbose) {
        console.log(message)
    }
}

async function main(input, output) {
    if (!output) {
        output = process.cwd()
    }

    var feedFile = await readJsFile(input)
    if (feedFile.type === "function") {
        log("Single function mode: " + input)
        await processSingleFile(feedFile, output)
    } else {
        throw new Error("SON0006: File type not supported: " + input)
    }
}

async function readFile(filename) {
    return await fs.readFile(filename, "utf-8")
}

async function readJsFile(filename) {
    try {
        var details = path.parse(filename)
        var content, parsed
        try {
            content = await readFile(filename)
        } catch (ex) {
            throw new Error("SON0005: could not read source file: " + ex.message)
        }
        try {
            parsed = esprima.parseScript(content, {loc:true})
        } catch (ex) {
            throw new Error("SON0010: error parsing source file: " + ex.message)
        }
        var body = parsed.body
        if (body.length !== 0) {
            var firstCall = getCall(body[0])
            if (firstCall && firstCall.name === "defineFunction") {
                return {
                    type: "function",
                    filename: filename,
                    body: body,
                    name: details.name,
                    arguments: firstCall.arguments.map(ensureIdentifier)
                }
            }
        }

        return {
            type: "other",
            filename: filename,
            body: body,
            content: content            
        }
    } catch (ex) {
        ex.filename = filename
        throw ex
    }
}

function ensureIdentifier(node) {
    if (node.type !== "Identifier") {        
        throw new Error("SON0011: expected identifier, got " + node.type + " at line " + getLine(node))
    }

    return node.name
}

async function processSingleFile(file, output) {    
    var machine = sectionBuilder()
    for (var i = 1; i < file.body.length; i++) {
        var expr = file.body[i]
        machine.nextExpression(expr)
    }
    machine.done()
    file.sections = machine.sections
    delete file.body
    console.log(file)
}

function sonCore() {
    var unit = {}
    unit.inject = function (path_, fs_, prosess_, esprima_, config_) {
        path = path_
        fs = fs_
        process = prosess_
        esprima = esprima_
        config = config_
    }

    unit.main = main
    return unit
}

module.exports = sonCore