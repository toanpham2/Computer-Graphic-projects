/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // ellipsoids file loc

// const INPUT_TRIANGLES_URL = "triangles.json"; // triangles file loc
// const INPUT_ELLIPSOIDS_URL = "ellipsoids.json"; // ellipsoids file loc


var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexColorAttrib; // where to put color for vertex shader

/* webgl globals */
var gl2 = null; // the all powerful gl object. It's all here folks!
var vertexBuffer2; // this contains vertex coordinates in triples
var triangleBuffer2; // this contains indices into vertexBuffer in triples
var triBufferSize2 = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib2; // where to put position for vertex shader
var vertexColorAttrib2; // where to put color for vertex shader


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input json file

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// set up the webGL environment
function setupWebGL2() {

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

// read triangles in, load them into webgl buffers
function loadTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");

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
            triBufferSize += inputTriangles[whichSet].triangles.length; // total number of tris
        } // end for each triangle set 
        triBufferSize *= 3; // now total number of indices

        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer
        
        // send the vertex colors to webGL
        colorBuffer = gl.createBuffer(); // init empty vertex color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArr), gl.STATIC_DRAW); // colors to that buffer

        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer

    } // end if triangles found
} // end load triangles

function loadTrianglesP5() {
    var inputTriangles = inputTriangles =[
        {
          "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.6,0.4], "specular": [0.3,0.3,0.3], "n":11}, 
          "vertices": [[0.15, 0.55, 0.75],[0.25, 0.8, 0.75],[0.35,0.55,0.75]],
          "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1]],
          "triangles": [[0,1,2]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.6,0.4], "specular": [0.3,0.3,0.3], "n":11}, 
            "vertices": [[0.55, 0.55, 0.75],[0.65, 0.8, 0.75],[0.75,0.55,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.15, 0.35, 0.75],[0.15, 0.45, 0.75],[0.75,0.35,0.75],[0.75,0.45,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.15, 0.5, 0.75],[0.15, 0.55, 0.75],[0.75,0.5,0.75],[0.75,0.55,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
          "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.8,0.9], "specular": [0.3,0.3,0.3], "n":17}, 
          "vertices": [[0.15, 0.35, 0.75],[0.15, 0.55, 0.75],[0.35,0.55,0.75],[0.35,0.35,0.75]],
          "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
          "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.35, 0.35, 0.75],[0.35, 0.55, 0.75],[0.55,0.55,0.75],[0.55,0.35,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.6,0.8,0.9], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.55, 0.35, 0.75],[0.55, 0.55, 0.75],[0.75,0.55,0.75],[0.75,0.35,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.15, 0.15, 0.75],[0.15, 0.35, 0.75],[0.35,0.35,0.75],[0.35,0.15,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.35, 0.15, 0.75],[0.35, 0.35, 0.75],[0.55,0.35,0.75],[0.55,0.15,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
        {
            "material": {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.9,0.0], "specular": [0.3,0.3,0.3], "n":17}, 
            "vertices": [[0.55, 0.15, 0.75],[0.55, 0.35, 0.75],[0.75,0.35,0.75],[0.75,0.15,0.75]],
            "normals": [[0, 0, -1],[0, 0, -1],[0, 0, -1],[0, 0, -1]],
            "triangles": [[0,1,2],[2,3,0]]
        },
       
        
      ];

    if (inputTriangles != String.null) { 
        var whichSetVert2; // index of vertex in current triangle set
        var whichSetTri2; // index of triangle in current triangle set
        var coordArray2 = []; // 1D array of vertex coords for WebGL
        var indexArray2 = []; // 1D array of vertex indices for WebGL
        var vtxBufferSize2 = 0; // the number of vertices in the vertex buffer
        var vtxToAdd2 = []; // vtx coords to add to the coord array
        var indexOffset2 = vec3.create(); // the index offset for the current set
        var triToAdd2 = vec3.create(); // tri indices to add to the index array
        var color2 = [];
        var colorArr2 = [];
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            vec3.set(indexOffset2,vtxBufferSize2,vtxBufferSize2,vtxBufferSize2); // update vertex offset
            
            // set up the vertex coord array
            for (whichSetVert2=0; whichSetVert2<inputTriangles[whichSet].vertices.length; whichSetVert2++) {
                vtxToAdd2 = inputTriangles[whichSet].vertices[whichSetVert2];
                color2 = inputTriangles[whichSet].material.diffuse;
                coordArray2.push(vtxToAdd2[0],vtxToAdd2[1],vtxToAdd2[2]);
                colorArr2.push(color2[0], color2[1], color2[2]);
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri2=0; whichSetTri2<inputTriangles[whichSet].triangles.length; whichSetTri2++) {
                vec3.add(triToAdd2,indexOffset2,inputTriangles[whichSet].triangles[whichSetTri2]);
                indexArray2.push(triToAdd2[0],triToAdd2[1],triToAdd2[2]);
            } // end for triangles in set

            vtxBufferSize2 += inputTriangles[whichSet].vertices.length; // total number of vertices
            triBufferSize2 += inputTriangles[whichSet].triangles.length; // total number of tris
        } // end for each triangle set 
        triBufferSize2 *= 3; // now total number of indices

        // send the vertex coords to webGL
        vertexBuffer2 = gl2.createBuffer(); // init empty vertex coord buffer
        gl2.bindBuffer(gl2.ARRAY_BUFFER,vertexBuffer2); // activate that buffer
        gl2.bufferData(gl2.ARRAY_BUFFER,new Float32Array(coordArray2),gl2.STATIC_DRAW); // coords to that buffer
        
        // send the vertex colors to webGL
        colorBuffer2 = gl2.createBuffer(); // init empty vertex color buffer
        gl2.bindBuffer(gl2.ARRAY_BUFFER, colorBuffer2); // activate that buffer
        gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(colorArr2), gl2.STATIC_DRAW); // colors to that buffer

        // send the triangle indices to webGL
        triangleBuffer2 = gl2.createBuffer(); // init empty triangle index buffer
        gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, triangleBuffer2); // activate that buffer
        gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray2),gl2.STATIC_DRAW); // indices to that buffer

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
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader, fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for GPU execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader, vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for GPU execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexColorAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexColor"); 
                gl.enableVertexAttribArray(vertexColorAttrib); // input to shader from array
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

function setupShaders2() {
    
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
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

     // color buffer: activate and feed into vertex shader
     gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); // activate
     gl.vertexAttribPointer(vertexColorAttrib, 3, gl.FLOAT, false, 0, 0); // feed

    // triangle buffer: activate and render
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer); // activate
    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render
} // end render triangles


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



/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  // event = keyup or keydown
  document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      console.log('Space pressed')
      setupWebGL2();
      loadTrianglesP5(); // load in the triangles from tri file
      setupShaders2();
      renderTriangles2(); // draw the triangles using webGL
    }
  })
  
} // end main
