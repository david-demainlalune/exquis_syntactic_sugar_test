var parseExquis = (function(){

  ///////////////////////////
  //Private

  // Executes visitor on the object and its children (recursively).
  // cf esprime examples
  function traverse(object, visitor) {
    var key, child;

    visitor.call(null, object);
    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key];
        if (typeof child === 'object' && child !== null) {
          traverse(child, visitor);
        }
      }
    }
  }

  function nodeHasName(node, funcName){
    return node.id.name == funcName;
  }

  function extractRangeFromFuncDeclaration(node){
    return [node.range[0], node.body.range[1]];
  }

  function findFuncDeclaration(ast, funcName){
    var result = [];

    traverse(ast, function (node) {
      if (node.type === 'FunctionDeclaration' && nodeHasName(node, funcName)) {
        result.push(node);
      }
    });

    return result;
  }

  function buildError(type, message){
    return {
      type: type,
      message: message
    }
  }

  function parseAst(parseObject){
    var ast;
    try{
      ast = esprima.parse(parseObject.fullCodeString, { tolerant: false, loc: true, range: true}, 4);
    }catch (e){
      parseObject.error = buildError(errorTypes.AST, e.message);
      return parseObject;
    }

    parseObject.ast = ast;
    return parseObject;
  }

  function parseFuncDeclaration(parseObject, funcName){
    var nodeCandidates = findFuncDeclaration(parseObject.ast, funcName);

    if (nodeCandidates.length > 1){
      // error we only handle one func name funcName 
      parseObject.error = buildError(errorTypes.EXQUIS_SYNTAX, "we don't handle more than one " + funcName + " function definition");
      return parseObject;
    }

    if (nodeCandidates.length == 0){
      // do nothing no candidate found
      return parseObject;
    }

    // happy case one func found
    var node = nodeCandidates[0];
    var range = extractRangeFromFuncDeclaration(node);
    parseObject[funcName].node = node;
    parseObject[funcName].str = parseObject.fullCodeString.substring(range[0], range[1])

    return parseObject;
  }

  function parseDraw(parseObject){
    return parseFuncDeclaration(parseObject, "draw");
  }

  function parseMouseMove(parseObject){
    return parseFuncDeclaration(parseObject, "mouseMove");
  }

  function buildClosureBody(parseObject){
    var result = parseObject.fullCodeString;
    
    if (parseObject.draw.str != null)
      result = result.replace(parseObject.draw.str, "");

    if (parseObject.mouseMove.str != null)
      result = result.replace(parseObject.mouseMove.str, "");

    var parseOpt = {tolerant: false, loc: false, range: false}; // in the hopes of easier ast comparison
    parseObject.closureBodyAst = esprima.parse(result, parseOpt, 4);
    parseObject.closureBodyStr = escodegen.generate(parseObject.closureBodyAst);
    return parseObject;
  }


  ///////////////////
  // public

  function stringToParseObject(fullCodeString){
    var result = { error: null,
      fullCodeString: fullCodeString,
      ast: null,
      draw: {
        node: null,
        str: null
      },
      mouseMove: {
        node: null,
        str: null
      },
      closureBodyStr: null,
      closureBodyAst:null
    };

    var steps = [parseAst, parseDraw, parseMouseMove, buildClosureBody];

    for (var i = 0; i < steps.length; i++) {
      result = steps[i](result);
      if (result.error != null){
        return result;
      }
    }


    return result;
  }

  function buildTransformedString(parseObject){
    var result = "function(ctx){\n";
    result += "\t" + parseObject.closureBodyStr;

    result += "\n\treturn {\n";

    var returnObjectProperties = [];

    if (parseObject.draw.node != null){
      returnObjectProperties.push("\t\tdraw: " + parseObject.draw.str);
    }

    if (parseObject.mouseMove.node != null){
      returnObjectProperties.push("\t\tmouseMove: " + parseObject.mouseMove.str);
    }

    result += returnObjectProperties.join();

    result += "\t}\n}";
    return result;
  }

  function isFullCodeIdentical(parseA, parseB){

    if (parseA == null || parseB == null){
      return false;
    }
      
    return escodegen.generate(parseA.ast) == escodegen.generate(parseB.ast);
  }


  var errorTypes = {
    AST: "ast",
    EXQUIS_SYNTAX: "exquis_syntax"
  }


  return {
    stringToParseObject: stringToParseObject,
    buildTransformedString: buildTransformedString,
    isFullCodeIdentical: isFullCodeIdentical,
    errorTypes: errorTypes
  }
})();