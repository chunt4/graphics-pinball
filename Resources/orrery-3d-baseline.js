"use strict";

var gl;
var canvas;

var printDay;

var mvMatrix;

// non-common modelview matrix
var nonCommonMVMatrix;

// common modelview matrix
var commonMVMatrix;

var a_positionLoc;
var u_colorLoc;
var u_mvMatrixLoc;    
var nMatrix, u_nMatrixLoc;
var a_vNormalLoc;

var u_diffuseLoc;
var u_specularLoc;

var a_TextureCoordLoc;

var u_TextureSamplerLoc;

var projMatrix;
var u_projMatrixLoc;

var ambientProduct, diffuseProduct, specularProduct;

// Last time that this function was called
var g_last = Date.now();
var elapsed = 0;
var mspf = 1000/30.0;  // ms per frame

// scale factors
var rSunMult = 45;      // keep sun's size manageable
var rPlanetMult = 2000;  // scale planet sizes to be more visible

// surface radii (km)
var rSun = 696000;
var rMercury = 2440;
var rVenus = 6052;
var rEarth = 6371;
var rMoon = 1737;

// orbital radii (km)
var orMercury = 57909050;
var orVenus = 108208000;
var orEarth = 149598261;
var orMoon = 384399;

// orbital periods (Earth days)
var pMercury = 88;
var pVenus = 225;
var pEarth = 365;
var pMoon = 27;

// textures
var sunTexture;
var mercuryTexture;
var venusTexture;
var earthTexture;
var moonTexture;

// time
var currentDay;
var daysPerFrame;

var globalScale;

// vertices
var circleVertexPositionData = []; // for orbit
var sphereVertexPositionData = []; // for planet
var sphereVertexIndexData = []; // for planet
var textureCoordData = []; // for texture

var circleVertexPositionBuffer;
var sphereVertexPositionBuffer;
var sphereVertexIndexBuffer;
var nBuffer;
var sphereVertexTextureCoordBuffer;

// for trackball
var m_inc;
var m_curquat;
var m_mousex = 1;
var m_mousey = 1;
var trackballMove = false;
var ctMatrix;

// for lighting
var normalsArray = [];

// point light (assume in object space)
var lightPosition = vec4(1.0, 1.0, 3.0, 0.0 );

var lightRed = 1.0;
var lightGreen = 1.0;
var lightBlue = 1.0;

var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 30.0;

var radius = 1.0;

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

