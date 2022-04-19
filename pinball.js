"use strict";

var gl;
var canvas;

var vertices = [];
var u_colorLoc;
var a_positionLoc;
var v = [];
var xCenterb, yCenterb;

var squareVertexPositionData = [];
var squareVertexPositionBuffer;
var circleVertexPositionData = [];
var circleVertexPositionBuffer;
var triangleVertexPositionData = [];
var triangleVertexPositionBuffer;

var CommonMVMatrix;
var nonCommonMVMatrix;
var mvMatrix;

var rm_fl;
var tm_fl;
var rm_fr;
var tm_fr;

var u_mvMatrixLoc;
var u_ctmLoc;

var sm, tm, rm, ctm;

var globalScale = 100;

var xVelocity = 0.0;
var yVelocity = 0.02 + (Math.random()/3000);
var xCenter = 0.528;
var yCenter = -0.75;

var extend = 0.05;
var countl = 0;
var countr = 0;

var release_bool = false;
var release_change = true;
var latch_close = false;

var colliderObjects = [];

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


    //u_vCenterLoc = gl.getUniformLocation (program, "u_vCenter");

    u_ctmLoc = gl.getUniformLocation( program, "u_ctMatrix" );
    rm_fl = rotateZ(-10);
    tm_fl = translate(-.09, -0.688, 0);
    rm_fr = rotateZ(10);
    tm_fr = translate(-.055, -0.663, 0);
    // document.getElementById("Left").onclick = function(){
    //     countl = countl + 1;
    //     if(countl%2 != 0){
    //       tm_fl = translate(-.49, -0.43, 0);
    //       rm_fl = rotateZ(30);
    //     }
    //     else{
    //       rm_fl = rotateZ(-10);
    //       tm_fl = translate(-.09, -0.688, 0);
    //     }
  
    //     }
    //   document.getElementById("Right").onclick = function(){
    //     countr = countr + 1;
    //     if(countr%2 != 0){
    //       rm_fr = rotateZ(-30);
    //       tm_fr = translate(.369, -0.503, 0);
    //     }
    //     else{
    //       rm_fr = rotateZ(10);
    //       tm_fr = translate(-.055, -0.663, 0);
    //     }
    // }
    window.addEventListener("keydown", function(event) {
        if (event.key=="ArrowLeft"){
            tm_fl = translate(-.49, -0.43, 0);
            rm_fl = rotateZ(30);
        }
        else if (event.key=="ArrowRight"){
            rm_fr = rotateZ(-30);
            tm_fr = translate(.369, -0.503, 0);
        }
    });
    window.addEventListener("keyup", function(event){
        if (event.key=="ArrowLeft"){
            rm_fl = rotateZ(-10);
            tm_fl = translate(-.09, -0.688, 0);
        }
        else if (event.key=="ArrowRight"){
            rm_fr = rotateZ(10);
            tm_fr = translate(-.055, -0.663, 0);
        }
    });

    document.getElementById("Ball").onclick = function(){
        release_bool = true;
    }

    render();
}

