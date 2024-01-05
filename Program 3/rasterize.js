/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_ELLIPSOIDS_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // ellipsoids file loc

// const INPUT_TRIANGLES_URL = "triangles.json"; // triangles file loc
// const INPUT_ELLIPSOIDS_URL = "ellipsoids.json"; // ellipsoids file loc

var Eye = new vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var Light = new vec3.fromValues(-0.5,1.5,-0.5);// default light position in world space

var lookUpVector = new vec3.fromValues(0.0,0.1,0.0);
var lookAtVector = new vec3.fromValues(0.0,0.0,1.0);
var Center = new vec3.fromValues(0.5,0.5,0.0);

var nearVal = 0.1;
var farVal = 100;
var currMod = 0.0;

var orthogonal = false;  
var objHighlight = false;

var transformM = mat4.create();
var cent = vec3.create();


/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var ambientBuffer; 
var diffuseBuffer; 
var specularBuffer; 
var normalBuffer; 
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer

var vertexPositionAttrib; 
var vertexDiffAttrib; 
var vertexAmbAttrib; 
var vertexSpecAttrib; 
var vertexNormalAttrib; 

var altPositionUniform;
var eyeUni; 
var lightUni; 

var transformBuffer;
var transformArray;
var transformSetAttribute;
var transformSetUniform;
var vertexSetAttrib;// saves the traingle set number for each vertex
var currModelUniform;
var setBuffer;


var inputTriangles;
var canvas;
var transformUni, transformM; 
var viewUni, viewM; 
var projUni, projM; 
var triCen;


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
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
        //handle clicks
        document.onkeydown = handleDownKey;
        document.onkeyup = handleUpKey;
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL


var allPressedKeys = {};
function handleDownKey(event){

	allPressedKeys[event.keyCode] = true;
    traslateBy = 0.025;
    cent = triCen[currMod];
    transformM = transformArray[currMod];

	if(allPressedKeys[65] && !allPressedKeys[16]){ 		
        Eye[0]+= traslateBy;
	}

    if(allPressedKeys[68] && !allPressedKeys[16]){     
        Eye[0] -= traslateBy;
    }

    if(allPressedKeys[81] && !allPressedKeys[16]){      
        Eye[1]+= traslateBy;
    }

    if(allPressedKeys[69] && !allPressedKeys[16]){      
        Eye[1] -= traslateBy;
    }

    if(allPressedKeys[87] && !allPressedKeys[16]){      
        Eye[2]+= traslateBy;
    }

    if(allPressedKeys[83] && !allPressedKeys[16]){      
        Eye[2] -= traslateBy;
    }

    if(allPressedKeys[65] && allPressedKeys[16]){      
        vec3.rotateY(lookAtVector, lookAtVector, [0.0,0.0,0.0], glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[68] && allPressedKeys[16]){      
        vec3.rotateY(lookAtVector, lookAtVector, [0.0,0.0,0.0], -glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[87] && allPressedKeys[16]){      
        vec3.rotateX(lookAtVector, lookAtVector, [0.0,0.0,0.0], glMatrix.toRadian(0.5));
        vec3.rotateX(lookUpVector, lookUpVector, [0.0, 0.0, 0.0], glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[83] && allPressedKeys[16]){      
        vec3.rotateX(lookAtVector, lookAtVector, [0.0,0.0,0.0], -glMatrix.toRadian(0.5));
        vec3.rotateX(lookUpVector, lookUpVector, [0.0, 0.0, 0.0], -glMatrix.toRadian(0.5));
    }

   

    if(allPressedKeys[37]){      
        objHighlight = true;
        currMod = currMod-1;
        if (currMod<0){
            currMod = inputTriangles.length-1;
        }
        mat4.identity(transformM);
        mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [1.2, 1.2, 1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
        transformArray[currMod] = transformM;

    }
    
    if(allPressedKeys[39]){      
        objHighlight = true;
        currMod = currMod+1;
        if (currMod>inputTriangles.length-1){
            currMod = 0;
        }
        
        mat4.identity(transformM);
        mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [1.2, 1.2, 1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
        
    }
    if(allPressedKeys[32]){      
        objHighlight = false;
    	mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [1.2, 1.2, 1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[75] && objHighlight && !allPressedKeys[16]){      
        mat4.translate(transformM, transformM, [traslateBy, 0, 0]);
    }

    if(allPressedKeys[186] && objHighlight && !allPressedKeys[16]){     
        mat4.translate(transformM, transformM, [-traslateBy, 0, 0]);
    }

    if(allPressedKeys[73] && objHighlight && !allPressedKeys[16]){      
        mat4.translate(transformM, transformM, [0, traslateBy, 0]);
    }

    if(allPressedKeys[80] && objHighlight && !allPressedKeys[16]){      
        mat4.translate(transformM, transformM, [0,-traslateBy, 0]);
    }

    if(allPressedKeys[79] && objHighlight && !allPressedKeys[16]){      
        mat4.translate(transformM, transformM, [0,0,traslateBy]);
    }

    if(allPressedKeys[76] && objHighlight && !allPressedKeys[16]){      
        mat4.translate(transformM, transformM, [0,0,-traslateBy]);
    }

    if(allPressedKeys[75] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateY(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[186] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateY(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[79] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateX(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[76] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateX(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[73] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateZ(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[80] && allPressedKeys[16] && objHighlight){      
        mat4.translate(transformM, transformM, cent);
        mat4.rotateZ(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    transformArray[currMod] = transformM;
}//end handleDownKey

function handleUpKey(event){
    if (event.keyCode === 65) {
        allPressedKeys[65] = false;
    } else if (event.keyCode === 68) {
        allPressedKeys[68] = false;
    } else if (event.keyCode === 81) {
        allPressedKeys[81] = false;
    } else if (event.keyCode === 69) {
        allPressedKeys[69] = false;
    } else if (event.keyCode === 87) {
        allPressedKeys[87] = false;
    } else if (event.keyCode === 83) {
        allPressedKeys[83] = false;
    } else if (event.keyCode === 37) {
        allPressedKeys[37] = false;
    } else if (event.keyCode === 39) {
        allPressedKeys[39] = false;
    } else if (event.keyCode === 32) {
        allPressedKeys[32] = false;
    } else if (event.keyCode === 75) {
        allPressedKeys[75] = false;
    } else if (event.keyCode === 186) {
        allPressedKeys[186] = false;
    } else if (event.keyCode === 73) {
        allPressedKeys[73] = false;
    } else if (event.keyCode === 80) {
        allPressedKeys[80] = false;
    } else if (event.keyCode === 79) {
        allPressedKeys[79] = false;
    } else if (event.keyCode === 76) {
        allPressedKeys[76] = false;
    }
}

// read triangles in, load them into webgl buffers
function loadTriangles() {
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords and its color attribute for WebGL
        var normalArray = []; ///Array for storing normal 
        var indexArray = [];// 1D array of traingle vertices
        
        var ambientArr = []; 
        var diffuseArr = [];
        var specularArr = [];
        var shinyArr = [];
        transformArray = [];
        var setMapping = [];
        var coordDex = new Map(); // hashmap to store the value vertexOffset for each vertex
        var idx = 0;
        triCen = new Map(); //hashmap to store the centers of every triangle
        var setCount = -1;
        var centerVec = vec3.create();
        

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            // set up the vertex and index array
            setCount += 1;
            var centX = 0;
            var centY = 0;
            var centZ = 0;
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){

                centX += inputTriangles[whichSet].vertices[whichSetVert][0];
                centY += inputTriangles[whichSet].vertices[whichSetVert][1];
                centZ += inputTriangles[whichSet].vertices[whichSetVert][2];

               
            	if (coordDex.has(inputTriangles[whichSet].vertices[whichSetVert])){
            		coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
            	}
            	else{
	            	coordDex.set(inputTriangles[whichSet].vertices[whichSetVert], idx++);
	                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                }

                normalArray = normalArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
                ambientArr = ambientArr.concat(inputTriangles[whichSet].material.ambient);
                diffuseArr = diffuseArr.concat(inputTriangles[whichSet].material.diffuse);
                specularArr = specularArr.concat(inputTriangles[whichSet].material.specular);
                shinyArr = shinyArr.concat(inputTriangles[whichSet].material.n);
                setMapping = setMapping.concat(setCount);
            }
            
            set_len = inputTriangles[whichSet].vertices.length;
            centerVec = vec3.fromValues(centX/set_len,centY/set_len,centZ/set_len);
            triCen[setCount] = centerVec;
            var trans_id = mat4.create();
            transformArray = transformArray.concat(trans_id);

            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){
	        	for (var i = 0; i<3; i++){
	        		vertex_idx = inputTriangles[whichSet].vertices[inputTriangles[whichSet].triangles[whichSetTri][i]];

                    //adds the indexOffset to the index array
	        		indexArray = indexArray.concat(coordDex.get(vertex_idx));
	        	}
            }

        }// end for each triangle set 

        
    
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW);

        
        ambientBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ambientArr),gl.STATIC_DRAW); 

    
        diffuseBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(diffuseArr),gl.STATIC_DRAW); 

    
        specularBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(specularArr),gl.STATIC_DRAW);

    
        shinyBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,shinyBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Uint16Array(shinyArr),gl.STATIC_DRAW); 

        normalBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW);

        
        setBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,setBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(setMapping),gl.STATIC_DRAW);

        triBufferSize = indexArray.length;
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);

        
    } // end if triangles found
} // end load triangles



// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragAmb;
        varying vec3 fragDiff;
        varying vec3 fragSpec;
        varying float fragN;
        varying vec3 fragNormal;
        varying vec3 fragPos;
        uniform vec3 eye;
        uniform vec3 light;

        void main(void) {
        	vec3 eyeP = normalize(eye-fragPos);
        	vec3 lightP = normalize(light-fragPos);
        	vec3 normal = normalize(fragNormal);
        	float NLd = dot(normal,lightP);
        	float NL = max(0.0,NLd);
        	vec3 H = normalize(lightP+eyeP);
        	float NH = dot(normal,H);
        	float NHn = max(0.0,pow(NH,fragN));
        	vec3 diffuseColor = fragDiff*NL;
        	vec3 specularColor = fragSpec*NHn;
        	vec3 lighting = fragAmb + diffuseColor + specularColor;
            gl_FragColor = vec4(lighting, 1.0);
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
    	precision mediump float;

        attribute vec3 vertexPos;
        attribute vec3 vertexNorm;
        attribute vec3 vertexAmb;
        attribute vec3 vertexDiff;
        attribute vec3 vertexSpec;
        attribute float vertexN;
        
        attribute float vertexSet;
        uniform float currModel;

        uniform mat4 transformMat;
        uniform mat4 viewM;
        uniform mat4 projM;

        
        varying vec3 fragAmb;
        varying vec3 fragDiff;
        varying vec3 fragSpec;
        varying float fragN;
        varying vec3 fragPos;
        varying vec3 fragNormal;

        void main(void) {
        	fragAmb = vertexAmb;
        	fragDiff = vertexDiff;
        	fragSpec = vertexSpec;
        	fragNormal = vertexNorm;
        	fragPos = vertexPos;
        	fragN = vertexN;
            mat4 transM;

            if(currModel != vertexSet)
                transM = mat4(1,0,0,0,
                              0,1,0,0,
                              0,0,1,0,
                              0,0,0,1);
            else
                transM = transformMat;

            gl_Position = projM * viewM * transM * vec4(vertexPosition, 1.0);

        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
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

                eyeUni = gl.getUniformLocation(shaderProgram, "eye");
                lightUni = gl.getUniformLocation(shaderProgram, "light");
                transformUni = gl.getUniformLocation(shaderProgram, "transformMat");
                viewUni = gl.getUniformLocation(shaderProgram, "viewM");
                projUni = gl.getUniformLocation(shaderProgram, "projM");
                // transformSetUniform = gl.getUniformLocation(shaderProgram, "transformSet");
                currModelUniform = gl.getUniformLocation(shaderProgram, "currModel");

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input 
                    gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexAmbAttrib = gl.getAttribLocation(shaderProgram, "vertexAmb");
                	gl.enableVertexAttribArray(vertexAmbAttrib);
                
                vertexDiffAttrib = gl.getAttribLocation(shaderProgram, "vertexDiff");
                	gl.enableVertexAttribArray(vertexDiffAttrib);

                vertexSpecAttrib = gl.getAttribLocation(shaderProgram, "vertexSpec");
                	gl.enableVertexAttribArray(vertexSpecAttrib);

                vertexNAttrib = gl.getAttribLocation(shaderProgram, "vertexN");
                	gl.enableVertexAttribArray(vertexNAttrib);

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                	gl.enableVertexAttribArray(vertexNormalAttrib);

                vertexSetAttrib = gl.getAttribLocation(shaderProgram, "vertexSet");
                    gl.enableVertexAttribArray(vertexSetAttrib);

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// initializes values for View and Proj matrices
function initProjView(){
    viewM = new Float32Array(16);
    projM = new Float32Array(16);

    Center = vec3.add(Center, Eye, lookAtVector);
    if (!orthogonal)
       mat4.perspective(projM, glMatrix.toRadian(90), canvas.width/canvas.height, nearVal, farVal);
    if(orthogonal)
        mat4.ortho(projM,-1,1,-1,1, nearVal, farVal);
    mat4.lookAt(viewM, Eye,Center,lookUpVector);
}// end init Proj View

var bgColor = 0;
// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    // bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(bgColor, 0, 0, 1.0);
    requestAnimationFrame(renderTriangles);

    initProjView();
    gl.uniformMatrix4fv(transformUni,gl.False, transformM);
    gl.uniformMatrix4fv(projUni, gl.False, projM);
    gl.uniformMatrix4fv(viewUni, gl.False, viewM);
    gl.uniform3fv(eyeUni, Eye);
    gl.uniform3fv(lightUni, Light);
    // gl.uniform4fv(transformSetUniform, transformArray);
    gl.uniform1f(currModelUniform, currMod);

    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false, 0,0); // feed
    //defines the color for each vertex
    gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate
    gl.vertexAttribPointer(vertexDiffAttrib,3,gl.FLOAT,false, 0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,setBuffer); // activate
    gl.vertexAttribPointer(vertexSetAttrib,1,gl.FLOAT,false, 0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate
    gl.vertexAttribPointer(vertexSpecAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate
    gl.vertexAttribPointer(vertexAmbAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,shinyBuffer); // activate
    gl.vertexAttribPointer(vertexNAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);//index buffer activate
    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render


} // end render triangles


//pART 7



/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  document.addEventListener("keydown", function(event) {
    if (event.code === "Digit1" || event.code === "Numpad1") {
      console.log('! pressed')
      setupWebGL(); // set up the webGL environment
      //loadTriangles2(); // load in the triangles from tri file
      setupShaders(); // setup the webGL shaders
      renderTriangles(); // draw the triangles using webGL
    }
  });
} // end main

