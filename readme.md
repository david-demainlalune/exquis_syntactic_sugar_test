# exquis syntactic sugar test

Side project for the [exquis](https://github.com/gongfuio/Exquis) live coding environment, which explores the possibility of simplifying the user syntax. 

## idea
Transform user syntax of type:
      // any setup code      
      var i = 0;

      // called repeatedly 
      function draw(){
        ctx.fillRect(i, i, 10, 10);
      }


Into an internal clojure representation for live evaling:

      function(ctx){
        var i = 0;

        return{
          draw: function draw(){
            ctx.fillRect(i, i, 10, 10);
          }
        }
      }

this test uses the javascript ast parser [esprima](http://esprima.org/) to find the function declarations and prepare the clojure private body, [escodegen](https://github.com/Constellation/escodegen) to regenerate code from the asts, and the [ace editor](http://ace.c9.io/#nav=about) for code edition.

## installation

run from any http server, for instance with python:

    python -m SimpleHTTPServer
    open browser at http://localhost:8000/

## usage

write live evalled code for the canvas element at the top of the page. The canvas' 2d context is accessed through ctx. Example:

    function setup(){
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 10, 10);
    }

    function draw(){

    }


there is also a input object

