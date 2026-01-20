// file: src/ModifiedColoredPoints.js
// modified from the original given by the textbook to meet the 
// assignment specs
// Florian Horn Sanders
// fhornsan@ucsc.edu
// cse160 winter 2026 asgn1

// WebGL globals (used by shape classes)
let canvas = null;
/** @type {WebGLRenderingContext|null} */
let gl = null;

let a_Position = -1;
/** @type {WebGLUniformLocation|null} */
let u_FragColor = null;
/** @type {WebGLUniformLocation|null} */
let u_Size = null;


const shapesList = [];
const pictureTriangles = []; 


// Current UI brush settings
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10.0;
let g_selectedSegments = 12;
let g_selectedType = "square"; // "square" | "triangle" | "circle" | "star"

const VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "uniform float u_Size;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  gl_PointSize = u_Size;\n" +
  "}\n";

const FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" +
  "void main() {\n" +
  "  gl_FragColor = u_FragColor;\n" +
  "}\n";

function setupWebGL() {
  canvas = document.getElementById("webgl");
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    // Fallback to CUON helper if needed
    gl = getWebGLContext(canvas);
  }
  if (!gl) {
    console.log("Failed to get WebGL context");
    return false;
  }

  return true;
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get a_Position");
    return false;
  }

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get u_FragColor");
    return false;
  }

  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get u_Size");
    return false;
  }

  return true;
}

function convertCoordinatesEventToGL(ev) {
  const rect = ev.target.getBoundingClientRect();

  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return { x, y };
}

function pctToFloat01(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n / 100));
}

function setupUI() {
  const rEl = document.getElementById("redSlide");
  const gEl = document.getElementById("greenSlide");
  const bEl = document.getElementById("blueSlide");
  const sizeEl = document.getElementById("sizeSlide");
  const segEl = document.getElementById("segSlide");

  const rVal = document.getElementById("redVal");
  const gVal = document.getElementById("greenVal");
  const bVal = document.getElementById("blueVal");
  const sizeVal = document.getElementById("sizeVal");
  const segVal = document.getElementById("segVal");

  const clearBtn = document.getElementById("clearBtn");
  const pointBtn = document.getElementById("pointBtn");
  const triangleBtn = document.getElementById("triangleBtn");
  const circleBtn = document.getElementById("circleBtn");
  const starBtn = document.getElementById("starBtn");

  function sync() {
    g_selectedColor = [
      pctToFloat01(rEl.value),
      pctToFloat01(gEl.value),
      pctToFloat01(bEl.value),
      1.0,
    ];
    g_selectedSize = Number(sizeEl.value);
    g_selectedSegments = Number(segEl.value) | 0;

    if (rVal) rVal.textContent = rEl.value;
    if (gVal) gVal.textContent = gEl.value;
    if (bVal) bVal.textContent = bEl.value;
    if (sizeVal) sizeVal.textContent = sizeEl.value;
    if (segVal) segVal.textContent = segEl.value;
  }

  rEl.oninput = sync;
  gEl.oninput = sync;
  bEl.oninput = sync;
  sizeEl.oninput = sync;
  segEl.oninput = sync;

  // clear button
  if (clearBtn) {
    clearBtn.onclick = () => {
      shapesList.length = 0;
      pictureTriangles.length = 0;  // the cat face triangles
      renderAllShapes();
    };
  }

  // for drawing triangle example 
  const drawPicBtn = document.getElementById("drawPicBtn");
  if (drawPicBtn) {
    drawPicBtn.onclick = () => {
      addCatFacePicture();
      renderAllShapes();
    };
  }

  if (pointBtn) pointBtn.onclick = () => { g_selectedType = "square"; };
  if (triangleBtn) triangleBtn.onclick = () => { g_selectedType = "triangle"; };
  if (circleBtn) circleBtn.onclick = () => { g_selectedType = "circle"; };
  if (starBtn) starBtn.onclick = () => { g_selectedType = "star"; };
  sync();
}

/*function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (const shape of shapesList) shape.render();
}*/
// render version for drawing picture from triangles question
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // draw user-painted shapes
  for (const shape of shapesList) shape.render();
  // draw the picture triangles (so it "stays")
  for (const t of pictureTriangles) {
    drawColoredTriangle(t.verts, t.color);
  }
}

