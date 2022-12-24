import {FluidSimulator, FluidRenderer} from "./fluidSim.js";
import {scene_generators, sceneReset} from "./scenes.js";

var canvas = document.getElementById("canvas");
var over_relaxation = 1.9;  // parameter for SOR solver
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

var scene = 0;

var draw_option = {
    'dye'       : true,
    'obstacle'  : true,
    'streamline': true,
}

function setup(){
    sceneReset(fluidsim);
    scene_generators[scene](fluidsim);
    fluidrenderer.draw(draw_option);
}

function loop() {
    if (!paused){
        fluidsim.simulate()
        fluidrenderer.draw(draw_option);
    }
    requestAnimationFrame(loop);
}

var select_scene  = document.getElementById("select_scene");
var button_reset  = document.getElementById("button_reset");
var button_ppause = document.getElementById("button_toggle_play");
button_reset.onclick = setup;
button_toggle_play.onclick = () => {
    paused = !paused;
    button_toggle_play.innerHTML = paused ? "play" : "pause";
}
select_scene.onchange = () => {
    scene = parseInt(select_scene.value);
    setup();
}

setup();
loop();
