/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
// const INPUT_TRIANGLES_URL = "https://pages.github.ncsu.edu/cgclass/exercise5/triangles.json"; // triangles file loc
// const INPUT_ELLIPSOIDS_URL = "https://pages.github.ncsu.edu/cgclass/exercise5/ellipsoids.json"; // ellipsoids file loc

const INPUT_TRIANGLES_URL = "triangles.json"; // triangles file loc
const INPUT_ELLIPSOIDS_URL = "ellipsoids.json"; // ellipsoids file loc


var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl2 = null; // the all powerful gl object. It's all here folks!
var vertexBuffer2; // this contains vertex coordinates in triples
var triangleBuffer2; // this contains indices into vertexBuffer in triples
var triBufferSize2 = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib2; // where to put position for vertex shader
var vertexColorAttrib2; // where to put color for vertex shader




// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl2 = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl2 == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl2.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl2.clearDepth(1.0); // use max when we clear the depth buffer
        gl2.enable(gl2.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL



function loadTrianglesP5() {
    var inputTriangles = inputTriangles =[
        {
          "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.4,0.4], "specular": [0.3,0.3,0.3], "n":11}, 
          "vertices": [[0.15, 0.6, 0.75],[0.25, 0.9, 0.75],[0.35,0.6,0.75]],
          "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1]],
          "triangles": [[0,1,2]]
        },
        {
          "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.6,0.4], "specular": [0.3,0.3,0.3], "n":17}, 
          "vertices": [[0.15, 0.15, 0.75],[0.15, 0.35, 0.75],[0.35,0.35,0.75],[0.35,0.15,0.75]],
          "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
          "triangles": [[0,1,2],[2,3,0]]
        }
      ];

    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = []; // 1D array of vertex indices for WebGL
        var vtxBufferSize = 0; // the number of vertices in the vertex buffer
        var vtxToAdd = []; // vtx coords to add to the coord array
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array
        var color = [];
        var colorArr = [];
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset
            
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++) {
                vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                color = inputTriangles[whichSet].material.diffuse;
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                colorArr.push(color[0], color[1], color[2]);
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            vtxBufferSize += inputTriangles[whichSet].vertices.length; // total number of vertices
            triBufferSize2 += inputTriangles[whichSet].triangles.length; // total number of tris
        } // end for each triangle set 
        triBufferSize2 *= 3; // now total number of indices

        // send the vertex coords to webGL
        vertexBuffer2 = gl2.createBuffer(); // init empty vertex coord buffer
        gl2.bindBuffer(gl2.ARRAY_BUFFER,vertexBuffer2); // activate that buffer
        gl2.bufferData(gl2.ARRAY_BUFFER,new Float32Array(coordArray),gl2.STATIC_DRAW); // coords to that buffer
        
        // send the vertex colors to webGL
        colorBuffer = gl2.createBuffer(); // init empty vertex color buffer
        gl2.bindBuffer(gl2.ARRAY_BUFFER, colorBuffer); // activate that buffer
        gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(colorArr), gl2.STATIC_DRAW); // colors to that buffer

        // send the triangle indices to webGL
        triangleBuffer2 = gl2.createBuffer(); // init empty triangle index buffer
        gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, triangleBuffer2); // activate that buffer
        gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl2.STATIC_DRAW); // indices to that buffer

    } // end if triangles found
} // end load triangles

function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragColor;
        void main(void) {
            gl_FragColor = vec4(fragColor, 1.0); // use the color passed from the vertex shader
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec3 vertexColor; // add vertex color attribute
        varying vec3 fragColor; // pass color to fragment shader
        void main(void) {
            gl_Position = vec4(vertexPosition, 1.0);
            fragColor = vertexColor; // pass the color to the fragment shader
        }
    `;

    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl2.createShader(gl2.FRAGMENT_SHADER); // create frag shader
        gl2.shaderSource(fShader, fShaderCode); // attach code to shader
        gl2.compileShader(fShader); // compile the code for GPU execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl2.createShader(gl2.VERTEX_SHADER); // create vertex shader
        gl2.shaderSource(vShader, vShaderCode); // attach code to shader
        gl2.compileShader(vShader); // compile the code for GPU execution
            
        if (!gl2.getShaderParameter(fShader, gl2.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl2.getShaderInfoLog(fShader);  
            gl2.deleteShader(fShader);
        } else if (!gl2.getShaderParameter(vShader, gl2.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl2.getShaderInfoLog(vShader);  
            gl2.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl2.createProgram(); // create the single shader program
            gl2.attachShader(shaderProgram, fShader); // put frag shader in program
            gl2.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl2.linkProgram(shaderProgram); // link program into gl context

            if (!gl2.getProgramParameter(shaderProgram, gl2.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl2.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl2.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib2 = // get pointer to vertex shader input
                    gl2.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl2.enableVertexAttribArray(vertexPositionAttrib2); // input to shader from array

                vertexColorAttrib2 = // get pointer to vertex shader input
                    gl2.getAttribLocation(shaderProgram, "vertexColor"); 
                gl2.enableVertexAttribArray(vertexColorAttrib2); // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders





// render the loaded model
function renderTriangles2() {
    gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    console.log("zero")
    // vertex buffer: activate and feed into vertex shader
    gl2.bindBuffer(gl2.ARRAY_BUFFER,vertexBuffer2); // activate
    gl2.vertexAttribPointer(vertexPositionAttrib2,3,gl2.FLOAT,false,0,0); // feed
    console.log("one")
     // color buffer: activate and feed into vertex shader
     gl2.bindBuffer(gl2.ARRAY_BUFFER, colorBuffer2); // activate
     gl2.vertexAttribPointer(vertexColorAttrib2, 3, gl2.FLOAT, false, 0, 0); // feed
     console.log("two")
    // triangle buffer: activate and render
    gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER,triangleBuffer2); // activate
    gl2.drawElements(gl2.TRIANGLES,triBufferSize2,gl2.UNSIGNED_SHORT,0); // render
    console.log("three")
} // end render triangles


