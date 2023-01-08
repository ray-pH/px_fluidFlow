var scene_generators = []

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

function sceneReset(f){
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
}

function hex2rgb(h){
    var r = (0xFF) & (h >> 16);
    var g = (0xFF) & (h >> 8);
    var b = (0xFF) & (h >> 0);
    return [r,g,b,255];
}

// some scenes can be dynamic
scene_generators[0] = function scene_WindTunnel(f, t = 0){
    var nx = f.nx;
    var wind_vel    = 2.0;
    var pipe_height = 0.1 * f.ny;

    // set obstacles
    f.S.fill(1.0);
    for (var i = 0; i < f.nx; i++) {
        f.S[i + nx*0       ] = 0.0;
        f.S[i + nx*(f.ny-1)] = 0.0;
    }
    for (var j = 0; j < f.ny; j++) f.S [0 + nx*j] = 0.0;
    for (var j = 0; j < f.ny; j++) f.Vx[1 + nx*j] = wind_vel;

    var jmin = Math.floor(0.5 * f.ny - 0.5*pipe_height);
    var jmax = Math.floor(0.5 * f.ny + 0.5*pipe_height);
    for (var j = jmin; j < jmax; j++) f.RDye[0 + nx*j] = 0.0;
    for (var j = jmin; j < jmax; j++) f.GDye[0 + nx*j] = 0.0;
    for (var j = jmin; j < jmax; j++) f.BDye[0 + nx*j] = 0.0;

    addCircularObstacle(f, 0.3, 0.5, 0.1);
}

scene_generators[1] = function scene_opposingSources(f, t = 0){
    var nx = f.nx;
    var source_v    = 2.0;
    var pipe_height = 0.05 * f.ny;
    var dye_height  = 0.05 * f.ny;

    // set obstacles
    for (var i = 0; i < f.nx; i++) {
        f.S[i + nx*0       ] = 0.0;
        f.S[i + nx*(f.ny-1)] = 0.0;
    }
    for (var j = 0; j < f.ny; j++) f.S [0    + nx*j] = 0.0;
    for (var j = 0; j < f.ny; j++) f.S [nx-1 + nx*j] = 0.0;

    var jmin = Math.floor(0.5 * f.ny - 0.5*pipe_height);
    var jmax = Math.floor(0.5 * f.ny + 0.5*pipe_height);

    for (var j = 0; j < f.ny; j++){
        f.Vx[1    + nx*j] = 0.0;
        f.Vx[nx-1 + nx*j] = 0.0;
    }
    for (var j = jmin; j < jmax; j++){
        f.Vx[1    + nx*j] = source_v;
        f.Vx[nx-1 + nx*j] = -source_v;
        // f.Vx[nx-2 + nx*j] = -source_v;
    }

    var jmin = Math.floor(0.5 * f.ny - 0.5*dye_height);
    var jmax = Math.floor(0.5 * f.ny + 0.5*dye_height);


    //#3477eb
    //#e81570
    let r0,g0,b0,a0, r1, g1, b1, a1;
    [r0,g0,b0,a0] = hex2rgb(0x3477EB);
    [r1,g1,b1,a1] = hex2rgb(0xE81570);
    for (var j = jmin; j < jmax; j++){
        f.RDye[0    + nx*j] = r0/255;
        f.GDye[0    + nx*j] = g0/255;
        f.BDye[0    + nx*j] = b0/255;
        f.RDye[nx-1 + nx*j] = r1/255;
        f.GDye[nx-1 + nx*j] = g1/255;
        f.BDye[nx-1 + nx*j] = b1/255;
    }

    if (!f.rgb_dye){
        for (var i = 0; i < f.nx * f.ny; i++) {
            let rDye = 1 - f.RDye[i];
            let gDye = 1 - f.GDye[i];
            let bDye = 1 - f.BDye[i];
            f.RDye[i] = 1 - Math.min(rDye + gDye + bDye, 1.0);
        }
    }

}

export {scene_generators, sceneReset};
