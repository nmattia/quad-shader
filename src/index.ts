// This sets up the WebGL environment, compiles shaders, and creates a rectangle
// (square) spanning the whole canvas where the (fragment) shader's output is
// rendered.
//
// Only provides two uniforms: uTime (time in seconds since app start) and
// uAspectRatio (ratio width/height of the canvas element). For more uniforms, use
// the `uniformX` functions of `QuadShader`.
//
// NOTE: if the fragment shader uses uAspectRatio, it _must_ be the same precision
// as defined here, otherwise Firefox complains.

const vertShaderSrc = `
attribute vec2 aVertexPosition;

uniform mediump float uAspectRatio;
varying vec2 vPosition;

void main() {
    // gl_Position is the ouput, which we simply return
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);

    // We pre-scale the data passed to the fragment shader so that the
    // fragment shader doesn't have to care about the aspect ratio
    vPosition = gl_Position.xy * vec2(uAspectRatio, 1.0);
}
`;

/* The result of attaching the shader to a canvas */
export type Attached = {
  gl: WebGLRenderingContext;
  state: State;
};

// Input types for uniforms
type U1 = number;
type U2 = [number, number];
type U3 = [number, number, number];
type U4 = [number, number, number, number];
type Us = U1 | U2 | U3 | U4;

export class QuadShader {
  // When set to false, the rendering loop stops
  public shouldRender = false;

  // Uniform setters called on every render
  private uniformUpdaters: (() => void)[] = [];

  constructor(
    private gl: WebGLRenderingContext,
    public canvas: HTMLCanvasElement,
    public state: State,
  ) {}

  render() {
    if (!this.shouldRender) {
      return;
    }

    // Ask the browser to call us back soon
    requestAnimationFrame(() => this.render());

    resizeIfDimChanged(this.gl, this.state);

    this.uniformUpdaters.forEach((u) => u());

    this.drawQuad();
  }

  private drawQuad() {
    // Draw the data
    // NOTE: because our 4 vertices cover the entire canvas we don't even need to call
    // e.g. gl.clear() to clear, since every pixel will be rewritten (even if possibly
    // rewritten as black and/or transparent).
    this.gl.drawArrays(
      this.gl.TRIANGLE_STRIP /* draw triangles */,
      0 /* Start at 0 */,
      4 /* draw n vertices */,
    );
  }

  // Set a uniform. If the provided value is a function, it is evaluated before every render
  // and the returned value is set as a uniform.
  //
  // This is the generic version meant to be used by 'uniform[1234][if]`.
  uniformf<A extends Us>(
    glFunc: (a: WebGLUniformLocation | null, b: A) => void,
    name: string,
    val: A | (() => A),
  ) {
    const setUniform = (uVal: A) => {
      const uLoc = this.gl.getUniformLocation(this.state.program, name);
      glFunc(uLoc, uVal);
    };

    if (typeof val !== "function") {
      setUniform(val);
      return;
    }

    this.uniformUpdaters.push(() => setUniform(val()));
  }

  // See 'uniformf'.
  uniform1f(name: string, val: U1 | (() => U1)) {
    return this.uniformf((u, v) => this.gl.uniform1f(u, v), name, val);
  }

  uniform2f(name: string, val: U2 | (() => U2)) {
    return this.uniformf((u, v) => this.gl.uniform2f(u, v[0], v[1]), name, val);
  }

  uniform3f(name: string, val: U3 | (() => U3)) {
    return this.uniformf(
      (u, v) => this.gl.uniform3f(u, v[0], v[1], v[2]),
      name,
      val,
    );
  }

  uniform4f(name: string, val: U4 | (() => U4)) {
    return this.uniformf(
      (u, v) => this.gl.uniform4f(u, v[0], v[1], v[2], v[3]),
      name,
      val,
    );
  }

  uniform1i(name: string, val: U1 | (() => U1)) {
    return this.uniformf(this.gl.uniform1i, name, val);
  }

  uniform2i(name: string, val: U2 | (() => U2)) {
    return this.uniformf((u, v) => this.gl.uniform2i(u, v[0], v[1]), name, val);
  }

