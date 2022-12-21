var scene_generators = []


function addCircularObstacle(f, x, y, radius) {
    var vx = 0.0;
    var vy = 0.0;

    var r = radius;
    var nx = f.nx;
    var cd = Math.sqrt(2) * f.h;

    for (var i = 1; i < f.nx-2; i++) { for (var j = 1; j < f.ny-2; j++) {
        f.S[i + nx*j] = 1.0;

        var dx = (i + 0.5) * f.h - x;
        var dy = (j + 0.5) * f.h - y;

        if (dx * dx + dy * dy < r * r) {
            f.S  [i   + nx*j    ] = 0.0;
            f.Dye[i   + nx*j    ] = 1.0;
            f.Vx [i   + nx*j    ] = vx;
            f.Vx [i+1 + nx*j    ] = vx;
            f.Vy [i   + nx*j    ] = vy;
            f.Vy [i   + nx*(j+1)] = vy;
        }
    } }
}

function sceneReset(f){
    f.Vx.fill(0.0);
    f.Vy.fill(0.0);

    f.P.fill(0.0)
    f.S.fill(1.0)
    f.Dye.fill(1.0)

    f.Vxnew.fill(0.0);
    f.Vynew.fill(0.0);
    f.Dyenew.fill(0.0);
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
    for (var j = jmin; j < jmax; j++) f.Dye[0 + nx*j] = 0.0;

    addCircularObstacle(f, 0.4, 0.5, 0.15);
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
    for (var j = jmin; j < jmax; j++){
        f.Dye[0    + nx*j] = 0.0;
        f.Dye[nx-1 + nx*j] = 0.0;
    }

}

export {scene_generators, sceneReset};