function diffBall(){
  var p = vec2(0.0, 0.0);
  var rad = 0.05;
  var theta = Math.PI / 30;
  v = [p];
  var x = Math.sin(theta) * rad;
  var y = Math.cos(theta) * rad;
  v.push(vec2(rad, 0.0));
  v.push(vec2(y, x));


  v.push(p);
  v.push(vec2(y, x));
  theta = Math.PI / 30;
  x = Math.sin(theta) * rad;
  y = Math.cos(theta) * rad;
  v.push(vec2(y, x));

  for(var z = theta; z <= (2 * Math.PI); z = z + (Math.PI / 30) ){
    v.push(p);
    v.push(vec2(y, x));
    x = Math.sin(z) * rad;
    y = Math.cos(z) * rad;
    v.push(vec2(y, x));
  }
  v.push(vec2(-0.05, -0.05));
  v.push(vec2(-0.05, 0.05));
  v.push(vec2(0.05, 0.05));
  v.push(vec2(0.05, -0.05));

  for (var l = 0; l < v.length; l = l + 3){
    //gl.uniform3fv(u_ColorLoc, colors[0]);
    gl.uniform2fv (u_ballCenterLoc, vec2(xCenter, yCenter));
    gl.drawArrays( gl.TRIANGLE_FAN, l, 3 );
  }
  animate();
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
    var scaling_c = 0.04;

    var sm = scalem(scaling_c, scaling_c, 0);
    var ctm = mult(sm, circleMat);

    var tm = translate(xCenter, yCenter, 0.0);

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


    if ((!release_change && yCenter < 0.65) || latch_close) {
        sm = scalem(0.02, 0.1, 0);
        tm = translate(0.45, 0.72, 0);
        ctm = mult(sm, squareMat);
        ctm = mult(tm, ctm);
        drawSquare(vec3(207/255, 185/255, 151/255), ctm);
        latch_close = true;
    }

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
  var tm = translate(-.27, -.65, 0.0);
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
  var tm = translate(0.12, -.65, 0.0);
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

  sm = scalem(0.07, .01, 0);
  //tm = translate(-.162, -0.80, 0);

  ctm = mult(tm_fl, sm);
  //ctm = mult(sm, ctm);
  ctm = mult(rm_fl, ctm);
//  ctm = mult(tm, ctm);

  drawSquare(vec3(.3, .3, .3), ctm);



    //drawSquare(vec3(.3, .3, .3), ctm);

  sm = scalem(0.07, .01, 0);
  //tm = translate(0.01, -0.80, 0);
  ctm = mult(tm_fr, sm);
  ctm = mult(rm_fr, ctm);
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


function animate () {

    // increment xCenter and yCenter
    // write your code here
    xCenter += xVelocity;
    yCenter += yVelocity;

    yVelocity -= 0.000135;
    if (yVelocity < 0.005 && release_change){
        xVelocity = -0.00625;
        release_change = false;
    }
    

    // check if xCenter/yCenter is out of bound (use extend),
    // if yes, keep it in bound and reverse the xVelocity/yVelocity
    // write your code here
    // if (xCenter + 0.05 >= 0.65*0.9 && !latch_close){
    // //   xCenter = extend;
    //   xVelocity *= -1.0;

    // }
    if (xCenter + 0.05 >= 0.45 && latch_close){
        //   xCenter = extend;
          xVelocity *= -0.95;
    
    }
    if (xCenter - 0.05 <= -0.65*0.9){
    //   xCenter = -1.0 * extend;
      xVelocity *= -0.95;

    }
    if (yCenter + 0.05 >= 0.9*0.9){
    //   yCenter = extend;
      yVelocity *= -1.0;

    }
    if (yCenter - 0.05 <= -0.9*0.9){
    //   yCenter = -1.0 * extend;
      
      var angle_in = Math.atan2(yVelocity, xVelocity);
      var angle_out;
      if (xCenter < 0){
        angle_out = angleReflect(angle_in, 340);
        if (xVelocity<0){
            xVelocity *= -(Math.cos(angle_out)+0.5);
        }
        else{
            xVelocity *= 0.5+Math.cos(angle_out);
        }
      }
      if (xCenter > 0){
        console.log("Hello");
        angle_out = angleReflect(angle_in, 340);
        if (xVelocity<0){
            xVelocity *= 1-Math.cos(angle_out);
        }
        else{
            xVelocity *= -(-Math.cos(angle_out)+1);
        }
      }
      xVelocity *= 0.95;
      yVelocity *= Math.sin(angle_out);
    //   xVelocity *= -0.95;
      yVelocity *= -0.85;
    }

}
function angleReflect(incidenceAngle, surfaceAngle){
    var a = surfaceAngle * 2 - incidenceAngle;
    return a >= 360 ? a - 360 : a < 0 ? a + 360 : a;
}
var render = function()
{
    requestAnimFrame(render);
    if (release_bool){
        animate();
    }
    drawAll();
}