  uniform3i(name: string, val: U3 | (() => U3)) {
    return this.uniformf(
      (u, v) => this.gl.uniform3i(u, v[0], v[1], v[2]),
      name,
      val,
    );
  }

  uniform4i(name: string, val: U4 | (() => U4)) {
    return this.uniformf(
      (u, v) => this.gl.uniform4i(u, v[0], v[1], v[2], v[3]),
      name,
      val,
    );
  }
}

// Return a 'QuadShader' with following properties:
//  * The shader is only rendered when the underlying canvas intersects the viewport
//  * The uTime uniform is set to the time since page load in seconds
export function animate(
  canvas: HTMLCanvasElement,
  fragShaderSrc: string,
): QuadShader {
  const attached = attach(canvas, fragShaderSrc);
  const { state, gl } = attached;

  const quadShader = new QuadShader(gl, canvas, state);

  // Use an observer to start (resp. stop) the rendering loop whenver the canvas
  // enters (resp. exits) the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]; // we only observe a single element

      if (entry.isIntersecting) {
        quadShader.shouldRender = true;
        quadShader.render(); // kickstarts the rendering loop
      } else {
        quadShader.shouldRender = false;
      }
    },
    {
      /* by default, uses the viewport */
    },
  );

  observer.observe(canvas);

  quadShader.uniform1f("uTime", () => performance.now() / 1000);

  return quadShader;
}

// The main function that sets everything up and starts the animation loop
// NOTE: if the element is detached from the DOM, the rendering loop exits early
// and is not re-scheduled.
export function attach(
  canvas: HTMLCanvasElement,
  fragShaderSrc: string,
): Attached {
  // Get the WebGL context
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("Could not initialize WebGL");

  // Prepare the shaders. We pass in the shaders as strings, imported using Vite's
  // '?raw' import mechanism which creates a variable containing the content of a
  // file.
  // NOTE: this does not minify or obfuscate the shaders!
  const program = initializeProgram(gl, {
    vertex: vertShaderSrc,
    fragment: fragShaderSrc,
  });

  // Generate vertex data for a square covering the whole canvas using clip
  // coordinates.
  //
  // NOTE: later we instruct WebGL to draw two triangles using gl.TRIANGLE_STRIP.
  // This means that, for 4 vertices, vertices 0, 1 and 2 form one triangle, and then
  // vertices 1, 2 and 3 form a second triangle. By storing the vertices in a
  // (mirrored) Z-shape, the two triangles form a square (which we later render on).
  const [top, left, bottom, right] = [1, -1, -1, 1];
  const vertices = new Float32Array(
    /* prettier-ignore */ [
    right, top, /* top right corner, etc */
    left, top,
    right, bottom,
    left, bottom,
  ],
  );

  // Create a Vertex Buffer Object use to send vertex data (attributes) to the
  // shaders.
  const vbo = gl.createBuffer();
  if (!vbo) throw new Error("Could not create VBO");
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  // Load the data
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // location of 'aVertexPosition' in the shader program, used to pass in vertex data
  const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

  // With vertexAttribPointer we assign some meaning to the data bound to the VBO.
  //
  // We bind this to the vertex shader's 'aVertexPosition' attribute. There is a
  // pair (2) of floats for each vertex (that's what we wrote to the VBO) so we
  // specify '2' and gl.FLOAT such as WebGL knows to read two floats per vertex
  // (and assign that to 'aVertexPosition'.
  gl.vertexAttribPointer(
    aVertexPosition,
    2 /* vals per vertex, there are two values per vertex (X & Y) */,
    gl.FLOAT /* the values are floats (32bits) */,
    false /* do not normalize the values */,
    0 /* assume contiguous data & infer stride (2 * sizeof float)*/,
    0 /* start at offset = 0 */,
  );

  // Attributes are disabled by default, so we enable it
  gl.enableVertexAttribArray(aVertexPosition);

  const state: State = { program, canvas, width: 0, height: 0 };

  return { gl, state };
}