function handleClicks(ev) {
  const { x, y } = convertCoordinatesEventToGL(ev);
  const pos = [x, y];
  const col = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0];
  if (g_selectedType === "square") {
    shapesList.push(new Square(pos, col, g_selectedSize));
  } else if (g_selectedType === "triangle") {
    shapesList.push(new Triangle(pos, col, g_selectedSize));
  } else if (g_selectedType === "circle") {
    shapesList.push(new Circle(pos, col, g_selectedSize, g_selectedSegments));
  } else if (g_selectedType === "star") {
    shapesList.push(new Star(pos, col, g_selectedSize, g_selectedSegments));
  }
  renderAllShapes();
}
function click(ev) {
  handleClicks(ev);
}



// triangle drawing question 
function drawColoredTriangle(verts, color) {
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

  const buf = gl.createBuffer();
  if (!buf) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function tri(x1, y1, x2, y2, x3, y3, r, g, b, a = 1.0) {
  pictureTriangles.push({
    verts: [x1, y1, x2, y2, x3, y3],
    color: [r, g, b, a],
  });
}

function addCatFacePicture() {
  pictureTriangles.length = 0;

  const OUT = [0.05, 0.05, 0.05, 1.0]; // near-black outline fill
  const FACE = [0.75, 0.78, 0.85, 1.0]; // light gray-blue
  const EYE = [0.90, 0.95, 1.00, 1.0];  // eye white
  const PUP = [0.05, 0.05, 0.05, 1.0];  // pupil
  const NOSE = [0.95, 0.55, 0.65, 1.0]; // pink
  const TOOTH = [0.95, 0.95, 0.95, 1.0];

  // draw the cat face
  // big ear outer (1)
  tri(-0.75, 0.55, -0.45, 0.55, -0.60, 0.88, ...FACE);
  // inner ear (2)
  tri(-0.68, 0.58, -0.52, 0.58, -0.60, 0.74, ...OUT);
  // left base (3)
  tri(-0.86, 0.42, -0.62, 0.42, -0.75, 0.55, ...FACE);
  // right base (4)
  tri(-0.58, 0.42, -0.34, 0.42, -0.45, 0.55, ...FACE);

  tri(0.45, 0.55, 0.75, 0.55, 0.60, 0.88, ...FACE);      // (5)
  tri(0.52, 0.58, 0.68, 0.58, 0.60, 0.74, ...OUT);        // (6)
  tri(0.62, 0.42, 0.86, 0.42, 0.75, 0.55, ...FACE);       // (7)
  tri(0.34, 0.42, 0.58, 0.42, 0.45, 0.55, ...FACE);       // (8)

  tri(-0.55, 0.10, -0.25, 0.10, -0.40, 0.32, ...EYE);      // (9) eye top
  tri(-0.58, -0.08, -0.40, 0.10, -0.70, 0.10, ...EYE);     // (12) eye left
  tri(-0.22, -0.08, -0.10, 0.10, -0.40, 0.10, ...EYE);     // (13) eye right
  // pupil (small dark)
  tri(-0.43, 0.07, -0.37, 0.07, -0.40, 0.16, ...PUP);

  tri(0.25, 0.10, 0.55, 0.10, 0.40, 0.32, ...EYE);         // (14)
  tri(0.10, 0.10, 0.40, 0.10, 0.22, -0.08, ...EYE);        // (15)
  tri(0.40, 0.10, 0.70, 0.10, 0.58, -0.08, ...EYE);        // (16)
  // pupil
  tri(0.37, 0.07, 0.43, 0.07, 0.40, 0.16, ...PUP);
  tri(-0.06, -0.05, 0.06, -0.05, 0.0, -0.16, ...NOSE);
  tri(-0.35, -0.10, 0.0, -0.16, -0.55, -0.32, ...FACE);
  tri(0.35, -0.10, 0.55, -0.32, 0.0, -0.16, ...FACE);

  // left tiny
  tri(-0.42, -0.52, -0.30, -0.52, -0.36, -0.40, ...TOOTH); // (17)
  tri(-0.30, -0.52, -0.18, -0.52, -0.24, -0.40, ...TOOTH); // (18)
  // center tiny
  tri(-0.12, -0.52, 0.00, -0.52, -0.06, -0.40, ...TOOTH);  // (19)
  tri(0.06, -0.52, 0.18, -0.52, 0.12, -0.40, ...TOOTH);    // (20)
  // right tiny
  tri(0.24, -0.52, 0.36, -0.52, 0.30, -0.40, ...TOOTH);    // (21)

  tri(-0.65, -0.30, 0.65, -0.30, 0.0, -0.75, ...FACE);
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;
  setupUI();
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // click to draw
  canvas.onmousedown = click;
  // Sdrag-to-draw
  canvas.onmousemove = (ev) => {
    if (ev.buttons === 1) click(ev);
  };
}
