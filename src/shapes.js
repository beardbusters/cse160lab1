// file: src/shapes.js
// Defines Point, Triangle, Circle. Uses global WebGL vars: gl, a_Position, u_FragColor, u_Size.

class Square {
  constructor(position, color, size) {
    this.position = position;
    this.color = color;
    this.size = size;
    this.type = "square";
  }

  render() {
    // Critical: triangles/circles enable the attribute array; points use a constant attribute.
    gl.disableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);

    gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

function drawTriangle(vertices) {
  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create buffer");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}


class Triangle {
  constructor(position, color, size) {
    this.position = position; // [x,y]
    this.color = color;       // [r,g,b,a]
    this.size = size;         // pixels
    this.type = "triangle";
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    const d = this.size / 200.0; // 400px canvas => half is 200
    const x = this.position[0];
    const y = this.position[1];

    drawTriangle([
      x,     y + d,
      x - d, y - d,
      x + d, y - d,
    ]);
  }
}

class Circle {
  constructor(position, color, size, segments) {
    this.position = position; // [x,y]
    this.color = color;       // [r,g,b,a]
    this.size = size;         // pixels
    this.segments = segments; // int
    this.type = "circle";
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    const x = this.position[0];
    const y = this.position[1];
    const r = this.size / 200.0;
    const n = Math.max(3, this.segments | 0);

    const verts = [];
    for (let i = 0; i < n; i++) {
      const a1 = (i / n) * Math.PI * 2;
      const a2 = ((i + 1) / n) * Math.PI * 2;

      const x1 = x + Math.cos(a1) * r;
      const y1 = y + Math.sin(a1) * r;
      const x2 = x + Math.cos(a2) * r;
      const y2 = y + Math.sin(a2) * r;

      verts.push(x, y, x1, y1, x2, y2);
    }

    const buf = gl.createBuffer();
    if (!buf) {
      console.log("Failed to create buffer");
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n * 3);
  }
}


function drawVertsAsTriangles(verts) {
  const buf = gl.createBuffer();
  if (!buf) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
}

class Star {
  constructor(position, color, size, points) {
    this.position = position; // [x,y] clip space
    this.color = color;       // [r,g,b,a]
    this.size = size;         // pixels (outer radius-ish)
    this.points = points;     // int >= 3
    this.type = "star";
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    const cx = this.position[0];
    const cy = this.position[1];

    // Canvas is 400x400 in the assignment => half width is ~200
    const outerR = this.size / 200.0;
    const innerR = outerR * 0.45;

    const p = Math.max(3, this.points | 0);
    const n = p * 2; // alternating outer/inner vertices

    // Build alternating vertices around center
    const ring = [];
    const start = -Math.PI / 2; // point up
    for (let i = 0; i < n; i++) {
      const ang = start + (i / n) * Math.PI * 2;
      const r = (i % 2 === 0) ? outerR : innerR;
      ring.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }

    
    const verts = [];
    for (let i = 0; i < n; i++) {
      const v1 = ring[i];
      const v2 = ring[(i + 1) % n];
      verts.push(cx, cy, v1[0], v1[1], v2[0], v2[1]);
    }

    drawVertsAsTriangles(verts);
  }
}

