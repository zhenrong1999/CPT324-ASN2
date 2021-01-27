var canvas;
var gl;

var modelViewMatrixLoc = mat4();
var projectionMatrixLoc = mat4();
var modelViewMatrix = mat4(); //cube;
var modelViewMatrix2 = mat4(); //sphere;
var modelViewMatrix3 = mat4(); //pyramid
var projectionMatrix = mat4();

var left = -2.0;
var right = 5.0;
var itop = 3.0;
var bottom = -3.0;
var near = -20;
var far = 30;

var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var program;
var index = 0;
var normalsArray = [];
var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

//Cube
var cubeTexture; //variable to store texture of cube
var numVertices = 36;

//sphere
var numTimesToSubdivide = 6; //number of time of subdivision
var sphereScale = 3; // decide image bitmap scale
var sphereTexture; //variable to store texture of sphere
var rotationSpeed = 3; //Rotation speed for sphere

var ambientProduct; //lightAmbient*materialAmbient
var diffuseProduct; //lightDiffuse*materialDiffuse
var specularProduct; // lightSpecular*materialSpecular

var pyramidTexture;

var texCoord = [vec2(0, 0), vec2(0, 1), vec2(1, 1), vec2(1, 0)];

//Lighting and shading
var lightPosition = vec4(0.1, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.1, 1.0, 0.4, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 10.0;

var play = true;
var mode_change = 0;
var rotationMatrix = rotate(rotationSpeed, 0, 1, 1);
var rotation_animation = true;
var state = {
	dragging: false,
	mouse: {
		lastX: -1,
		lastY: -1,
	},
	app: {
		angle: {
			x: 0,
			y: 0,
		},
	},
	cubeShown: true,
	sphereShown: true,
	pyramidShown: true,
};
//Function for texture mapping for cube
function configureCubeTexture(image) {
	cubeTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + 0);
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	//upload image into texture;
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(
		gl.TEXTURE_2D,
		gl.TEXTURE_MIN_FILTER,
		gl.NEAREST_MIPMAP_LINEAR
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.uniform1i(gl.getUniformLocation(program, "cubeTexture"), 0);
}

function quad(a, b, c, d) {
	var t1 = subtract(vertices[b], vertices[a]);
	var t2 = subtract(vertices[c], vertices[a]);
	var normal = vec4(cross(t2, t1));
	normal = normalize(normal);

	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);

	pointsArray.push(vertices[a]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[0]);

	pointsArray.push(vertices[b]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[1]);

	pointsArray.push(vertices[c]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[2]);

	pointsArray.push(vertices[a]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[0]);

	pointsArray.push(vertices[c]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[2]);

	pointsArray.push(vertices[d]);
	colorsArray.push(vertexColors[a]);
	texCoordsArray.push(texCoord[3]);
}

function colorCube() {
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);
}

//Function to create triangle
function triangle(a, b, c) {
	var t1 = subtract(b, a);
	var t2 = subtract(c, a);
	var normal = vec4(normalize(cross(t2, t1)));

	normalsArray.push(normal);
	normalsArray.push(normal);
	normalsArray.push(normal);

	pointsArray.push(a);
	colorsArray.push(vertexColors[4]);
	texCoordsArray.push([
		(sphereScale * Math.acos(a[0])) / Math.PI,
		(sphereScale * Math.asin(a[1] / Math.sqrt(1.0 - a[0] * a[0]))) / Math.PI,
	]);

	pointsArray.push(b);
	colorsArray.push(vertexColors[4]);
	texCoordsArray.push([
		(sphereScale * Math.acos(b[0])) / Math.PI,
		(sphereScale * Math.asin(b[1] / Math.sqrt(1.0 - b[0] * b[0]))) / Math.PI,
	]);

	pointsArray.push(c);
	colorsArray.push(vertexColors[4]);
	texCoordsArray.push([
		(sphereScale * Math.acos(c[0])) / Math.PI,
		(sphereScale * Math.asin(c[1] / Math.sqrt(1.0 - c[0] * c[0]))) / Math.PI,
	]);

	index += 3;
}

//Function for triangle division
function divideTriangle(a, b, c, count) {
	if (count > 0) {
		var ab = mix(a, b, 0.5);
		var ac = mix(a, c, 0.5);
		var bc = mix(b, c, 0.5);

		ab = normalize(ab, true);
		ac = normalize(ac, true);
		bc = normalize(bc, true);

		divideTriangle(a, ab, ac, count - 1);
		divideTriangle(ab, b, bc, count - 1);
		divideTriangle(bc, c, ac, count - 1);
		divideTriangle(ab, bc, ac, count - 1);
	} else {
		triangle(a, b, c);
	}
}

