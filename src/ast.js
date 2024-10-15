
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

function collectDeclarations(node, declarations) {
    if (isFunction(node)) {
        declarations = {};
    } else if (node.type === 'VariableDeclaration') {
        node.declarations.forEach(decl => {
            declarations[decl.id.name] = true;
        });
    }
    for (var key in node) {                
        var value = node[key];                        
        if (Array.isArray(value)) {
            value.forEach(element => {
                collectDeclarations(element, declarations);
            });                   
        } else if (typeof value === 'object' && value) { 
            collectDeclarations(value, declarations);
        }
    }
    if (isFunction(node)) {
        node.declarations = declarations;
    }    
}

function cloneContextForFunction(node, old) {
    var context;
    context = {
        variables: {},
        declarations: {},
        fields: old.fields
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
    if (type === 'Identifier') {
        var name = node.name;
        if (name in context.fields) {
            return addSelf(node);            
        } else {
            return node;
        }
    }    

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

    if (type === "AwaitExpression") {
        context.hasAwait = true
        return cloneAst(node, context)    
    }

    if (type === 'AssignmentExpression') {
        if (node.left.type === 'Identifier') {
            var name = node.left.name;
            if (!(name in context.declarations) && !(name in context.fields)) {
                context.variables[name] = true;
            }
        }
        return cloneAst(node, context)
    }    

    if (type === 'IfStatement' 
    || type === 'ForOfStatement'
    || type === 'ForInStatement'
    || type === 'ForStatement'
    || type === 'SwitchStatement') {
        line = getLine(node);
        throw new Error(node.type + ' is not allowed in Son. Line: ' + line);
    }

    return cloneAst(node, context)
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

function prependVariables(body, variables) {
    var declare = {
        type: "VariableDeclaration",
        kind: "var",
        declarations: [],
        loc: {
            start: {line:1}
        }
    }
    
    for (var variable in variables) {                
        declare.declarations.push({
            type: "VariableDeclarator",
            id: makeId(variable),
            init: null
        })
    }
    if (declare.declarations.length > 0) {
        body.unshift(declare)
    }
}

module.exports = {
    collectDeclarations,
    processAst,
    prependVariables,
    makeFunction
}