// for trackball
function mouseMotion( x,  y)
{
        var lastquat;
        if (m_mousex != x || m_mousey != y)
        {
            lastquat = trackball(
                  (2.0*m_mousex - canvas.width) / canvas.width,
                  (canvas.height - 2.0*m_mousey) / canvas.height,
                  (2.0*x - canvas.width) / canvas.width,
                  (canvas.height - 2.0*y) / canvas.height);
            m_curquat = add_quats(lastquat, m_curquat);
            m_mousex = x;
            m_mousey = y;
        }
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    printDay = document.getElementById("printDay");

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    canvas.width = 1024;
    canvas.height = 512;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.05, 0.05, 0.05, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    // for trackball
    m_curquat = trackball(0, 0, 0, 0);

    currentDay = 0;
    daysPerFrame = 0.0625;

    // global scaling for the entire orrery
    globalScale = 50.0 / ( orEarth + orMoon + ( rEarth + 2 * rMoon ) * rPlanetMult );

    setupCircle();

    setupSphere();

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    // create nBuffer and a_vNormalLoc, write your code here
    a_TextureCoordLoc = gl.getAttribLocation(program, "a_TextureCoord");
    gl.enableVertexAttribArray(a_TextureCoordLoc);

    // gl.activeTexture(gl.TEXTURE0);
    u_TextureSamplerLoc = gl.getUniformLocation(program, "u_TextureSampler");
    gl.uniform1i(u_TextureSamplerLoc, 0);

    sphereVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    a_vNormalLoc = gl.getAttribLocation( program, "a_vNormal");

    circleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, circleVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(circleVertexPositionData), gl.STATIC_DRAW );

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertexPositionData), gl.STATIC_DRAW);

    a_positionLoc = gl.getAttribLocation( program, "a_position" );

    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphereVertexIndexData), gl.STATIC_DRAW);

    u_colorLoc = gl.getUniformLocation( program, "u_color" );

    initTexture();



    // Associate out shader variables with our data buffer

    u_mvMatrixLoc = gl.getUniformLocation( program, "u_mvMatrix" );

    // send normalMatrix to GPU, write your code here
    u_nMatrixLoc = gl.getUniformLocation(program, "u_nMatrix");

    // projection matrix
    u_projMatrixLoc = gl.getUniformLocation( program, "u_projMatrix" );
    // var projMatrix = perspective(30, 1.0, 0.1, 1000.0);
    projMatrix = perspective(30*2., 1.0*2, 0.1*2, 1000.0);
    gl.uniformMatrix4fv(u_projMatrixLoc, false, flatten(projMatrix) );

    lightDiffuse = vec4(lightRed, lightGreen, lightBlue, 1.0 );
    lightSpecular = vec4(lightRed, lightGreen, lightBlue, 1.0 );

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    u_diffuseLoc = gl.getUniformLocation(program, "u_diffuseProduct");
    u_specularLoc = gl.getUniformLocation(program, "u_specularProduct");

    gl.uniform4fv( gl.getUniformLocation(program,
        "u_ambientProduct"),flatten(ambientProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "u_lightPosition"),flatten(lightPosition) );
     gl.uniform1f( gl.getUniformLocation(program,
        "u_shininess"),materialShininess );

    // for trackball
    canvas.addEventListener("mousedown", function(event){
        m_mousex = event.clientX - event.target.getBoundingClientRect().left;
        m_mousey = event.clientY - event.target.getBoundingClientRect().top;
        trackballMove = true;
    });

    // for trackball
    canvas.addEventListener("mouseup", function(event){
        trackballMove = false;
    });

    // for trackball
    canvas.addEventListener("mousemove", function(event){
        if (trackballMove) {
        var x = event.clientX - event.target.getBoundingClientRect().left;
        var y = event.clientY - event.target.getBoundingClientRect().top;
        mouseMotion(x, y);
        }
    } );

    render();

    document.getElementById("incdpf").onclick = function () {
        daysPerFrame = daysPerFrame*2;
    }
    document.getElementById("decdpf").onclick = function () {
        daysPerFrame = daysPerFrame/2;
    }
    document.getElementById("sliderRed").oninput = function(){
        lightRed = this.value;
        lightDiffuse = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        lightSpecular = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        rgbLight();
    }
    document.getElementById("sliderGreen").oninput = function(){
        lightGreen = this.value;   
        lightDiffuse = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        lightSpecular = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        rgbLight();
    }
    document.getElementById("sliderBlue").oninput = function(){
        lightBlue = this.value;
        lightDiffuse = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        lightSpecular = vec4(lightRed, lightGreen, lightBlue, 1.0 );
        rgbLight();
    }
};

function rgbLight() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

}

function initTexture() {
    sunTexture = gl.createTexture();
    sunTexture.image = new Image();
    sunTexture.image.onload = function () {
        handleLoadedTexture(sunTexture)
    }
    sunTexture.image.crossOrigin="anonymous";
    sunTexture.image.src = "sun.jpg";

    mercuryTexture = gl.createTexture();
    mercuryTexture.image = new Image();
    mercuryTexture.image.onload = function () {
        handleLoadedTexture(mercuryTexture)
    }
    mercuryTexture.image.crossOrigin="anonymous";
    mercuryTexture.image.src = "mercury.jpg";

    venusTexture = gl.createTexture();
    venusTexture.image = new Image();
    venusTexture.image.onload = function () {
        handleLoadedTexture(venusTexture)
    }
    venusTexture.image.crossOrigin="anonymous";
    venusTexture.image.src = "venus.jpg";

    earthTexture = gl.createTexture();
    earthTexture.image = new Image();
    earthTexture.image.onload = function () {
        handleLoadedTexture(earthTexture)
    }
    earthTexture.image.crossOrigin="anonymous";
    earthTexture.image.src = "earth.jpg";

    moonTexture = gl.createTexture();
    moonTexture.image = new Image();
    moonTexture.image.onload = function () {
        handleLoadedTexture(moonTexture)
    }
    moonTexture.image.crossOrigin="anonymous";
    moonTexture.image.src = "moon.jpg";
}

