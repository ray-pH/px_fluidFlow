import {FluidSimulator, FluidRenderer, RenderOption} from "./fluidSim.js";
import {strScene_Opposing, strScene_WindTunnel, scene_set, scenefun, strScene_toFun} from "./scenes.js";

var canvas = document.getElementById("canvas") as HTMLCanvasElement;
var over_relaxation = 1.9;  // parameter for SOR solver
var n_iter = 40;            // number of iteration for SOR solver
var nx = 100;
var ny = 100;

var density = 1000.0;
var dt      = 1.0/60.0;

var fluidsim      = new FluidSimulator(density, nx, ny, dt, n_iter, over_relaxation, true);
var fluidrenderer = new FluidRenderer(fluidsim, canvas);


var lastValid_strScene : string = "";
var paused = false;
var scene = 0;

var ro : RenderOption = {
    'show_dye'       : true,
    'show_obstacle'  : true,
    'show_streamline': true,
}

function setup(){
    let containerIds = ["container_sceneInput", "container_renderOption", "container_simulOption"]
    containerIds.forEach((id : string) => { document.getElementById(id).style.display = 'none'; })

    let initScene = strScene_WindTunnel;
    lastValid_strScene = initScene;
    scene_set(fluidsim, strScene_toFun(initScene), ro);
    textarea_scene.value = initScene;
    fluidrenderer.draw(ro);
}

function loop() {
    if (!paused){
        fluidsim.simulate()
        fluidrenderer.draw(ro);
    }
    requestAnimationFrame(loop);
}


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

var textarea_scene : HTMLTextAreaElement = document.getElementById("textarea_scene") as HTMLTextAreaElement;
var container_sceneInput = document.getElementById("container_sceneInput");
var span_errorScene = document.getElementById("span_errorScene");
var button_applyScene = document.getElementById("button_applyScene");
button_applyScene.onclick = () => {
    let s = textarea_scene.value;
    let f : scenefun = strScene_toFun(s);

    let msg : string = ""; 
    let bgcolor : string = "#D6D6D6";
    try {
        scene_set(fluidsim, f, ro);
        fluidrenderer.draw(ro);
    } catch(e){
        msg = e.toString();
        bgcolor = "#D63333"
    }

    if (msg == "") lastValid_strScene = s;
    container_sceneInput.style.backgroundColor = bgcolor;
    span_errorScene.innerHTML = msg;
}

var strScenes = [strScene_WindTunnel, strScene_Opposing];
var select_scene    = document.getElementById("select_scene") as HTMLSelectElement;
select_scene.onchange = () => {
    scene = parseInt(select_scene.value);
    let strScene = strScenes[scene];
    lastValid_strScene = strScene;
    textarea_scene.value = strScene;
    let f : scenefun = strScene_toFun(strScene);
    scene_set(fluidsim, f, ro);
    fluidrenderer.draw(ro);
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
