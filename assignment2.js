var canvas;
var gl;
var start = true;

var modelViewMatrixLoc = mat4();
var projectionMatrixLoc = mat4();
var modelViewMatrix = mat4(); //cube;
var modelViewMatrix2 = mat4(); //sphere;
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
var numTimesToSubdivide = 4; //number of time of subdivision
var sphereScale = 3; // decide image bitmap scale
var sphereTexture; //variable to store texture of sphere
var rotationSpeed = 3; //Rotation speed for sphere

var ambientProduct; //lightAmbient*materialAmbient
var diffuseProduct; //lightDiffuse*materialDiffuse
var specularProduct; // lightSpecular*materialSpecular

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

var rotationMatrix = rotate(rotationSpeed, 0, 1, 1);
var rotation_animation = true;
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
	//var normal = cross(t2, t1);
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
	var sphereImage = document.getElementById("cloth1");
	configureSphereTexture(sphereImage);

	//Image for texture mapping
	var cubeImageChooser = document.getElementById("cubeImage");
	var sphereImageChooser = document.getElementById("sphereImage");
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
			option1.value = option2.value = value;
			option1.text = option2.text = value;
			cubeImageChooser.add(option1);
			sphereImageChooser.add(option2);
		}
	}

	document.getElementById("cubeImage").onchange = function () {
		var chooseid = document.getElementById("cubeImage").value;
		cubeImage = document.getElementById(chooseid);
		configureCubeTexture(cubeImage);
	};
	document.getElementById("sphereImage").onchange = function () {
		var chooseid = document.getElementById("sphereImage").value;
		sphereImage = document.getElementById(chooseid);
		configureSphereTexture(sphereImage);
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
		lightAmbient = vec4(x, x, 0.1, 1.0);
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
		)
			rotation_animation = false;
		else rotation_animation = true;
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
};

var past = 0;
function value_updated_to_page(delta_Time) {
	document.getElementById("delta_time").innerHTML = delta_Time;
	var fps = Math.round((1 / delta_Time) * 100) / 100;

	document.getElementById("fps").innerHTML = fps;
}

var render = function (timestamp) {
	timestamp *= 0.001;
	elapsed = timestamp - past;
	past = timestamp;
	if (elapsed > 0) value_updated_to_page(elapsed);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	projectionMatrix = ortho(left, right, bottom, itop, near, far);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

	//draw cube, 36 points;
	if (start) {
		modelViewMatrix = mult(rotationMatrix, modelViewMatrix);
		modelViewMatrix = mult(translate(2.5, 0, 0), modelViewMatrix);
		start = false;
	} else {
		modelViewMatrix = mult(translate(-2.5, 0, 0), modelViewMatrix);
		if (rotation_animation) {
			modelViewMatrix = mult(rotationMatrix, modelViewMatrix);
		}
		modelViewMatrix = mult(translate(2.5, 0, 0), modelViewMatrix);
	}
	gl.uniform1i(gl.getUniformLocation(program, "texMode"), 0);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	gl.drawArrays(gl.TRIANGLES, 0, 36);

	// draw sphere, depends on the number of iterations
	gl.uniform1i(gl.getUniformLocation(program, "texMode"), 1);
	if (rotation_animation) {
		modelViewMatrix2 = mult(rotationMatrix, modelViewMatrix2);
	}
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix2));
	//console.log(pointsArray.length);
	for (var i = numVertices; i < index + numVertices; i += 3) {
		gl.drawArrays(gl.TRIANGLES, i, 3);
	}
	window.requestAnimFrame(render);
};