function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    if (isPowerOf2(texture.image.width) && isPowerOf2(texture.image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    } else {
        // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
        // Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

function setupCircle() {
    var increment = 0.1;
    for (var theta=0.0; theta < Math.PI*2; theta+=increment) {
        circleVertexPositionData.push(vec3(Math.cos(theta+increment), 0.0, Math.sin(theta+increment)));
        // circleVertexPositionData.push(vec4(Math.cos(theta+increment), 0.0, Math.sin(theta+increment), 1.0));
    }
}

function setupSphere() {
    var latitudeBands = 50;
    var longitudeBands = 50;
    // radius = 1.0;

    // compute sampled vertex positions
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;

            var u = 1 - (longNumber / longitudeBands);
            //var u = longNumber / longitudeBands;
            var v = 1 - (latNumber / latitudeBands);
            //var v = latNumber / latitudeBands;
            textureCoordData.push(u);
            textureCoordData.push(v);

            sphereVertexPositionData.push(radius * x);
            sphereVertexPositionData.push(radius * y);
            sphereVertexPositionData.push(radius * z);
            // sphereVertexPositionData.push(1.0);

            normalsArray.push(radius * x);
            normalsArray.push(radius * y);
            normalsArray.push(radius * z);
            // normalsArray.push(0.0);
        }
    }

    // create the actual mesh, each quad is represented by two triangles
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            // the three vertices of the 1st triangle
            sphereVertexIndexData.push(first);
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(first + 1);
            // normalsArray.push(first);
            // normalsArray.push(second);
            // normalsArray.push(first + 1);

            // the three vertices of the 2nd triangle
            sphereVertexIndexData.push(second);
            sphereVertexIndexData.push(second + 1);
            sphereVertexIndexData.push(first + 1);
            // normalsArray.push(second);
            // normalsArray.push(second + 1);
            // normalsArray.push(first + 1);
        }
    }
}

function drawCircle(color) {
    // set uniforms
    // color = vec4(color, 1.0);
    gl.uniform3fv( u_colorLoc, color );
    mvMatrix = mult(commonMVMatrix, nonCommonMVMatrix);
    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays( gl.LINE_LOOP, 0, circleVertexPositionData.length );
}

