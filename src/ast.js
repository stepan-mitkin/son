var {shallowClone} = require("./common")

function isFunction(node) {
    var type = node.type
    if (type === 'FunctionDeclaration') { return true }
    if (type === 'FunctionExpression') { return true }
    if (type === 'ArrowFunctionExpression') { return true }
    return false
}

function addSelf(node) {
    var loc, loc2;
    loc = cloneAst(node.loc, {});
    loc2 = cloneAst(node.loc, {});
    return {
        type: 'MemberExpression',
        computed: false,
        object: {
            type: 'Identifier',
            name: 'self',
            loc: loc
        },
        property: node,
        loc: loc2
    };
}
function cloneAst(node, context) {
    var copy = {};
    for (var key in node) {
        var value = node[key];
        var value2
        if (Array.isArray(value)) {
            value2 = value.map(element => {
                return processAst(element, context);
            });
        } else if (typeof value === 'object' && value) {
            value2 = processAst(value, context);
        } else {
            value2 = value
        }
        copy[key] = value2;
    }
    return copy
}

function collectDeclarations(node, varContext) {    
    var type = node.type
    if (isFunction(node)) {
        varContext = shallowClone(varContext)
        varContext.declarations = {}
    } else if (node.type === 'VariableDeclaration') {
        node.declarations.forEach(decl => {
            varContext.declarations[decl.id.name] = true;
        });
    } else if (type === "AwaitExpression") {
        varContext.hasAwait = true
    } else if (type === 'Identifier') {
        var name = node.name;
        if (name in varContext.algos) {
            varContext.deps[name] = true
        }
    }

    for (var key in node) {
        var value = node[key];
        if (Array.isArray(value)) {
            value.forEach(element => {
                collectDeclarations(element, varContext);
            });
        } else if (typeof value === 'object' && value) {
            collectDeclarations(value, varContext);
        }
    }
    if (isFunction(node)) {
        node.declarations = varContext.declarations;
    }
}

function cloneContextForFunction(node, old) {
    var context;
    context = {
        variables: {},
        declarations: {},
        fields: old.fields,
        algos: old.algos,
        deps: old.deps,
        computes: old.computes,
        relax: old.relax
    };
    Object.assign(context.declarations, old.declarations);
    Object.assign(context.declarations, node.declarations);
    Object.assign(context.declarations, old.variables);
    return context;
}

function getLine(node) {
    return node.loc.start.line;
}

function processAst(node, context) {
    if (isFunction(node)) {
        var context2 = cloneContextForFunction(node, context);
        var result = cloneAst(node, context2);
        prependVariables(result.body.body, context2.variables);
        return result;
    }
    var type = node.type

    if (type === 'MemberExpression') {
        var property
        if (node.computed) {
            property = processAst(node.property, context);
        } else {
            property = node.property;
        }
        return {
            type: node.type,
            loc: node.loc,
            object: processAst(
                node.object,
                context
            ),
            property: property,
            computed: node.computed
        }
    }

    if (type === 'AssignmentExpression') {
        if (node.left.type === 'Identifier') {
            var name = node.left.name;
            if (name in context.algos) {
                throw new Error("SON0032: cannot set properties and functions in code: " + name + ". Line" + getLine(node))
            }
            if (!(name in context.declarations) && !(name in context.fields)) {
                context.variables[name] = true;
            }
        }
        return cloneAst(node, context)
    }

    if (type === "ForOfStatement" || type === "ForInStatement") {
        var left = node.left
        if (left.type === "Identifier") {
            context.variables[left.name] = true;
        }
    }
    
    if (!context.relax && (type === 'IfStatement'
        || type === 'SwitchStatement')) {
        line = getLine(node);
        throw new Error(node.type + ' is not allowed in Son. Line: ' + line);
    }

    if (type === "CallExpression") {
        var callee = node.callee
        if (callee.type === "Identifier" && callee.name === "compute") {
            return handleCompute(node, context)
        }
    }

    return cloneAst(node, context)
}

