import {FluidSimulator, FluidRenderer} from "./fluidSim.js";
import {scene_generators} from "./scenes.js";

var canvas = document.getElementById("canvas");
var over_relaxation = 1.0;  // parameter for SOR solver
var n_iter = 40;            // number of iteration for SOR solver
var res    = 100;           // number of pixel in a column
var h      = 1.0 / res;     // grid size

var nx = res * canvas.width / canvas.height;
var ny = res;

var density = 1000.0;
var dt      = 1.0/60.0;

var fluidsim      = new FluidSimulator(density, nx, ny, h, dt, n_iter, over_relaxation);
var fluidrenderer = new FluidRenderer(fluidsim, canvas);

var paused = false;
function loop() {
    if (!paused) fluidsim.simulate()
    fluidrenderer.draw();
    requestAnimationFrame(loop);
}

scene_generators[1](fluidsim);
loop();
