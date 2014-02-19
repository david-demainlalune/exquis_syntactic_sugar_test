var main = function(){

  var editor,
    canvas = document.getElementById("myCanvas"),
    ctx = canvas.getContext("2d"),
    errorsTextField = document.getElementById("errors"),
    currentParseObject = null,
    animObj = null,
    listeners = [],
    input;


  var getMousePos = function(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  var buildInput = function(canvas){

    var mousePosition = {x:null, y: null},
        mouseDown = false,
        mouseDownEvent = false,
        mouseUpEvent = false;

    var result = {
      getMousePosition: function(){ return mousePosition; },
      getMouseButtonDown: function(){
        if (mouseDownEvent){
          mouseDownEvent = false;
          return true;
        }
        return false;
      },
      getMouseButtonUp: function(){

        if (mouseUpEvent){
          mouseUpEvent = false;
          return true;
        }
        return false;
      },
      getMouseButton: function(){
        return mouseDown;
      }
    }

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
  }





  var addListeners = function(animObj, canvas, listeners){

    if(animObj.mouseMove != null){

      var listener = function(evt) {
        var mousePos = getMousePos(canvas, evt);
        console.log(mousePos);
        animObj.mouseMove(mousePos);
      };
      canvas.addEventListener('mousemove', listener);

      listeners.push({type:'mousemove', func: listener})
    }
  }


  var removeListeners = function(canvas, listeners){
    listeners.forEach(function (listenerDescription){
      canvas.removeEventListener(listenerDescription.type, listenerDescription.func);
    });

    listeners.length = 0; // http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
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

    if (testAnimObj.draw != null){
      try {
        testAnimObj.draw();
      } catch(e){
        errorsTextField.innerHTML = e.message;
        return;
      }
    }

    removeListeners(canvas, listeners);

    animObj = testAnimObj;
    animObj.input = input;

    addListeners(animObj, canvas, listeners);

    currentParseObject = newParseObj;
  }

  var resetMatrices = function(){
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    if (animObj != null && animObj.draw != null){
      resetMatrices();
      try{
        animObj.draw();
      }catch(e){
        errorsTextField.innerHTML = e.message;
      } 
    }
    requestAnimationFrame(render);
  }


  input = buildInput(canvas);
  editor = buildEditor("editor");
  editor.getSession().on('change', onEditorChange);

  generalizeRequestAnimation();
  requestAnimationFrame(render);
}


window.onload = main;