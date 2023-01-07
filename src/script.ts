import {FluidSimulator, FluidRenderer, RenderOption} from "./fluidSim.js";
import {scene_generators, sceneReset} from "./scenes.js";

var canvas = document.getElementById("canvas") as HTMLCanvasElement;
var over_relaxation = 1.9;  // parameter for SOR solver
var n_iter = 40;            // number of iteration for SOR solver
var res    = 100;           // number of pixel in a column
var h      = 1.0 / res;     // grid size

var nx = res * canvas.width / canvas.height;
var ny = res;

var density = 1000.0;
var dt      = 1.0/60.0;

var fluidsim      = new FluidSimulator(density, nx, ny, h, dt, n_iter, over_relaxation, true);
var fluidrenderer = new FluidRenderer(fluidsim, canvas);

var paused = false;

var scene = 0;

var ro : RenderOption = {
    'show_dye'       : true,
    'show_obstacle'  : true,
    'show_streamline': true,
}

function setup(){
    sceneReset(fluidsim);
    scene_generators[scene](fluidsim);
    fluidrenderer.draw(ro);
}

function loop() {
    if (!paused){
        fluidsim.simulate()
        fluidrenderer.draw(ro);
    }
    requestAnimationFrame(loop);
}


var select_scene    = document.getElementById("select_scene") as HTMLSelectElement;
var button_reset    = document.getElementById("button_reset");
var button_ppause   = document.getElementById("button_toggle_play");
var cbox_streamline = document.getElementById("checkbox_streamline") as HTMLInputElement;
var cbox_dye        = document.getElementById("checkbox_dye") as HTMLInputElement;
var cbox_obstacle   = document.getElementById("checkbox_obstacle") as HTMLInputElement;
button_reset.onclick = setup;
button_ppause.onclick = () => {
    paused = !paused;
    button_ppause.innerHTML = paused ? "play" : "pause";
}
select_scene.onchange = () => {
    scene = parseInt(select_scene.value);
    setup();
}
cbox_streamline.onchange = () => { ro['show_streamline'] = cbox_streamline.checked; }
cbox_dye.onchange        = () => { ro['show_dye']        = cbox_dye.checked; }
cbox_obstacle.onchange   = () => { ro['show_obstacle']   = cbox_obstacle.checked; }


setup();
loop();
