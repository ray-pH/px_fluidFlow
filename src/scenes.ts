import {FluidSimulator, FluidRenderer, RenderOption} from './fluidSim';
type scenefun = (nx : number, ny : number, S : Float32Array, utils : Object, id : Function,
                Vx  : Float32Array, Vy  : Float32Array,
                RD  : Float32Array, GD  : Float32Array, BD  : Float32Array,
                cVx : Float32Array, cVy : Float32Array,
                cRD : Float32Array, cGD : Float32Array, cBD : Float32Array,
                ) => void;

function sceneReset(f : FluidSimulator){
    f.Vx.fill(0.0);
    f.Vy.fill(0.0);

    f.P.fill(0.0)
    f.S.fill(1.0)
    f.RDye.fill(1.0)
    f.GDye.fill(1.0)
    f.BDye.fill(1.0)

    f.Vxprev.fill(0.0);
    f.Vyprev.fill(0.0);

    f.RDyeprev.fill(0.0);
    f.GDyeprev.fill(0.0);
    f.BDyeprev.fill(0.0);

    f.constVx  .fill(NaN);
    f.constVy  .fill(NaN);
    f.constRDye.fill(NaN);
    f.constGDye.fill(NaN);
    f.constBDye.fill(NaN);
}

function scene_set(fs : FluidSimulator, sf : scenefun, ro : RenderOption){
    let utils : Object = {
        'hex2rgb' : hex2rgb,
        'sceneReset' : () => { sceneReset(fs); },
        'addCircularObstacle' : (x : number ,y : number ,r : number) => { addCircularObstacle(fs, x, y, r); },
    }
    let nx = fs.nx;
    function id(i : number, j : number){ return i + nx * j; }
    sf(fs.nx, fs.ny, fs.S, utils, id,
       fs.Vx, fs.Vy, fs.RDye, fs.GDye, fs.BDye,
       fs.constVx, fs.constVy, fs.constRDye, fs.constGDye, fs.constBDye,
      );
}

function strScene_toFun(s : string) : scenefun {
    let f : scenefun = 
        new Function('nx', 'ny', 'S', 'utils', 'id',
                     'initVx', 'initVy', 
                     'initRDye', 'initGDye', 'initBDye',
                     'Vx', 'Vy',
                     'RDye', 'GDye', 'BDye',
                     "\"use strict\";\n" + s) as scenefun;
    return f;
}

function clamp(x, min,max){
    return Math.min(max, Math.max(min, x));
}

function addCircularObstacle(f, x, y, radius) {
    var r = radius;
    var nx = f.nx;

    let ifrom = clamp(Math.floor((x-r-1)/f.h), 0, f.nx-1);
    let ito   = clamp(Math.ceil ((x+r+2)/f.h), 0, f.nx-1);
    let jfrom = clamp(Math.floor((y-r-1)/f.h), 0, f.ny-1);
    let jto   = clamp(Math.ceil ((y+r+2)/f.h), 0, f.ny-1);
    for (var i = ifrom; i < ito; i++) { for (var j = jfrom; j < jto; j++) {

        var dx = (i + 0.5) * f.h - x;
        var dy = (j + 0.5) * f.h - y;

        if (dx * dx + dy * dy < r * r) {
            f.S   [i   + nx*j    ] = 0.0;
            f.RDye[i   + nx*j    ] = 1.0;
            f.Vx  [i   + nx*j    ] = 0.0;
            f.Vy  [i   + nx*j    ] = 0.0;
        }
    } }
}


function hex2rgb(h){
    var r = (0xFF) & (h >> 16);
    var g = (0xFF) & (h >> 8);
    var b = (0xFF) & (h >> 0);
    return [r,g,b,255];
}

let strScene_WindTunnel : string = 
`utils.sceneReset();
let wind_vel    = 2.0;
let pipe_height = 0.1 * ny;

// set obstacles
S.fill(1.0);
for (var i = 0; i < nx; i++) {
    S[id(i,0)] = 0.0;
    S[id(i,ny-1)] = 0.0;
}
for (var j = 0; j < ny; j++){
    S [id(0,j)] = 0.0;
}

// set velocity
for (var j = 0; j < ny; j++) Vx[id(1,j)] = wind_vel;

// set dye
var jmin = Math.floor(0.5 * ny - 0.5*pipe_height);
var jmax = Math.floor(0.5 * ny + 0.5*pipe_height);
for (let j = jmin; j < jmax; j++){
    RDye[id(0,j)] = 0.0;
    GDye[id(0,j)] = 0.0;
    BDye[id(0,j)] = 0.0;
    RDye[id(1,j)] = 0.0;
    GDye[id(1,j)] = 0.0;
    BDye[id(1,j)] = 0.0;
}

//    addCircularObstacle(x,   y,   radius)
utils.addCircularObstacle(0.3, 0.5, 0.1);
`

let strScene_Opposing : string =
`utils.sceneReset();
let source_v    = 4.0;
let pipe_height = 0.05 * ny;
let dye_height  = 0.05 * ny;

// set obstacles
for (let i = 0; i < nx; i++) {
    S[id(i,0   )] = 0.0;
    S[id(i,ny-1)] = 0.0;
}
for (let j = 0; j < ny; j++){
    S[id(0   ,j)] = 0.0;
    S[id(nx-1,j)] = 0.0;
}

let jmin = Math.floor(0.5 * ny - 0.5*pipe_height);
let jmax = Math.floor(0.5 * ny + 0.5*pipe_height);

for (let j = jmin; j < jmax; j++){
    Vx[id(2   ,j)] = source_v;
    Vx[id(nx-2,j)] = -source_v;
}

jmin = Math.floor(0.5 * ny - 0.5*dye_height);
jmax = Math.floor(0.5 * ny + 0.5*dye_height);

//#3477eb
//#e81570
let r0,g0,b0,a0, r1, g1, b1, a1;
[r0,g0,b0,a0] = utils.hex2rgb(0x3477EB);
[r1,g1,b1,a1] = utils.hex2rgb(0xE81570);
for (var j = jmin; j < jmax; j++){
    RDye[id(0,j)] = r0/255;
    GDye[id(0,j)] = g0/255;
    BDye[id(0,j)] = b0/255;
    RDye[id(2,j)] = r0/255;
    GDye[id(2,j)] = g0/255;
    BDye[id(2,j)] = b0/255;
    RDye[id(nx-1,j)] = r1/255;
    GDye[id(nx-1,j)] = g1/255;
    BDye[id(nx-1,j)] = b1/255;
    RDye[id(nx-3,j)] = r1/255;
    GDye[id(nx-3,j)] = g1/255;
    BDye[id(nx-3,j)] = b1/255;
}
`

export {scene_set, scenefun, strScene_toFun, strScene_Opposing, strScene_WindTunnel};