function handleCompute(expression, context) {
    var args = expression.arguments
    var computed = undefined
    if (args.length === 1) {
        var first = args[0]
        if (first.type === "Identifier") {
            computed = first.name
        }
    }
    if (!computed) {
        throw new Error("SON0033: compute() expects a property name as an argument. Line " + getLine(expression))
    }

    var algo = context.algos[computed]
    if (!algo || algo.type !== "property") {
        throw new Error("SON0034: compute() can be applied only to computed properties. Line " + getLine(expression))
    }

    context.computes[computed] = true
    var call = createSimpleCall(decorateComputeAll(computed), [])
    if (algo.hasAwaitInDep) {
        context.hasAwait = true
        return makeAwait(call)
    }
    return call
}


function createDummyLoc() {
    return {
        start: { line: 1 }
    }
}

function createSimpleCall(name, arguments) {
    return {
        type: "CallExpression",
        loc: createDummyLoc(),
        callee: makeId(name),
        arguments: arguments        
    }
}

function decorateComputeAll(name) {
    return "__computeAll_" + name
}

function makeId(name) {
    return {
        type: "Identifier",
        name: name
    }
}

function makeFunction(name, params, body) {
    return {
        type: "FunctionDeclaration",
        id: makeId(name),
        params: params.map(makeId),
        generator: false,
        expression: false,
        async: false,
        body: {
            type: "BlockStatement",
            body: body
        }
    }
}

function createVariableDeclaration(variables) {
    var declare = {
        type: "VariableDeclaration",
        kind: "var",
        declarations: [],
        loc: createDummyLoc()
    }

    for (var variable of variables) {
        declare.declarations.push({
            type: "VariableDeclarator",
            id: makeId(variable),
            init: null
        })
    }
    return declare
}

function prependVariables(body, variables) {
    var vars = Object.keys(variables)
    var declare = createVariableDeclaration(vars)
    if (declare.declarations.length > 0) {
        body.unshift(declare)
    }
}

function parseStructure(node) {
    if (node.type !== "ObjectExpression") {
        return undefined
    }
    var result = {}
    for (var property of node.properties) {
        var key = getPropertyKey(property)
        var value = getPropertyValue(property)
        result[key] = value
    }
    return result
}

function getPropertyValue(property) {
    if (property.value.type === "Literal") {
        return property.value.value
    }

    if (property.value.type === "ObjectExpression") {
        return parseStructure(property.value)
    }

    throw new Error("SON0025: unexpected value type: " + property.value.type + ". Line " + getLine(property))
}

function getPropertyKey(property) {
    if (property.key.type === "Identifier") {
        return property.key.name
    }

    if (property.key.type === "Literal") {
        return property.key.value
    }

    throw new Error("SON0024: unexpected property type: " + property.key.type + ". Line " + getLine(property))
}

function createReturnObject(items) {
    var result = {
        "type": "ObjectExpression",
        "properties": []
    }
    items.sort()
    for (var item of items) {
        var key = makeId(item)
        var value = makeId(item)
        result.properties.push({
            type: "Property",
            computed: false,
            key: key,
            value: value,
            kind: "init",
            method: false,
            shorthand: false
        })
    }
    return result
}

function makeReturn(argument) {
    return {
        type: "ReturnStatement",
        argument: argument
    }
}

function makeFunctionCall(callee, args) {
    return {
        "type": "CallExpression",
        "callee": callee,
        "arguments": args
    }
}

function makeAssign(left, right) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": left,
            "right": right
        }
    }
}

function makeAwait(expr) {
    return {
        type: "AwaitExpression",
        argument: expr
    }
}

module.exports = {
    collectDeclarations,
    processAst,
    prependVariables,
    makeFunction,
    parseStructure,
    makeReturn,
    createReturnObject,
    createVariableDeclaration,
    decorateComputeAll,    
    makeFunctionCall, makeAssign,
    makeAwait,
    makeId
}
