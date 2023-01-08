function sceneReset(f) {
    f.Vx.fill(0.0);
    f.Vy.fill(0.0);
    f.P.fill(0.0);
    f.S.fill(1.0);
    f.RDye.fill(1.0);
    f.GDye.fill(1.0);
    f.BDye.fill(1.0);
    f.Vxprev.fill(0.0);
    f.Vyprev.fill(0.0);
    f.RDyeprev.fill(0.0);
    f.GDyeprev.fill(0.0);
    f.BDyeprev.fill(0.0);
    f.constVx.fill(NaN);
    f.constVy.fill(NaN);
    f.constRDye.fill(NaN);
    f.constGDye.fill(NaN);
    f.constBDye.fill(NaN);
}
function scene_set(fs, sf, ro) {
    let utils = {
        'hex2rgb': hex2rgb,
        'sceneReset': () => { sceneReset(fs); },
        'addCircularObstacle': (x, y, r) => { addCircularObstacle(fs, x, y, r); },
    };
    sf(fs.nx, fs.ny, fs.S, utils, fs.Vx, fs.Vy, fs.RDye, fs.GDye, fs.BDye, fs.constVx, fs.constVy, fs.constRDye, fs.constGDye, fs.constBDye);
}
function strScene_toFun(s) {
    let f = new Function('nx', 'ny', 'S', 'utils', 'initVx', 'initVy', 'initRDye', 'initGDye', 'initBDye', 'Vx', 'Vy', 'RDye', 'GDye', 'BDye', "\"use strict\";\n" + s);
    return f;
}
function clamp(x, min, max) {
    return Math.min(max, Math.max(min, x));
}
function addCircularObstacle(f, x, y, radius) {
    var r = radius;
    var nx = f.nx;
    let ifrom = clamp(Math.floor((x - r - 1) / f.h), 0, f.nx - 1);
    let ito = clamp(Math.ceil((x + r + 2) / f.h), 0, f.nx - 1);
    let jfrom = clamp(Math.floor((y - r - 1) / f.h), 0, f.ny - 1);
    let jto = clamp(Math.ceil((y + r + 2) / f.h), 0, f.ny - 1);
    for (var i = ifrom; i < ito; i++) {
        for (var j = jfrom; j < jto; j++) {
            var dx = (i + 0.5) * f.h - x;
            var dy = (j + 0.5) * f.h - y;
            if (dx * dx + dy * dy < r * r) {
                f.S[i + nx * j] = 0.0;
                f.RDye[i + nx * j] = 1.0;
                f.Vx[i + nx * j] = 0.0;
                f.Vy[i + nx * j] = 0.0;
            }
        }
    }
}
function hex2rgb(h) {
    var r = (0xFF) & (h >> 16);
    var g = (0xFF) & (h >> 8);
    var b = (0xFF) & (h >> 0);
    return [r, g, b, 255];
}
let strScene_WindTunnel = `utils.sceneReset();
let wind_vel    = 2.0;
let pipe_height = 0.1 * ny;

// set obstacles
S.fill(1.0);
for (var i = 0; i < nx; i++) {
    S[i + nx*0       ] = 0.0;
    S[i + nx*(ny-1)] = 0.0;
}
for (var j = 0; j < ny; j++) S [0 + nx*j] = 0.0;
for (var j = 0; j < ny; j++) Vx[1 + nx*j] = wind_vel;

var jmin = Math.floor(0.5 * ny - 0.5*pipe_height);
var jmax = Math.floor(0.5 * ny + 0.5*pipe_height);
for (let j = jmin; j < jmax; j++) RDye[0 + nx*j] = 0.0;
for (let j = jmin; j < jmax; j++) GDye[0 + nx*j] = 0.0;
for (let j = jmin; j < jmax; j++) BDye[0 + nx*j] = 0.0;
for (let j = jmin; j < jmax; j++) RDye[1 + nx*j] = 0.0;
for (let j = jmin; j < jmax; j++) GDye[1 + nx*j] = 0.0;
for (let j = jmin; j < jmax; j++) BDye[1 + nx*j] = 0.0;

// addCircularObstacle(x, y, radius)
utils.addCircularObstacle(0.3, 0.5, 0.1);
`;
let strScene_Opposing = `utils.sceneReset();
let source_v    = 4.0;
let pipe_height = 0.05 * ny;
let dye_height  = 0.05 * ny;

// set obstacles
for (let i = 0; i < nx; i++) {
    S[i + nx*0       ] = 0.0;
    S[i + nx*(ny-1)] = 0.0;
}
for (let j = 0; j < ny; j++) S [0    + nx*j] = 0.0;
for (let j = 0; j < ny; j++) S [nx-1 + nx*j] = 0.0;

let jmin = Math.floor(0.5 * ny - 0.5*pipe_height);
let jmax = Math.floor(0.5 * ny + 0.5*pipe_height);

for (let j = 0; j < ny; j++){
    Vx[2    + nx*j] = 0.0;
    Vx[nx-2 + nx*j] = 0.0;
}
for (let j = jmin; j < jmax; j++){
    Vx[2    + nx*j] = source_v;
    Vx[nx-2 + nx*j] = -source_v;
}

jmin = Math.floor(0.5 * ny - 0.5*dye_height);
jmax = Math.floor(0.5 * ny + 0.5*dye_height);

//#3477eb
//#e81570
let r0,g0,b0,a0, r1, g1, b1, a1;
[r0,g0,b0,a0] = utils.hex2rgb(0x3477EB);
[r1,g1,b1,a1] = utils.hex2rgb(0xE81570);
for (var j = jmin; j < jmax; j++){
    RDye[0    + nx*j] = r0/255;
    GDye[0    + nx*j] = g0/255;
    BDye[0    + nx*j] = b0/255;
    RDye[2    + nx*j] = r0/255;
    GDye[2    + nx*j] = g0/255;
    BDye[2    + nx*j] = b0/255;
    RDye[nx-1 + nx*j] = r1/255;
    GDye[nx-1 + nx*j] = g1/255;
    BDye[nx-1 + nx*j] = b1/255;
    RDye[nx-3 + nx*j] = r1/255;
    GDye[nx-3 + nx*j] = g1/255;
    BDye[nx-3 + nx*j] = b1/255;
}
`;
export { scene_set, strScene_toFun, strScene_Opposing, strScene_WindTunnel };
