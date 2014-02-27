var main = function(){

    var editor,
        canvas = document.getElementById("myCanvas"),
        ctx = canvas.getContext("2d"),
        errorsTextField = document.getElementById("errors"),
        currentParseObject = null,
        animObj = null,
        input,
        config;


    var getMousePos = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var buildInput = function(canvas){

        var mousePosition = {x:null, y: null},
            mouseDown = false,
            mouseDownEvent = false,
            mouseUpEvent = false;

        var result = {
            getMousePosition: function(){ return mousePosition; },
            getMouseButtonDown: function(){ return mouseDownEvent; },
            getMouseButtonUp: function(){ return mouseUpEvent; },
            getMouseButton: function(){ return mouseDown; },
            __postRenderCleanup: function(){
                //TODO this is hacky
                mouseDownEvent = false;
                mouseUpEvent = false;
            }
        };

        canvas.addEventListener('mousemove', function(e){
            mousePosition = getMousePos(canvas, e);
        });

        canvas.addEventListener('mousedown', function(e){
            mouseDown = true;
            mouseDownEvent = true;
        });

        document.documentElement.addEventListener('mouseup', function(e){
            if (mouseDown){
                mouseDown = false;
                mouseUpEvent = true; 
            }
        });

        return result;
    };

    var buildEditor = function(id){
        var result = ace.edit(id);
        result.getSession().setMode("ace/mode/javascript");
        result.setFontSize("16px");
        return result;
    };

    var buildConfig = function(editor){

        var makeChangeKeyboardHandlerFunc = function(keyboardHandler){
            return function(weWantIt){
                if (weWantIt){
                    editor.setKeyboardHandler(keyboardHandler);
                }else{
                    editor.setKeyboardHandler();
                } 
            };
        };

        return {
            vi: makeChangeKeyboardHandlerFunc("ace/keyboard/vim"),
            emacs: makeChangeKeyboardHandlerFunc("ace/keyboard/emacs")
        };
    };


    var updateAnimObj = function(newParseObj){
        //the abomination
        var functionBody = parseExquis.buildFunctionBodyString(newParseObj),
            makeAnim;

        try{
            makeAnim = new Function("ctx", "input", "config", functionBody);
        }catch (e){
            errorsTextField.innerHTML = e.message;
            return;
        }

        try{
            testAnimObj = makeAnim(ctx, input, config);
        }catch (e){
            errorsTextField.innerHTML = e.message;
            return;
        }

        if (testAnimObj.draw != null){
            try {
                testAnimObj.draw();
            } catch(e){
                errorsTextField.innerHTML = e.message;
                return;
            }
        }

        animObj = testAnimObj;

        currentParseObject = newParseObj;
    };

    var resetMatrices = function(){
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    var handleNewParseObject = function(newParseObj){

        if (parseExquis.isFullCodeIdentical(currentParseObject, newParseObj)){
            return;
        }

        updateAnimObj(newParseObj);
    };

    var generalizeRequestAnimation = function(){
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    };

    var onEditorChange = function(e){
        var parseObj = parseExquis.stringToParseObject(editor.getValue());

        if (parseObj.error != null){
            errorsTextField.innerHTML = parseObj.error.message;
            return;
        }

        errorsTextField.innerHTML = "";
        handleNewParseObject(parseObj);
    };

    var render = function(timestamp){
        if (animObj != null && animObj.draw != null){
            resetMatrices();
            try{
                animObj.draw();
            }catch(e){
                errorsTextField.innerHTML = e.message;
            } 
        }

        input.__postRenderCleanup();
        requestAnimationFrame(render);
    };


    input = buildInput(canvas);
    editor = buildEditor("editor");
    editor.getSession().on('change', onEditorChange);

    config = buildConfig(editor);

    generalizeRequestAnimation();
    requestAnimationFrame(render);
}


window.onload = main;