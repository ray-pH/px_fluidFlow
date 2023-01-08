import {FluidSimulator, FluidRenderer, RenderOption} from "./fluidSim.js";
import {sceneReset, strScene_Opposing, strScene_WindTunnel, scene_set, scenefun, strScene_toFun} from "./scenes.js";

var canvas = document.getElementById("canvas") as HTMLCanvasElement;
var over_relaxation = 1.9;  // parameter for SOR solver
var n_iter = 40;            // number of iteration for SOR solver
var nx = 100;
var ny = 100;

var density = 1000.0;
var dt      = 1.0/60.0;

var fluidsim      = new FluidSimulator(density, nx, ny, dt, n_iter, over_relaxation, true);
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
    // scene_generators[scene](fluidsim);
    let strScene : string = strScene_WindTunnel;
    let scenef : scenefun = strScene_toFun(strScene);
    scene_set(fluidsim, scenef, ro);
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
var cbox_streamline = document.getElementById("cx_streamline") as HTMLInputElement;
var cbox_dye        = document.getElementById("cx_dye") as HTMLInputElement;
var cbox_obstacle   = document.getElementById("cx_obstacle") as HTMLInputElement;
button_reset.onclick = setup;
button_ppause.onclick = () => {
    paused = !paused;
    button_ppause.innerHTML = paused ? "play" : "pause";
}
select_scene.onchange = () => {
    scene = parseInt(select_scene.value);
    setup();
}

function setButtonShow(buttonId : string, containerId : string){
    let button     = document.getElementById(buttonId);
    let container  = document.getElementById(containerId);
    button.onclick = ()=>{
        let changeto   = (container.style.display == 'none') ? 'block' : 'none';
        button.innerHTML = (changeto == 'none') ? '∨' : '∧';
        container.style.display = changeto;
    };
}
setButtonShow("button_moreScene" , "container_sceneInput");
setButtonShow("button_moreRender", "container_renderOption");
setButtonShow("button_moreSimul" , "container_simulOption");


cbox_streamline.onchange = () => { ro['show_streamline'] = cbox_streamline.checked; }
cbox_dye.onchange        = () => { ro['show_dye']        = cbox_dye.checked; }
cbox_obstacle.onchange   = () => { ro['show_obstacle']   = cbox_obstacle.checked; }


setup();
loop();