function tetrahedron(a, b, c, d, n) {
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}

//Texture mapping fo sphere
function configureSphereTexture(image) {
	sphereTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + 1);
	gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(
		gl.TEXTURE_2D,
		gl.TEXTURE_MIN_FILTER,
		gl.NEAREST_MIPMAP_LINEAR
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.uniform1i(gl.getUniformLocation(program, "sphereTexture"), 1);
}

function configurePyramidTexture(image) {
	pyramidTexture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + 2);
	gl.bindTexture(gl.TEXTURE_2D, pyramidTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(
		gl.TEXTURE_2D,
		gl.TEXTURE_MIN_FILTER,
		gl.NEAREST_MIPMAP_LINEAR
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.uniform1i(gl.getUniformLocation(program, "pyramidTexture"), 2);
}

var vertices = [
	//cube
	vec4(-0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, 0.5, 0.5, 1.0),
	vec4(0.5, 0.5, 0.5, 1.0),
	vec4(0.5, -0.5, 0.5, 1.0),
	vec4(-0.5, -0.5, -0.5, 1.0),
	vec4(-0.5, 0.5, -0.5, 1.0),
	vec4(0.5, 0.5, -0.5, 1.0),
	vec4(0.5, -0.5, -0.5, 1.0),

	//sphere
	vec4(0.0, 0.0, -1.0, 1),
	vec4(0.0, 0.942809, 0.333333, 1),
	vec4(-0.816497, -0.471405, 0.333333, 1),
	vec4(0.816497, -0.471405, 0.333333, 1),

	//pyramid

	vec4(0.0, 0.0, -1.0, 1),
	vec4(0.0, 0.9428, 0.3333, 1),
	vec4(-0.8165, -0.4714, 0.3333, 1),
	vec4(0.8165, -0.4714, 0.3333, 1),
	//vec4(0.816497, -0.471405, -0.333333, 1),
];

var vertexColors = [
	vec4(0.0, 0.0, 0.0, 1.0), // black
	vec4(1.0, 0.0, 0.0, 1.0), // red
	vec4(1.0, 1.0, 0.0, 1.0), // yellow
	vec4(0.0, 1.0, 0.0, 1.0), // green
	vec4(0.0, 0.0, 1.0, 1.0), // blue
	vec4(1.0, 0.0, 1.0, 1.0), // magenta
	vec4(0.0, 1.0, 1.0, 1.0), // white
	vec4(0.0, 1.0, 1.0, 1.0), // cyan
];

var pyramid = {
	texCoord: [vec2(0, 0), vec2(0, 1), vec2(0.5, 1)],
	triangle: function (a, b, c, color) {
		var t1 = subtract(b, a);
		var t2 = subtract(c, a);
		var normal = vec4(cross(t2, t1));
		normal = normalize(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);
		normalsArray.push(normal);

		// add colors and vertices for one triangle
		colorsArray.push(vertexColors[color]);
		pointsArray.push(a);
		texCoordsArray.push(pyramid.texCoord[0]);
		colorsArray.push(vertexColors[color]);
		pointsArray.push(b);
		texCoordsArray.push(pyramid.texCoord[1]);
		colorsArray.push(vertexColors[color]);
		pointsArray.push(c);
		texCoordsArray.push(pyramid.texCoord[2]);
	},

	tetra: function (a, b, c, d) {
		// tetrahedron with each side using
		// a different color

		pyramid.triangle(a, c, b, 0);
		pyramid.triangle(a, c, d, 1);
		pyramid.triangle(a, b, d, 2);
		pyramid.triangle(b, c, d, 3);
	},

	divideTetra: function (a, b, c, d, count) {
		// check for end of recursion

		if (count === 0) {
			pyramid.tetra(a, b, c, d);
		}

		// find midpoints of sides
		// divide four smaller tetrahedra
		else {
			var ab = mix(a, b, 0.5);
			var ac = mix(a, c, 0.5);
			var ad = mix(a, d, 0.5);
			var bc = mix(b, c, 0.5);
			var bd = mix(b, d, 0.5);
			var cd = mix(c, d, 0.5);

			--count;

			pyramid.divideTetra(a, ab, ac, ad, count);
			pyramid.divideTetra(ab, b, bc, bd, count);
			pyramid.divideTetra(ac, bc, c, cd, count);
			pyramid.divideTetra(ad, bd, cd, d, count);
		}
	},
};

window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//generate cube vertices;
	colorCube();

	//generate sphere vertices;
	tetrahedron(
		vertices[8],
		vertices[9],
		vertices[10],
		vertices[11],
		numTimesToSubdivide
	);

	pyramid.tetra(vertices[12], vertices[13], vertices[14], vertices[15]);

	//  Load shaders and initialize attribute buffers

	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	ambientProduct = mult(lightAmbient, materialAmbient);
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);

	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

	var nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

	var vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vNormal);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

	var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
	gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);

	//Initialize the image for texture mapping
	var cubeImage = document.getElementById("cloth1");
	configureCubeTexture(cubeImage);
	var sphereImage = document.getElementById("metal1");
	configureSphereTexture(sphereImage);
	var pyramidImage = document.getElementById("wood1");
	configurePyramidTexture(pyramidImage);
	//Image for texture mapping
	var cubeImageChooser = document.getElementById("cubeImage");
	var sphereImageChooser = document.getElementById("sphereImage");
	var pyramidImageChooser = document.getElementById("pyramidImage");
	var options = ["cloth", "wood", "metal"];
	options.forEach(insertoption);
	function insertoption(item) {
		var maxNum = 1;
		if ("cloth" == item) maxNum = 6;
		else if (item == "wood") maxNum = 9;
		else if (item == "metal") maxNum = 3;
		for (var i = 1; i <= maxNum; i++) {
			var value = item + i;
			var option1 = document.createElement("option");
			var option2 = document.createElement("option");
			var option3 = document.createElement("option");
			option1.value = option2.value = option3.value = value;
			option1.text = option2.text = option3.text = value;
			cubeImageChooser.add(option1);
			sphereImageChooser.add(option2);
			pyramidImageChooser.add(option3);
		}
	}
	pyramidImageChooser.options[6].selected = true;
	sphereImageChooser.options[15].selected = true;
	document.getElementById("cubeImage").onchange = function () {
		var chooseid = cubeImageChooser.value;
		cubeImage = document.getElementById(chooseid);
		configureCubeTexture(cubeImage);
	};
	document.getElementById("sphereImage").onchange = function () {
		var chooseid = sphereImageChooser.value;
		sphereImage = document.getElementById(chooseid);
		configureSphereTexture(sphereImage);
	};
	document.getElementById("pyramidImage").onchange = function () {
		var chooseid = pyramidImageChooser.value;
		pyramidImage = document.getElementById(chooseid);
		configurePyramidTexture(pyramidImage);
	};
	//Function to get the material shininess
	function change_materialShininess() {
		materialShininess = document.getElementById("materialshininess").value;
		gl.uniform1f(
			gl.getUniformLocation(program, "shininess"),
			materialShininess
		);
	}

	//Function to get the light position
	function change_lightPositions() {
		var x = document.getElementById("lightpositions").value;
		lightPosition = vec4(x, 1.0, 1.0, 0.0);
		gl.uniform4fv(
			gl.getUniformLocation(program, "lightPosition"),
			flatten(lightPosition)
		);
	}

	//Function to get the ambient light
	function change_ambientLight() {
		var x = document.getElementById("ambientLight").value;
		lightAmbient = vec4(x, 0.1, 0.1, 1.0);
		ambientProduct = mult(lightAmbient, materialAmbient);
		gl.uniform4fv(
			gl.getUniformLocation(program, "ambientProduct"),
			flatten(ambientProduct)
		);
	}

	//Function to get the diffuse light
	function change_diffuseLight() {
		var x = document.getElementById("diffuseLight").value;
		lightDiffuse = vec4(x, x, 0.1, 1.0);
		diffuseProduct = mult(lightDiffuse, materialDiffuse);
		gl.uniform4fv(
			gl.getUniformLocation(program, "diffuseProduct"),
			flatten(diffuseProduct)
		);
	}

	//Function to get the specular light
	function change_specularProduct() {
		var x = document.getElementById("specularLight").value;
		lightSpecular = vec4(x, x, 0.1, 1.0);
		specularProduct = mult(lightSpecular, materialSpecular);
		gl.uniform4fv(
			gl.getUniformLocation(program, "specularProduct"),
			flatten(specularProduct)
		);
	}

	function change_rotation() {
		rotationSpeed = document.getElementById("rotaionSpeedValue").value;
		rotationX = document.getElementById("RotateX").value;
		rotationY = document.getElementById("RotateY").value;
		rotationZ = document.getElementById("RotateZ").value;
		rotationMatrix = rotate(rotationSpeed, rotationX, rotationY, rotationZ);
		if (
			(rotationX == 0 && rotationY == 0 && rotationZ == 0) ||
			rotationSpeed == 0
		) {
			rotation_animation = false;
			document.getElementById("rotationanimation_enabled").checked = false;
		} else {
			rotation_animation = true;
			document.getElementById("rotationanimation_enabled").checked = true;
		}
	}

	function change_Projection() {
		left = Number(document.getElementById("leftProjection").value);
		right = Number(document.getElementById("rightProjection").value);
		itop = Number(document.getElementById("topProjection").value);
		bottom = Number(document.getElementById("bottomProjection").value);
		near = Number(document.getElementById("nearProjection").value);
		far = Number(document.getElementById("farProjection").value);
		projectionMatrix = ortho(left, right, bottom, itop, near, far);
	}

	document.getElementById(
		"materialshininess"
	).onchange = change_materialShininess;
	document.getElementById("MShininess").onchange = change_materialShininess;
	document.getElementById("lightpositions").onchange = change_lightPositions;
	document.getElementById("LPosition").onchange = change_lightPositions;
	document.getElementById("ambientLight").onchange = change_ambientLight;
	document.getElementById("LAmbient").onchange = change_ambientLight;
	document.getElementById("diffuseLight").onchange = change_diffuseLight;
	document.getElementById("LDiffuse").onchange = change_diffuseLight;
	document.getElementById("specularLight").onchange = change_specularProduct;
	document.getElementById("LSpecular").onchange = change_specularProduct;
	document.getElementById("rotationSpeedSlider").onchange = change_rotation;
	document.getElementById("rotaionSpeedValue").onchange = change_rotation;
	document.getElementById("RotateX").onchange = change_rotation;
	document.getElementById("RotateY").onchange = change_rotation;
	document.getElementById("RotateZ").onchange = change_rotation;
	document.getElementById("leftProjection").onchange = change_Projection;
	document.getElementById("rightProjection").onchange = change_Projection;
	document.getElementById("topProjection").onchange = change_Projection;
	document.getElementById("bottomProjection").onchange = change_Projection;
	document.getElementById("nearProjection").onchange = change_Projection;
	document.getElementById("farProjection").onchange = change_Projection;

	document.getElementById("rotationanimation_enabled").onchange = function () {
		rotation_animation = !rotation_animation;
	};
	document.getElementById("sphereShown").onchange = function () {
		state.sphereShown = !state.sphereShown;
	};
	document.getElementById("pyramidShown").onchange = function () {
		state.pyramidShown = !state.pyramidShown;
	};
	document.getElementById("cubeShown").onchange = function () {
		state.cubeShown = !state.cubeShown;
	};

	document.getElementById("projection_button").onclick = function () {
		document.getElementById(
			"projection_settings"
		).hidden = !document.getElementById("projection_settings").hidden;
	};
	document.getElementById("visibility_button").onclick = function () {
		document.getElementById("visibility").hidden = !document.getElementById(
			"visibility"
		).hidden;
	};
	document.getElementById("Texture_Shader_button").onclick = function () {
		document.getElementById(
			"Texture_Shader_settings"
		).hidden = !document.getElementById("Texture_Shader_settings").hidden;
	};

	document.getElementById("TextureShown").onchange = function () {
		if (document.getElementById("TextureShown").checked) mode_change -= 20;
		else mode_change += 20;
	};

	document.getElementById("ShaderShown").onchange = function () {
		if (document.getElementById("ShaderShown").checked) mode_change -= 10;
		else mode_change += 10;
	};
	document.getElementById("play_button").onclick = function () {
		if (play) document.getElementById("play_button").innerHTML = "Play";
		else {
			document.getElementById("play_button").innerHTML = "Pause";
			window.requestAnimFrame(render);
		}
		play = !play;
	};

	gl.uniform4fv(
		gl.getUniformLocation(program, "ambientProduct"),
		flatten(ambientProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "diffuseProduct"),
		flatten(diffuseProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "specularProduct"),
		flatten(specularProduct)
	);
	gl.uniform4fv(
		gl.getUniformLocation(program, "lightPosition"),
		flatten(lightPosition)
	);
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
	projectionMatrix = ortho(left, right, bottom, itop, near, far);
	window.requestAnimFrame(render);

	canvas.onmousedown = function (event) {
		var x = event.clientX;
		var y = event.clientY;
		var rect = event.target.getBoundingClientRect();
		if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
			state.mouse.lastX = x;
			state.mouse.lastY = y;
			state.dragging = true;
		}
	};
	canvas.onmouseup = function () {
		state.dragging = false;
	};
	canvas.onmousemove = function (event) {
		var x = event.clientX;
		var y = event.clientY;
		if (state.dragging) {
			var factor = 50 / canvas.height;
			var dx = factor * (x - state.mouse.lastX);
			var dy = factor * (y - state.mouse.lastY);

			state.app.angle.x = state.app.angle.x + dy;
			state.app.angle.y = state.app.angle.y + dx;
		}
		state.mouse.lastX = x;
		state.mouse.lastY = y;
	};
};

