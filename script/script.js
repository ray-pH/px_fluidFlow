import { FluidSimulator, FluidRenderer } from "./fluidSim.js";
import { strScene_Opposing, strScene_WindTunnel, scene_set, strScene_toFun } from "./scenes.js";
var canvas = document.getElementById("canvas");
var lastValid_strScene = "";
var paused = false;
var scene = 0;
var so = {
    n_grid: 100,
    dt: 0.016,
    n_iter: 40,
};
var ro = {
    'show_dye': true,
    'show_obstacle': true,
    'show_streamline': true,
};
var fluidsim;
var fluidrenderer;
function initSystem() {
    fluidsim = new FluidSimulator(so.n_grid, so.n_grid, so.dt, so.n_iter);
    fluidrenderer = new FluidRenderer(fluidsim, canvas);
}
function setup() {
    initSystem();
    let containerIds = ["container_sceneInput", "container_renderOption", "container_simulOption"];
    containerIds.forEach((id) => { document.getElementById(id).style.display = 'none'; });
    let initScene = strScene_WindTunnel;
    lastValid_strScene = initScene;
    scene_set(fluidsim, strScene_toFun(initScene), ro);
    textarea_scene.value = initScene;
    fluidrenderer.draw(ro);
}
function loop() {
    if (!paused) {
        fluidsim.simulate();
        fluidrenderer.draw(ro);
    }
    requestAnimationFrame(loop);
}
var button_reset = document.getElementById("button_reset");
button_reset.onclick = () => {
    let f = strScene_toFun(lastValid_strScene);
    scene_set(fluidsim, f, ro);
    fluidrenderer.draw(ro);
};
var button_ppause = document.getElementById("button_toggle_play");
button_ppause.onclick = () => {
    paused = !paused;
    button_ppause.innerHTML = paused ? "play" : "pause";
};
var textarea_scene = document.getElementById("textarea_scene");
var container_sceneInput = document.getElementById("container_sceneInput");
var span_errorScene = document.getElementById("span_errorScene");
var button_applyScene = document.getElementById("button_applyScene");
button_applyScene.onclick = () => {
    let s = textarea_scene.value;
    let f = strScene_toFun(s);
    let msg = "";
    let bgcolor = "#D6D6D6";
    try {
        scene_set(fluidsim, f, ro);
        fluidrenderer.draw(ro);
    }
    catch (e) {
        msg = e.toString();
        bgcolor = "#D63333";
    }
    if (msg == "")
        lastValid_strScene = s;
    container_sceneInput.style.backgroundColor = bgcolor;
    span_errorScene.innerHTML = msg;
};
var strScenes = [strScene_WindTunnel, strScene_Opposing];
var select_scene = document.getElementById("select_scene");
select_scene.onchange = () => {
    scene = parseInt(select_scene.value);
    let strScene = strScenes[scene];
    lastValid_strScene = strScene;
    textarea_scene.value = strScene;
    let f = strScene_toFun(strScene);
    scene_set(fluidsim, f, ro);
    fluidrenderer.draw(ro);
};
function setButtonShow(buttonId, containerId) {
    let button = document.getElementById(buttonId);
    let container = document.getElementById(containerId);
    button.onclick = () => {
        let changeto = (container.style.display == 'none') ? 'block' : 'none';
        button.innerHTML = (changeto == 'none') ? '∨' : '∧';
        container.style.display = changeto;
    };
}
setButtonShow("button_moreScene", "container_sceneInput");
setButtonShow("button_moreRender", "container_renderOption");
setButtonShow("button_moreSimul", "container_simulOption");
var cbox_streamline = document.getElementById("cx_streamline");
var cbox_dye = document.getElementById("cx_dye");
var cbox_obstacle = document.getElementById("cx_obstacle");
cbox_streamline.onchange = () => { ro['show_streamline'] = cbox_streamline.checked; };
cbox_dye.onchange = () => { ro['show_dye'] = cbox_dye.checked; };
cbox_obstacle.onchange = () => { ro['show_obstacle'] = cbox_obstacle.checked; };
const tx_SOcomponent = {
    "tx_n_grid": "n_grid",
    "tx_n_iter": "n_iter",
    "tx_dt": "dt",
};
for (let tx_id in tx_SOcomponent) {
    let comp = tx_SOcomponent[tx_id];
    let tx_element = document.getElementById(tx_id);
    let val = so[comp];
    tx_element.value = (val < 0.01) ? val.toExponential() : val.toString();
}
var button_applySimulOp = document.getElementById("button_applySimulOp");
button_applySimulOp.onclick = () => {
    for (let tx_id in tx_SOcomponent) {
        let comp = tx_SOcomponent[tx_id];
        let tx_element = document.getElementById(tx_id);
        let parsed = parseFloat(tx_element.value);
        if (isNaN(parsed))
            return;
        so[comp] = parsed;
    }
    initSystem();
    let f = strScene_toFun(lastValid_strScene);
    scene_set(fluidsim, f, ro);
    fluidrenderer.draw(ro);
};
setup();
loop();