// Some data stored across frames, used in rendering to the canvas and potentially
// when resizing the canvas
type State = {
  // The canvas element to draw to
  canvas: HTMLCanvasElement;

  // The last known dimensions of the canvas, used to check if a resize is necessary
  width: number;
  height: number;

  // The compiled shaders
  program: WebGLProgram;
};

// Initialize a new shader program, by compiling the vertex & fragment shaders,
// linking them and looking up data location.
function initializeProgram(
  gl: WebGLRenderingContext,
  { vertex, fragment }: { vertex: string; fragment: string },
): WebGLProgram {
  // Compile both shaders
  const vertShader = loadShader(gl, gl.VERTEX_SHADER, vertex);
  const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragment);

  // Create a new program, attach the compiled shaders and link everything
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    throw new Error("could not create shader program");
  }

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    gl.deleteProgram(program);
    throw new Error(gl.getProgramInfoLog(program) ?? "could not link program");
  }

  // Tell WebGL which shader program we're about to setup & use (here and throughout
  // the rest of the app)
  gl.useProgram(program);

  return program;
}

// Upload the shader source (vertex or fragment) and compile the shader
function loadShader(
  gl: WebGLRenderingContext,
  ty: number /* gl.VERTEX_SHADER or gl.FRAGMENT_SHADER */,
  src: string /* the .glsl source */,
): WebGLShader {
  const shader = gl.createShader(ty);
  if (!shader) throw new Error("could not create shader");

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "could not compile shader");
  }

  return shader;
}

// Maintenance function to resize the canvas element if necessary.
//
// Returns `true` if dimensions changed; `false` otherwise.
function resizeIfDimChanged(gl: WebGLRenderingContext, state: State) {
  const clientWidth = state.canvas.clientWidth;
  const clientHeight = state.canvas.clientHeight;

  // First we check if the canvas' dimensions match what we have in the state, and if
  // so there's nothing else to do.
  if (clientWidth === state.width && clientHeight === state.height)
    return false;

  // If the canvas dimensions changed, record the new dimensions for the next time we
  // check
  state.width = clientWidth;
  state.height = clientHeight;

  // Figure out how many pixels need to actually be drawn (clientWidth & clientHeight
  // are in CSS pixels, here we're talking actual pixels)
  const pxWidth = clientWidth * window.devicePixelRatio;
  const pxHeight = clientHeight * window.devicePixelRatio;

  // NOTE: the CSS MUST bound the canvas size otherwise this will grow forever
  state.canvas.width = pxWidth;
  state.canvas.height = pxHeight;

  gl.viewport(0, 0, pxWidth, pxHeight);

  // Compute the aspect ratio, which is then injected into the vertex shader and used
  // to convert from normalized device coordinates (NDC, from (-1,-1) to (1,1)) to
  // coordinates that include the actual aspect ratio (in case the canvas is not
  // square).
  const aspectRatio = state.width / state.height;
  gl.uniform1f(
    gl.getUniformLocation(state.program, "uAspectRatio"),
    aspectRatio,
  );
}

// Parse an 'rgb(R, G, B)' (incl. alpha variations) string into numbers
// (r, g, b & a between 0 and 1).
//
// If the string cannot be parsed, returns [0,0,0,0].
export const parseRGBA = (color: string): [number, number, number, number] => {
  const m = color.match(
    /rgb(a?)\((?<r>\d+), (?<g>\d+), (?<b>\d+)(, (?<a>\d(.\d+)?))?\)/,
  );

  const rgb = m?.groups;

  if (!rgb) {
    return [0, 0, 0, 0];
  }

  return [
    Number(rgb.r) / 255,
    Number(rgb.g) / 255,
    Number(rgb.b) / 255,
    Number(rgb.a ?? 1),
  ];
};

// Read a style property with name 'propName' from element 'elem'. The property must be
// RGBA (see 'parseRGBA').
export const getComputedStylePropRGBA = (
  elem: HTMLElement,
  propName: string,
): [number, number, number, number] => {
  const computed = getComputedStyle(elem).getPropertyValue(propName);
  return parseRGBA(computed);
};