function drawSphere(color, texture) {
    // set uniforms
    // color = vec4(color, 1.0);
    gl.uniform3fv( u_colorLoc, color );
    mvMatrix = mult(commonMVMatrix, nonCommonMVMatrix);
    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    gl.uniformMatrix4fv(u_projMatrixLoc, false, flatten(projMatrix) );

    gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(a_positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);

    gl.enableVertexAttribArray( a_vNormalLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(a_vNormalLoc, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.enableVertexAttribArray(a_TextureCoordLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.vertexAttribPointer(a_TextureCoordLoc, 2, gl.FLOAT, false, 0, 0);

    //Compute nMatrix from mvMatrix
    //then something like this
    gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    nMatrix = normalMatrix(mvMatrix, true); // return 3 by 3 normal matrix
    gl.uniformMatrix3fv(u_nMatrixLoc, false, flatten(nMatrix) );



    gl.drawElements(gl.TRIANGLES, sphereVertexIndexData.length, gl.UNSIGNED_SHORT, 0);
}

function drawOrbits() {
    var gray = vec3( 1, 1, 1 );
    var angleOffset = currentDay * 360.0;  // days * degrees

    nonCommonMVMatrix = scalem(orMercury, orMercury, orMercury);
    drawCircle( gray ); // Mercury

    nonCommonMVMatrix = scalem(orVenus, orVenus, orVenus);
    drawCircle( gray );    // Venus

    nonCommonMVMatrix = scalem(orEarth, orEarth, orEarth);
    drawCircle( gray ); // Earth

    nonCommonMVMatrix = mult(rotateY(angleOffset/pEarth), 
                            mult(translate(orEarth, 0.0, 0.0), 
                                mult(rotateZ(23.5), scalem(orMoon+(rEarth*rPlanetMult), orMoon+(rEarth*rPlanetMult), orMoon+(rEarth*rPlanetMult)))));
    drawCircle( gray ); // Moon
}

function drawBodies() {
    var size;
    var angleOffset = currentDay * 360.0;  // days * degrees

    // Sun
    size = rSun * rSunMult;
    nonCommonMVMatrix = scalem(size, size, size);
    drawSphere( vec3( 1.0, 1.0, 0.0 ), sunTexture);

    // Mercury
    size = rMercury * rPlanetMult;
    nonCommonMVMatrix = mult(rotateY(angleOffset/pMercury),
                            mult(translate(orMercury, 0.0, 0.0), scalem(size, size, size)));
    drawSphere( vec3( 1.0, 0.5, 0.5), mercuryTexture);

    // Venus
    size = rVenus * rPlanetMult;
    nonCommonMVMatrix = mult(rotateY(angleOffset/pVenus),
                            mult(translate(orVenus, 0.0, 0.0), scalem(size, size, size)));
    drawSphere( vec3( 0.5, 1.0, 0.5 ), venusTexture);

    // Earth
    size = rEarth * rPlanetMult;
    // nonCommonMVMatrix = rotateZ(0,0,23.5); Also rotate 23.5 about Z!!!
    nonCommonMVMatrix = mult(rotateY(angleOffset/pEarth),
                            mult(translate(orEarth, 0.0, 0.0), 
                                mult(rotateZ(23.5), 
                                    mult(rotateY(angleOffset), scalem(size, size, size)))));
    drawSphere( vec3( 0.5, 0.5, 1.0 ), earthTexture);

    // Moon
    size = rMoon * rPlanetMult;
    var earthRef = mult(rotateY(angleOffset/pEarth), mult(translate(orEarth, 0.0, 0.0), rotateZ(23.5)));
    nonCommonMVMatrix = mult(earthRef,
                            mult(rotateY(angleOffset/pMoon),
                                mult(translate(orMoon+(rEarth*rPlanetMult), 0.0, 0.0), scalem(size, size, size))));

                                        // mult(rotateY(angleOffset/pEarth),
                                        // mult(translate(orEarth, 0.0, 0.0),
                                        // mult(rotateZ(23.5),
    drawSphere( vec3( 1.0, 1.0, 1.0), moonTexture);
}


function drawDay() {
    if (document.getElementById("dayon").checked == true) {
        var string = 'Day ' + currentDay.toString();
        printDay.innerHTML = string;
    }
    else {
        printDay.innerHTML = '';
    }
}

function drawAll()
{
    if (document.getElementById("animon").checked==true) {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        // all planets and orbits will take the following transformation

        // global scaling
        commonMVMatrix = mult(rotateX(15), scalem(globalScale, globalScale, globalScale));

        // trackball matrix goes here
        m_inc = build_rotmatrix(m_curquat);
        commonMVMatrix = mult( m_inc , commonMVMatrix )


        // viewing matrix
        commonMVMatrix = mult(lookAt(vec3(0.0, 0.0, 100.0),
                                    vec3(0.0, 0.0, 0.0),
                                    vec3(0.0, 1.0, 0.0)),
                            commonMVMatrix);


        if (document.getElementById("orbon").checked == true)
            drawOrbits();

        drawBodies();
    }

    drawDay();
}

var render = function() {
    // Calculate the elapsed time
    var now = Date.now(); // time in ms
    elapsed += now - g_last;
    g_last = now;
    if (elapsed >= mspf) {
        currentDay += daysPerFrame;
        elapsed = 0;
    }
    gl.uniform4fv( u_diffuseLoc, flatten(diffuseProduct) );
    gl.uniform4fv( u_specularLoc,flatten(specularProduct) );
    requestAnimFrame(render);
    drawAll();
}
