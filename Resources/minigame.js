"use strict";

var gl;
var p = vec2(0.0, 0.0);
var vertices = [p];
var vertices2 = [];
var radius = 0.05;
var xVelocity = 0.005;
var yVelocity = -0.005;
var xCenter = randomPosNegOne() * 0.9;
var yCenter = 0.9;
var u_MoveX = 0;
var inc = Math.PI/18; // 36 even segments to approximate circle
var u_colorLoc;
var u_vCenterLoc;
var u_moveLoc;
var numbullets = 100;
var shoot = false;
var bulletx;
var bullety;
var string;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // vertices.push(vec2(0.5,0.0));
    // vertices.push(vec2(0.5,0.1));
    // vertices.push(vec2(0.4,0.2));
    // vertices.push(vec2(radius*Math.cos(inc),radius*Math.sin(inc)))
    radius = 0.05;
    for (var i = 0; i <= 2*Math.PI; i+=inc) {
      vertices.push(vec2(radius*Math.cos(i),radius*Math.sin(i)))
    }
    // push base vertices
    vertices.push(vec2(-0.05, -1.0));
    vertices.push(vec2(0.05, -1.0));
    vertices.push(vec2(0.05, -0.95));
    vertices.push(vec2(-0.05, -0.95));

    radius = 0.025;
    // push bullet vertices
    for (var i = 0; i <= 2*Math.PI; i+=inc) {
      vertices.push(vec2(radius*Math.cos(i),radius*Math.sin(i)))
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var a_vPositionLoc = gl.getAttribLocation( program, "a_vPosition" );
    gl.vertexAttribPointer( a_vPositionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( a_vPositionLoc );

    u_colorLoc = gl.getUniformLocation( program, "u_color" );

    u_vCenterLoc = gl.getUniformLocation (program, "u_vCenter");

    render();

    document.getElementById("Left").onclick = function () {
        if (u_MoveX > -1+radius){
            u_MoveX -= 0.1;
        }
    }
    document.getElementById("Right").onclick = function () {
        if (u_MoveX < 1-radius){
            u_MoveX += 0.1;
        }
    }
    document.getElementById("SpeedUp").onclick = function () {
        if (xVelocity < 0.01){
            xVelocity = xVelocity*2;
            yVelocity = yVelocity*2;
        }
    }
    document.getElementById("SpeedDown").onclick = function () {
        if (xVelocity > 0.001){
            xVelocity = xVelocity/2;
            yVelocity = yVelocity/2;
        }
    }
    document.getElementById("Shoot").onclick = function () {
        numbullets--;
        string = 'numbullets = ' + numbullets;
        document.getElementById("Bullets").innerHTML = string;
        shoot = true;
        bulletx = u_MoveX;
        bullety = -1;
    }

};

function animate () {
    
    // increment xCenter and yCenter
    // write your code here
    xCenter += xVelocity;
    yCenter += yVelocity;

    if (shoot) {
        if (bullety < 1 || bullety > -1){
            bullety += 0.1;
        }
        else {
            shoot = false;
        }
    }

    if ((Math.abs(xCenter-u_MoveX)<=3*radius && yCenter<=-1+(2*radius)) || numbullets==0){
        alert("You Lose!");
        numbullets = 100;
        yCenter = 0.9;
        u_MoveX = 0;
        shoot = false;
        xCenter = randomPosNegOne() * 0.9;
        string = 'numbullets = ' + numbullets;
        document.getElementById("Bullets").innerHTML = string;
    }

    if (Math.abs(bulletx-xCenter)<=2*radius && Math.abs(bullety-yCenter)<=(2*radius)){
        alert("You Win!");
        numbullets = 100;
        yCenter = 0.9;
        u_MoveX = 0;
        xCenter = randomPosNegOne() * 0.9;
        shoot = false;
        string = 'numbullets = ' + numbullets;
        document.getElementById("Bullets").innerHTML = string;
    }
    
    // check if xCenter/yCenter is out of bound (use extend),
    // if yes, keep it in bound and reverse the xVelocity/yVelocity
    // write your code here
    if (xCenter >= 1-radius || xCenter <= -1+radius) {
        xVelocity = -xVelocity;
    }
    if (yCenter >= 1-radius || yCenter <= -1+radius) {
        yVelocity = -yVelocity;
    }
}

function randomPosNegOne()
{
    return Math.random() > 0.5 ? Math.random() : -Math.random();
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    animate();
    gl.uniform2fv (u_vCenterLoc, vec2(xCenter, yCenter));
    gl.uniform4fv( u_colorLoc, vec4(0.4, 0.4, 1.0, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    gl.drawArrays( gl.TRIANGLES, 0, 38 );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 38 );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 38 );

    gl.uniform2fv (u_vCenterLoc, vec2(u_MoveX, 0));
    gl.uniform4fv( u_colorLoc, vec4(1.0, 0.4, 0.4, 1.0));
    gl.drawArrays( gl.TRIANGLE_FAN, 38, 4 );

    if (shoot) {
        gl.uniform4fv( u_colorLoc, vec4(0.2, 0.2, 0.2, 1.0));
        gl.uniform2fv (u_vCenterLoc, vec2(bulletx, bullety));
        gl.drawArrays( gl.TRIANGLE_FAN, 42, 4 );
        gl.drawArrays( gl.TRIANGLES, 42, 37 );

        gl.drawArrays( gl.TRIANGLE_FAN, 42, 37 );
        gl.drawArrays( gl.TRIANGLE_STRIP, 42, 37 );
    }

    requestAnimFrame(render);
}

