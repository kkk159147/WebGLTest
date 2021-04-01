var vertexShaderText = 
[
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec3 vertColor;',
'varying vec3 fragColor;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'',
'void main()',
'{',
'  fragColor = vertColor;',
'  gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',
'',
'varying vec3 fragColor;',
'void main()',
'{',
'  gl_FragColor = vec4(fragColor, 1.0);',
'}'
].join('\n');

var InitDemo = function () 
{
	console.log('This is working');

	var xPx = 0;
	var yPx = 0;

	var canvas = document.getElementById('glcanvas');
	var gl = canvas.getContext('glcanvas');

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	//
	// Create shaders
	// 
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		return;
	}

	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}
	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	//
	// Create buffer
	//
	var boxVertices = 
	[ // X, Y, Z           R, G, B
		// Top
		-1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
		-1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
		1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
		1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

		// Left
		-1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
		-1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
		-1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
		-1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

		// Right
		1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
		1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
		1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
		1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

		// Front
		1.0, 1.0, 1.0,    1.0, 0.0, 0.15,  //오른쪽으로 움직일때 x값만변하고 y값만 변함
		1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

		// Back
		1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
		1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

		// Bottom
		-1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
		-1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
		1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
		1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	];

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];
	
	var boxVertexBufferObject, boxIndexBufferObject;
	var positionAttribLocation, colorAttribLocation;
	var matWorldUniformLocation, matViewUniformLocation, matProjUniformLocation;
	var worldMatrix, viewMatrix, projMatrix;
	var xRotationMatrix, yRotationMatrix, transMatrix;
	var identityMatrix, scaleMatrix, saveScaleMatrix;

	createBox();

	function createBox()
	{
		boxVertexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);
	
		boxIndexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
	
		positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
		colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
		gl.vertexAttribPointer(
			positionAttribLocation, // Attribute location
			3, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE,
			6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			0 // Offset from the beginning of a single vertex to this attribute
		);
	
		gl.vertexAttribPointer(
			colorAttribLocation, // Attribute location
			3, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE,
			6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
		);
	
		gl.enableVertexAttribArray(positionAttribLocation);
		gl.enableVertexAttribArray(colorAttribLocation);
	
		// Tell OpenGL state machine which program should be active.
		gl.useProgram(program);
	
		matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
		matViewUniformLocation = gl.getUniformLocation(program, 'mView');
		matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
	
		worldMatrix = new Float32Array(16);
		viewMatrix = new Float32Array(16);
		projMatrix = new Float32Array(16);
		glMatrix.mat4.identity(worldMatrix);
		glMatrix.mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
		glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
		
	
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
		gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
		gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
	
		xRotationMatrix = new Float32Array(16);
		yRotationMatrix = new Float32Array(16);
		transMatrix = new Float32Array(16);
		scaleMatrix = new Float32Array(16);
		lastScaleMatrix = new Float32Array(16);
		//
		// Main render loop
		//
		identityMatrix = new Float32Array(16);
		glMatrix.mat4.identity(identityMatrix);
		glMatrix.mat4.identity(transMatrix);
		glMatrix.mat4.identity(scaleMatrix);
		gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
	}
	
	var xAngle = 0;
	var yAngle = 0;
	var rotateSpeed = 0.00025 * performance.now();

	var RotateObject = function () 
	{
		var copy = new Float32Array(16);
		glMatrix.mat4.copy(copy, worldMatrix);

		glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, xAngle, [0, -1, 0]);
		glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, yAngle, [1, 0, 0]);
		
		glMatrix.mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);

		worldMatrix[12] = copy[12];
		worldMatrix[13] = copy[13];

		canvasDraw(worldMatrix);
	};

	var ObjectMove = function (xPosition = 0, yPosition = 0)
    {
		
		xPosition = -(xPx - beforePosition[0]) / canvas.offsetWidth * 10;
		yPosition = -(yPx - beforePosition[1]) / canvas.offsetHeight * 6;

		// glMatrix.mat4.translate(transMatrix, identityMatrix, [-xPosition, -yPosition, 0]);
		worldMatrix[12] += xPosition;
		worldMatrix[13] += yPosition;

		beforePosition = [xPx, yPx];
		//  glMatrix.mat4.mul(worldMatrix, worldMatrix, transMatrix); //회전 x 위치

		canvasDraw(worldMatrix);
		
	};

	function canvasDraw(drawMatrix){
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, drawMatrix);

		gl.clearColor(0.75, 0.85, 0.8, 1.0); // - 배경색상 r,g,b,a (0~1)
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0); // (vertex, index)  buffer draw
	}

	
	function ScaleChange(scaleValue){
		glMatrix.mat4.scale(scaleMatrix, identityMatrix, [scaleValue, scaleValue, scaleValue]);

		glMatrix.mat4.mul(worldMatrix, worldMatrix, scaleMatrix);

		console.log(worldMatrix);

		canvasDraw(worldMatrix);
	}

	var scaleCount = 0;
	var mouseLeftDown = false;
	var mouseWheelDown = false;
	var yDown = false;
    var beforePosition = [0, 0];
	var x;
	var y;

	canvas.ondragstart = function() {
		return false;
	}

    function MouseUp(e)
    {
		if (e.button == 0) {
			mouseLeftDown = false;
		}else if(e.button == 1){
			mouseWheelDown = false;
		}
    }

	
    function MouseMove(e)
    {
		x = e.pageX;
		y = e.pageY;

		xPx = (e.pageX - (canvas.offsetWidth / 2));
		yPx  = (e.pageY - (canvas.offsetHeight / 2));

		if(mouseLeftDown && yDown) {
			var scaleValue = 1;
			if (beforePosition[0] - x > 0 && beforePosition[1] - y > 0) {
				scaleValue = 1.05;
				scaleCount++;
			}else if(beforePosition[0] - x < 0 && beforePosition[1] - y < 0){
				scaleValue = 0.95;
				scaleCount--;
			}else{
				scaleValue = 1;
			}
		
			ScaleChange(scaleValue);
			console.log(worldMatrix);
			beforePosition = [x, y];
		} 
		else if (mouseLeftDown) {
			if (beforePosition[0] - x > 0) {
				xAngle = xAngle + rotateSpeed;
			}else if(beforePosition[0] - x < 0){
				xAngle = xAngle - rotateSpeed;
			}

			if (beforePosition[1] - y > 0) {
				yAngle = yAngle + rotateSpeed;
			}else if(beforePosition[1] - y < 0){
				yAngle = yAngle - rotateSpeed;
			}
			
			requestAnimationFrame(RotateObject);
			beforePosition = [x, y];
        }
		else if(mouseWheelDown) {
			requestAnimationFrame(ObjectMove);
		}
		
    }

    function MouseDown(e)
    {
		beforePosition = [0, 0];
		if (e.button == 0) {
			mouseLeftDown = true;
		} else if(e.button == 1){
			xPx = (e.pageX - (canvas.offsetWidth / 2));
			yPx  = (e.pageY - (canvas.offsetHeight / 2));
			beforePosition = [xPx, yPx]
			mouseWheelDown = true;
		} 
    }

    canvas.addEventListener("mousedown", MouseDown, false);
    canvas.addEventListener("mousemove", MouseMove, false);
    canvas.addEventListener("mouseup", MouseUp, false);
	window.addEventListener('wheel', function(event){
		if (event.wheelDelta > 0 || event.detail < 0) {
			// scroll up
			ScaleChange(1.05);
			scaleCount++;
		}
		else {
			// scroll down
			ScaleChange(0.95);
			scaleCount--;
		}

		console.log(scaleCount);
	});

	window.addEventListener("keydown", function (event) {
		var MoveSpeed = 0.25;
		switch (event.keyCode) {
			// 89 = y, 82 = r, 37 = left, 38 = up, 39 = right, 40 = down
			case 89:
				yDown = !yDown;
				break;

			case 82:
				RotateObject();
				break;
			case 37:
				worldMatrix[12] += MoveSpeed;
				canvasDraw(worldMatrix);
				break;
			case 38:
				worldMatrix[13] += MoveSpeed;
				canvasDraw(worldMatrix);
				break;
			case 39:
				worldMatrix[12] -= MoveSpeed;
				canvasDraw(worldMatrix);
				break;
			case 40:
				worldMatrix[13] -= MoveSpeed;
				canvasDraw(worldMatrix);
				break;
			default:
				break;
		}
	
		
	})
};