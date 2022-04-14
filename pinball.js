"use strict";

var gl;
var canvas;

var vertices = [];
var u_colorLoc;
var a_positionLoc;

var squareVertexPositionData = [];
var squareVertexPositionBuffer;
var circleVertexPositionData = [];
var circleVertexPositionBuffer;
var triangleVertexPositionData = [];
var triangleVertexPositionBuffer;

var CommonMVMatrix;
var nonCommonMVMatrix;
var mvMatrix;

var u_mvMatrixLoc;
var u_ctmLoc;

var sm, tm, rm, ctm;

var globalScale = 100;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var vertices = [
        vec2( -1, -1 ),
        vec2( -1,  1 ),
        vec2( 1,  1 ),
        vec2( 1, -1 ),
    ];

    setupSquare(vertices, 1, 0, 3, 2);
    setupCircle();
    setupTriangle(vertices, 1, 0, 3);

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    circleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, circleVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(circleVertexPositionData), gl.STATIC_DRAW );

    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, triangleVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(triangleVertexPositionData), gl.STATIC_DRAW );

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexPositionBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(squareVertexPositionData), gl.STATIC_DRAW );

    a_positionLoc = gl.getAttribLocation( program, "a_vPosition" );
    // gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_positionLoc);

    u_colorLoc = gl.getUniformLocation( program, "u_color" );

    u_ctmLoc = gl.getUniformLocation( program, "u_ctMatrix" );

    render();
}

