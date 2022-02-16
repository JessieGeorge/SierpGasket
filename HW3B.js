"use strict";

var canvas;
var gl;

var vertices = [
    vec2( -1, -1 ),
    vec2(  0,  1 ),
    vec2(  1, -1 )
];

var positions = [];
var posStorage = []; // 2d array

var maxSubdivide = 8;
// start subdividing
var currentSubdivide = 0;
// show subdivides from original triangle already stored
var replaySubdivide = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );


    // Associate out shader variables with our data buffer

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    // original triangle
    triangle(vertices[0], vertices[1], vertices[2]);
    posStorage[0] = positions;
    render();
};

function triangle(a, b, c)
{
    positions.push(a, b, c);
}

function divideTriangle(a, b, c, count)
{

    // check for end of recursion

    if ( count === 0 ) {
        triangle(a, b, c);
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (currentSubdivide > maxSubdivide) {
        // reset to original triangle
        currentSubdivide = 0;
    }

    gl.bufferData( gl.ARRAY_BUFFER, flatten(posStorage[currentSubdivide]), gl.STATIC_DRAW );
    gl.drawArrays( gl.TRIANGLES, 0, posStorage[currentSubdivide].length );
}

function anim() {
    setTimeout(function () {
        gl.clear( gl.COLOR_BUFFER_BIT );

        if (replaySubdivide < posStorage.length) {
            gl.bufferData( gl.ARRAY_BUFFER, flatten(posStorage[replaySubdivide]), gl.STATIC_DRAW );
            gl.drawArrays( gl.TRIANGLES, 0, posStorage[replaySubdivide].length );
            replaySubdivide++;
            requestAnimationFrame(anim());
        } else {
            // reset to original triangle.
            replaySubdivide = 0;
            currentSubdivide = 0;
            render();
            return;
        }
    }, 1000); // display every second
}

document.onmousedown = click
function click(event) {
    if (event.button == 0) {
        // left click
        currentSubdivide++; // go to next subdivide only on left click
        if (currentSubdivide <= maxSubdivide) {
            if (posStorage.length != maxSubdivide + 1) {
                // you haven't stored everything yet.
                // maxSubdivide + 1 because posStorage also contains the original triangle.

                // compute a single subdivide and store it for step through.
                positions = [];
                divideTriangle( vertices[0], vertices[1], vertices[2], currentSubdivide);
                posStorage[currentSubdivide] = positions;
            }
        }
        render();
    } else {
        // middle or right click
        if (posStorage.length != maxSubdivide + 1) {
            // you haven't stored everything yet.
            // maxSubdivide + 1 because posStorage also contains the original triangle.

            for (let i = 1; i <= maxSubdivide; i++) {
                // compute all subdivides and store it for play through.
                positions = [];
                divideTriangle( vertices[0], vertices[1], vertices[2], i);
                posStorage[i] = positions;
            }
        }
        anim(); // animate all subdivides
    }
}

document.oncontextmenu = function(event) {
    event.preventDefault();
}
