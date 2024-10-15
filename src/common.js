function getCall(node) {
    if (node.type !== "ExpressionStatement") { return undefined }
    var expression = node.expression
    if (expression.type !== "CallExpression") { return undefined }
    var callee = expression.callee
    if (callee.type != "Identifier") { return undefined }
    var name = callee.name
    return {
        name: name,
        arguments: expression.arguments,
        line: getLine(expression)
    }
}

function getLine(node) {
    return node.loc.start.line
}

module.exports = {
    getCall,
    getLine
}