var past = 0;
function value_updated_to_page(delta_Time) {
	document.getElementById("delta_time").innerHTML = delta_Time.toFixed(6) + "s";
	var fps = 1 / delta_Time;
	document.getElementById("fps").innerHTML = fps.toFixed(2);
}

var render = function (timestamp) {
	timestamp *= 0.001;
	elapsed = timestamp - past;
	past = timestamp;
	if (elapsed > 0) value_updated_to_page(elapsed);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	projectionMatrix = ortho(left, right, bottom, itop, near, far);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	if (state.cubeShown) {
		//draw cube, 36 points;
		gl.uniform1i(gl.getUniformLocation(program, "texMode"), mode_change + 0);
		if (rotation_animation) {
			modelViewMatrix = mult(rotationMatrix, modelViewMatrix);
		}
		modelViewMatrix = mult(rotateX(state.app.angle.x), modelViewMatrix);
		modelViewMatrix = mult(rotateY(state.app.angle.y), modelViewMatrix);
		modelViewMatrix = mult(translate(2.5, 0, 0), modelViewMatrix);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
		gl.drawArrays(gl.TRIANGLES, 0, 36);
		modelViewMatrix = mult(translate(-2.5, 0, 0), modelViewMatrix);
	}
	// draw sphere, depends on the number of iterations
	if (state.sphereShown) {
		gl.uniform1i(gl.getUniformLocation(program, "texMode"), mode_change + 1);
		if (rotation_animation) {
			modelViewMatrix2 = mult(rotationMatrix, modelViewMatrix2);
		}
		modelViewMatrix2 = mult(rotateX(state.app.angle.x), modelViewMatrix2);
		modelViewMatrix2 = mult(rotateY(state.app.angle.y), modelViewMatrix2);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix2));
		for (var i = numVertices; i < index + numVertices; i += 3) {
			gl.drawArrays(gl.TRIANGLES, i, 3);
		}
	}
	if (state.pyramidShown) {
		gl.uniform1i(gl.getUniformLocation(program, "texMode"), mode_change + 2);
		if (rotation_animation) {
			modelViewMatrix3 = mult(rotationMatrix, modelViewMatrix3);
		}
		modelViewMatrix3 = mult(rotateX(state.app.angle.x), modelViewMatrix3);
		modelViewMatrix3 = mult(rotateY(state.app.angle.y), modelViewMatrix3);
		modelViewMatrix3 = mult(translate(1.5, 1.5, 0), modelViewMatrix3);
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix3));
		gl.drawArrays(gl.TRIANGLES, index + numVertices, pointsArray.length);
		modelViewMatrix3 = mult(translate(-1.5, -1.5, 0), modelViewMatrix3);
	}
	if (state.app.angle.x > -1 && state.app.angle.x < 1) {
		state.app.angle.x = 0;
	} else if (state.app.angle.x > 0) {
		state.app.angle.x -= 1;
	} else if (state.app.angle.x < 0) {
		state.app.angle.x += 1;
	}
	if (state.app.angle.y > -1 && state.app.angle.y < 1) {
		state.app.angle.y = 0;
	} else if (state.app.angle.y > 0) {
		state.app.angle.y -= 1;
	} else if (state.app.angle.y < 0) {
		state.app.angle.y += 1;
	}
	if (play) window.requestAnimFrame(render);
};
