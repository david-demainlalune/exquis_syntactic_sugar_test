var main = function(){

    var editor,
        canvas = document.getElementById("myCanvas"),
        ctx = canvas.getContext("2d"),
        errorsTextField = document.getElementById("errors"),
        currentParseObject = null,
        animObj = null;

    var buildEditor = function(id){
        var result = ace.edit(id);
      
        result.getSession().setMode("ace/mode/javascript");
        result.setFontSize("16px");
        return result;
    }

    var updateAnimObj = function(newParseObj){
        //the abomination
        var transformedStr = parseExquis.buildTransformedString(newParseObj);

        try{
            eval("var makeAnim = " + transformedStr);
        }catch (e){
            errorsTextField.innerHTML = e.message;
            return;
        }

        try{
            testAnimObj = makeAnim(ctx);
        }catch (e){
            errorsTextField.innerHTML = e.message;
            return;
        }

        try{
            testAnimObj.draw();
        }catch(e){
            errorsTextField.innerHTML = e.message;
            return;
        }

        animObj = testAnimObj;

        if (parseExquis.isSetupExecutionNecessary(currentParseObject, newParseObj)){
            runSetup();
        }

        currentParseObject = newParseObj;
    }

    var resetMatrices = function(){
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    var runSetup = function(){
        if (animObj != null){
            console.log("run setup");
            resetMatrices();
            animObj.setup();
        }
    }

    var handleNewParseObject = function(newParseObj){

        if (parseExquis.isFullCodeIdentical(currentParseObject, newParseObj)){
            return;
        }

        updateAnimObj(newParseObj);
    }

    var generalizeRequestAnimation = function(){
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                       window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    }

    var onEditorChange = function(e){
        var parseObj = parseExquis.stringToParseObject(editor.getValue());
        if (parseObj.error !=null){
            errorsTextField.innerHTML = parseObj.error.message;
            return;
        }

        errorsTextField.innerHTML = "";
        handleNewParseObject(parseObj);
    }

    var render = function(timestamp){
        if (animObj != null){
            resetMatrices();
            animObj.draw();
        }

        requestAnimationFrame(render);
    }

    editor = buildEditor("editor");
    editor.getSession().on('change', onEditorChange);

    generalizeRequestAnimation();
    requestAnimationFrame(render);
}


window.onload = main;