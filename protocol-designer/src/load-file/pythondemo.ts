function transformAstToStruct(astNode: object) {
    // The Brython AST nodes are annoying because you have to peek into their prototypes to see
    // what the object class is. It's more convenient to have all the relevant properties in a
    // flat object. And we want to make it easier to use destructuring to extract things from
    // the AST.
    const nodeClassName = astNode.constructor.$name;
    const struct = {};
    struct[nodeClassName] = (() => {
        switch (astNode.constructor) {
            case $B.ast.Module: return {
                body: astNode.body.map(transformAstToStruct)
            }
            case $B.ast.FunctionDef: return {
                name: astNode.name,
                args: transformAstToStruct(astNode.args),
                body: astNode.body.map(transformAstToStruct),
            }
            case $B.ast.arguments: return {
                args: astNode.args.map(transformAstToStruct),
            }
            case $B.ast.arg: return {
                arg: astNode.arg,
            }
            case $B.ast.Assign: return {
                targets: astNode.targets.map(transformAstToStruct),
                value: transformAstToStruct(astNode.value),
            }
            case $B.ast.Expr: return {
                value: transformAstToStruct(astNode.value),
            }
            case $B.ast.Call: return {
                func: transformAstToStruct(astNode.func),
                args: astNode.args.map(transformAstToStruct),
            }
            case $B.ast.Attribute: return {
                value: transformAstToStruct(astNode.value),
                attr: astNode.attr,
            }
            case $B.ast.Dict: return {
                keys: astNode.keys.map(transformAstToStruct),
                values: astNode.values.map(transformAstToStruct),
            }
            case $B.ast.Name: return {
                id: astNode.id
            }
            case $B.ast.Constant: return {
                value: astNode.value
            }
        }
    })();
    return struct;
}

function prettyPrint(astNode: object) {
    return astNode.Expr && prettyPrint(astNode.Expr.value) ||
    astNode.Assign && `Set [${astNode.Assign.targets.map(prettyPrint).join(', ')}] := ${prettyPrint(astNode.Assign.value)}` ||
    astNode.Call && `Call ${prettyPrint(astNode.Call.func)}(${astNode.Call.args.map(prettyPrint).join(', ')})` ||
    astNode.Attribute && `{${prettyPrint(astNode.Attribute.value)}}.${astNode.Attribute.attr}` ||
    astNode.Name && `${astNode.Name.id}` ||
    astNode.Constant && `${astNode.Constant.value}`;
}

export function pythonProtoParserDemo(pythonCode: string, filename: string): void {
    // Use the Brython parser to parse the file.
    const parser = new $B.Parser(pythonCode, filename, 'file');
    const brythonAst = $B._PyPegen.run_parser(parser);
    console.log(brythonAst);
    const ast = transformAstToStruct(brythonAst);
    console.log(ast);

    // Let's verify that the Python protocol has a requirements section.
    const {Module: {body: moduleBody}} = ast;
    const requirementsNode = moduleBody.find((node) => {
        // The `requirements={...}` statement is an assignment, so look for an `Assign` node in the AST.
        // The assignment `target` is a list because Python allows multiple assignment (`a, b = 1, 2`).
        // So we're looking for an assignment whose `target` a single-element list ['requirements'].
        try {
            const {Assign: {targets: [{Name: {id: assignToName}}, ...moreTargets]}} = node;
            return !moreTargets.length && assignToName == 'requirements';
        } catch {
        }
    })
    console.log('requirements node:', requirementsNode);
    if (!requirementsNode) {
        throw new Error('requirements not found in Python file');
    }

    // Here's how we can extract settings from the parsed `requirements`:
    const {Assign: {value: {Dict: {keys: requirementsKeyNodes, values: requirementsValueNodes}}}} = requirementsNode;
    const requirementsKeys = requirementsKeyNodes.map((node) => {
        const {Constant: {value}} = node;
        return value;
    })
    const requirementsValues = requirementsValueNodes.map((node, idx) => {
        try {
            const {Constant: {value}} = node;
            return value;
        } catch {
            throw Error(`requirements dict value is not literal: '${requirementsKeys[idx]}' is a ${Object.keys(node)[0]}`);
        }
    })
    const requirementsDict = Object.fromEntries(requirementsKeys.map((key, idx) => [key, requirementsValues[idx]]));
    console.log(requirementsDict);

    // Let's find the run() function:
    const defRunNode = moduleBody.find((node) => {
        // The `def run(): ...` statement is FunctionDef node.
        try {
            const {FunctionDef: {name}} = node;
            return name == 'run';
        } catch {
        }
    });
    console.log('run() node:', defRunNode);
    if (!defRunNode) {
        throw new Error('def run() not found in Python file');
    }
    const {FunctionDef: {args: {arguments: {args: runArgsNodes}}, body: runBody}} = defRunNode;
    console.log(runArgsNodes, runBody);

    // See what they named the argument to the run() function:
    if (runArgsNodes.length != 1) {
        throw new Error(`def run() needs 1 argument but got ${runArgsNodes.length}`);
    }
    const {arg: {arg: runArgName}} = runArgsNodes[0];

    // Now we'll look inside the run() function body:
    console.log(`def run(${runArgName}) has ${runBody.length} statements`);
    const parsedRunFunc = runBody.map((node, idx) => {
        return `${idx+1}: ${prettyPrint(node)}`;
    });

    throw Error(`DEMO! Here's what I got from the Python file:\n\n` +
        `requirements = ${JSON.stringify(requirementsDict)}\n\n` +
        `EXTRACTED RUN(${runArgName}) FUNCTION: \n` +
        `${parsedRunFunc.join('\n')}`)
}
