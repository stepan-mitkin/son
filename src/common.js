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

function addToSet(array, obj) {
    for (var item of array) {
        obj[item] = true
    }
}

function topologicaSort(start, getAdjacentNodes, reportError) {
    var context = {
        permanent: {},
        temporary: {},
        output: [],
        getAdjacentNodes: getAdjacentNodes,
        reportError: reportError
    }
    var crumbs = ""
    topologicaSortCore(context, start, crumbs)
    return context.output
}

function topologicaSortCore(context, key, crumbs) {
    if (crumbs) {
        crumbs = crumbs + " > " + key
    } else {
        crumbs = key
    }

    if (key in context.permanent) {
        return
    }    

    if (key in context.temporary) {
        context.reportError(key, crumbs)
        return
    }

    context.temporary[key] = true
    var nodes = context.getAdjacentNodes(key)
    nodes.forEach(node => topologicaSortCore(context, node, crumbs))
    context.permanent[key] = true
    context.output.push(key)
}

module.exports = {
    topologicaSort,
    addToSet,
    getCall,
    getLine
}