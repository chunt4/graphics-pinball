window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
}
function setupSquare() {

}
function setupCircle() {
    var increment = 0.1;
    for (var theta=0.0; theta < Math.PI*2; theta+=increment) {
        circleVertexPositionData.push(vec3(Math.cos(theta+increment), 0.0, Math.sin(theta+increment)));
        // circleVertexPositionData.push(vec4(Math.cos(theta+increment), 0.0, Math.sin(theta+increment), 1.0));
    }
}
function drawCircle() 
{

}
function drawSquare()
{

}
function drawAll()
{

}
function drawScore()
{

}
function render()
{
    requestAnimFrame(render);
}