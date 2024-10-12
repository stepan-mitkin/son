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
        throw new Error("File type not supported: " + input)
    }
}

async function readFile(filename) {
    return await fs.readFile(filename, "utf-8")
}

async function readJsFile(filename) {
    try {
        var details = path.parse(filename)
        var content = await readFile(filename)
        var parsed = esprima.parseScript(content, {loc:true})
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

function getCall(node) {
    if (node.type !== "ExpressionStatement") { return undefined }
    var expression = node.expression
    if (expression.type !== "CallExpression") { return undefined }
    var callee = expression.callee
    if (callee.type != "Identifier") { return undefined }
    var name = callee.name
    return {
        name: name,
        arguments: expression.arguments
    }
}

function ensureIdentifier(node) {
    if (node.type !== "Identifier") {        
        throw new Error("Expected identifier, got " + node.type + " at line " + node.loc.start.line)
    }

    return node.name
}

async function processSingleFile(feedFile, output) {
    console.log(feedFile)
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