function setupSquare(vertices, a, b, c, d) {
    squareVertexPositionData.push(vertices[a]);
    squareVertexPositionData.push(vertices[b]);
    squareVertexPositionData.push(vertices[c]);
    squareVertexPositionData.push(vertices[d]);
}
function setupTriangle(vertices, a, b, c) {
    triangleVertexPositionData.push(vertices[a]);
    triangleVertexPositionData.push(vertices[b]);
    triangleVertexPositionData.push(vertices[c]);
}
function setupCircle() {
    var increment = 0.1;
    for (var theta=0.0; theta <= Math.PI*2; theta+=increment) {
        circleVertexPositionData.push(vec2(Math.cos(theta+increment), Math.sin(theta+increment)));
        // circleVertexPositionData.push(vec4(Math.cos(theta+increment), 0.0, Math.sin(theta+increment), 1.0));
    }
}
function drawCircle(color)
{
    var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

    var circleMat = mat4();
    var scaling_c = 0.05;

    var sm = scalem(scaling_c, scaling_c, 0);
    var ctm = mult(sm, circleMat);

    var trans_hy = 0.73;
    var trans_hx = 0.528;
    var tm = translate(trans_hx, -trans_hy, 0.0);

    ctm = mult(tm, ctm);

    ctm = mult(pm, ctm);

    gl.uniformMatrix4fv(u_ctmLoc, false, flatten(ctm));

    gl.uniform3fv( u_colorLoc, color );

    // gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    gl.drawArrays( gl.TRIANGLES, 0, circleVertexPositionData.length );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, circleVertexPositionData.length );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, circleVertexPositionData.length );
}
function drawSquare(color, ctm)
{
    var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
    ctm = mult(pm, ctm);

    gl.uniformMatrix4fv(u_ctmLoc, false, flatten(ctm));
    // set uniforms
    // color = vec4(color, 1.0);
    gl.uniform3fv( u_colorLoc, color );
    // mvMatrix = mult(commonMVMatrix, nonCommonMVMatrix);
    // gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );

    // gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, squareVertexPositionData.length );
}
function drawTriangle(color, ctm)
{
    var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
    ctm = mult(pm, ctm);

    gl.uniformMatrix4fv(u_ctmLoc, false, flatten(ctm));
    // set uniforms
    // color = vec4(color, 1.0);
    gl.uniform3fv( u_colorLoc, color );
    // mvMatrix = mult(commonMVMatrix, nonCommonMVMatrix);
    // gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix) );
    // gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );

    // gl.enableVertexAttribArray( a_positionLoc );
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.TRIANGLES, 0, triangleVertexPositionData.length );
}
function drawCourt()
{
    var squareMat = mat4();

    sm = scalem(0.07, .07, 0);
    tm = translate(-0.35, 0, 0);
    ctm = mult(sm, squareMat);
    ctm = mult(tm, ctm);
    drawSquare(vec3(0, .7, 0), ctm);
    tm = translate(0.2, 0, 0);
    ctm = mult(sm, squareMat);
    ctm = mult(tm, ctm);
    drawSquare(vec3(0, .7, 0), ctm);


    rm = rotateZ(270);
    tm = translate(-.35, 0.75, 0);
    ctm = mult(rm, ctm);
    ctm = mult(tm, ctm);
    drawTriangle(vec3(.4,0,0), ctm);
    rm = rotateZ(270);
    tm = translate(-.33, 0.21, 0);
    ctm = mult(rm, ctm);
    ctm = mult(tm, ctm);
    drawTriangle(vec3(.4,0,0), ctm);

    sm = scalem(0.2, 0.1, 0);
    tm = translate(-.4, -.72, 0);
    ctm = mult(sm, squareMat);
    ctm = mult(tm, ctm);
    drawTriangle(vec3(207/255, 185/255, 151/255), ctm);

    rm = rotateZ(90);
    sm = scalem(0.12, 0.22, 0);
    tm = translate(.25, -.72, 0);
    ctm = mult(sm, squareMat);
    ctm = mult(rm, ctm);
    ctm = mult(tm, ctm);
    drawTriangle(vec3(207/255, 185/255, 151/255), ctm);



    sm = scalem(0.02, 0.9*0.8, 0);
    tm = translate(0.45, -0.1, 0);
    ctm = mult(sm, squareMat);
    ctm = mult(tm, ctm);
    drawSquare(vec3(207/255, 185/255, 151/255), ctm);

    sm = scalem(0.65*0.9, 0.9*0.9, 0);
    ctm = mult(sm, squareMat);
    drawSquare(vec3(244/255, 226/255, 198/255), ctm);

    sm = scalem(0.65, 0.9, 0);
    ctm = mult(sm, squareMat);
    drawSquare(vec3(207/255, 185/255, 151/255), ctm);



}
function drawBall()
{
    // nonCommonMVMatrix = scalem(1, 1, 1);
    drawCircle(vec3(0.5, 0.5, 0.5));
}
function drawFlippers()
{

  var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
  var circleMat = mat4();
  var scaling_c = 0.016;
  var sm = scalem(scaling_c, scaling_c, 0);
  var ctm = mult(sm, circleMat);
  var tm = translate(-.23, -.8, 0.0);
  ctm = mult(tm, ctm);
  ctm = mult(pm, ctm);
  gl.uniformMatrix4fv(u_ctmLoc, false, flatten(ctm));
  gl.uniform3fv( u_colorLoc, vec3(.5,.5,.5) );
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
  gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
  gl.drawArrays( gl.TRIANGLES, 0, circleVertexPositionData.length );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, circleVertexPositionData.length );
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, circleVertexPositionData.length );


  var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
  var circleMat = mat4();
  var scaling_c = 0.016;
  var sm = scalem(scaling_c, scaling_c, 0);
  var ctm = mult(sm, circleMat);
  var tm = translate(0.08, -.8, 0.0);
  ctm = mult(tm, ctm);
  ctm = mult(pm, ctm);
  gl.uniformMatrix4fv(u_ctmLoc, false, flatten(ctm));
  gl.uniform3fv( u_colorLoc, vec3(.5,.5,.5) );
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexPositionBuffer);
  gl.vertexAttribPointer( a_positionLoc, 2, gl.FLOAT, false, 0, 0 );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
  gl.drawArrays( gl.TRIANGLES, 0, circleVertexPositionData.length );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, circleVertexPositionData.length );
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, circleVertexPositionData.length );



  var squareMat = mat4();
  sm = scalem(0.06, .01, 0);
  tm = translate(-.162, -0.80, 0);
  ctm = mult(sm, squareMat);
  ctm = mult(tm, ctm);
  drawSquare(vec3(.3, .3, .3), ctm);



    //drawSquare(vec3(.3, .3, .3), ctm);

  sm = scalem(0.06, .01, 0);
  tm = translate(0.01, -0.80, 0);
  ctm = mult(sm, squareMat);
  ctm = mult(tm, ctm);
  drawSquare(vec3(.3, .3, .3), ctm);



}
function drawAll()
{
    gl.clear( gl.COLOR_BUFFER_BIT);
    // CommonMVMatrix = scalem(globalScale, globalScale, globalScale);
    // viewing matrix
    // CommonMVMatrix = mult(lookAt(vec3(0.0, 0.0, 1.0),
    //                             vec3(0.0, 0.0, 0.0),
    //                             vec3(0.0, 1.0, 0.0)),
    // CommonMVMatrix);
    drawFlippers();
    drawBall();
    drawCourt();


}
function drawScore()
{

}
var render = function()
{

//  document.getElementById("Left").onclick = function(){
//      var rm = rotateZ(30);
//      ctm = mult(rm, ctm);
//      drawSquare(vec3(.3, .3, .3), ctm);
//    }
    requestAnimFrame(render);
    drawAll();
}
