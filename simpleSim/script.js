/*
 * script.js
 * Copyright (C) 2022 rayhan <rayhan.azizi9@gmail.com>
 *
 * Distributed under terms of the MIT license.
 */

var canvas = document.getElementById("canvas");
var over_relaxation = 1.9;  // parameter for SOR solver
var n_iter = 40;            // number of iteration for SOR solver
var res    = 100;           // number of pixel in a column
var h      = 1.0 / res;     // grid size

var nx = res * canvas.width / canvas.height;
var ny = res;

var density = 1000.0;
var dt      = 1.0/60.0;

// Fluid Simulator
function clamp(x, min,max){ return Math.min(max, Math.max(min, x)); }

class FluidSimulator {
    constructor(density, nx, ny, h, dt, n_iter, over_relaxation) {
        this.density = density;
        this.nx = nx ; 
        this.ny = ny ;

        this.dt = dt;
        this.h  = h;
        var  n  = this.nx * this.ny;

        // Vector Field
        this.Vx = new Float32Array(n);
        this.Vy = new Float32Array(n);

        // Scalar Field
        this.S   = new Float32Array(n); //object 0 : solid obstacle, 1 : none
        this.Dye = new Float32Array(n); //dye    0 : filled        , 1 : none

        this.S.fill(1.0);   // no obstacle
        this.Dye.fill(1.0); // no dye

        // helper field
        this.Vxprev  = new Float32Array(n);
        this.Vyprev  = new Float32Array(n);
        this.Dyeprev = new Float32Array(n);

        // parameter for SOR solver
        this.n_iter = n_iter;
        this.over_relaxation = over_relaxation;
    }


    solveDivergence() {
        var nx = this.nx;

        for (var k = 0; k < this.n_iter; k++) {
            for (var i = 1; i < this.nx-1; i++) { for (var j = 1; j < this.ny-1; j++) {

                if (this.S[i + nx*j] == 0.0) continue;

                var sx0 = this.S[i-1 + nx*j];
                var sx1 = this.S[i+1 + nx*j];
                var sy0 = this.S[i   + nx*(j-1)];
                var sy1 = this.S[i   + nx*(j+1)];
                var s = sx0 + sx1 + sy0 + sy1;
                if (s == 0.0) continue;

                var div = this.Vx[i+1 + nx*j] - this.Vx[i + nx*j] + 
                          this.Vy[i + nx*(j+1)] - this.Vy[i + nx*j];

                this.Vx[i   + nx*j    ] += sx0 * div / s * this.over_relaxation;
                this.Vx[i+1 + nx*j    ] -= sx1 * div / s * this.over_relaxation;
                this.Vy[i   + nx*j    ] += sy0 * div / s * this.over_relaxation;
                this.Vy[i   + nx*(j+1)] -= sy1 * div / s * this.over_relaxation;
            } }
        }
    }

    extrapolateBoundary() {
        var nx = this.nx;
        for (var i = 0; i < this.nx; i++) {
            this.Vx[i + nx*0]           = this.Vx[i + nx*1];
            this.Vx[i + nx*(this.ny-1)] = this.Vx[i + nx*(this.ny-2)]; 
        }
        for (var j = 0; j < this.ny; j++) {
            this.Vy[0 + nx*j]           = this.Vy[1 + nx*j];
            this.Vy[(this.nx-1) + nx*j] = this.Vy[(this.nx-2) + nx*j] 
        }
    }

    interpolateFromField(x, y, field) {
        var nx = this.nx;
        var h = this.h;

        var i = clamp(x/h, 1, this.nx);
        var j = clamp(y/h, 1, this.nx);

        var i0 = Math.floor(i - 0.5);
        var i1 = i0 + 1;
        var j0 = Math.floor(j - 0.5)
        var j1 = j0 + 1;

        var tx = ((i-0.5) - i0);
        var ty = ((j-0.5) - j0);

        var sx = 1.0 - tx;
        var sy = 1.0 - ty;

        var val = sx*sy * field[i0 + nx*j0] +
                  tx*sy * field[i1 + nx*j0] +
                  tx*ty * field[i1 + nx*j1] +
                  sx*ty * field[i0 + nx*j1];
        return val;
    }

    avgVx(i, j, Vx) {
        var nx = this.nx;
        return (Vx[i   + nx*(j-1)] + Vx[i   + nx*j] +
                Vx[i+1 + nx*(j-1)] + Vx[i+1 + nx*j]) * 0.25;
    }

    avgVy(i, j, Vy){
        var nx = this.nx;
        return (Vy[i-1 + nx*j]     + Vy[i + nx*j] +
                Vy[i-1 + nx*(j+1)] + Vy[i + nx*(j+1)]) * 0.25;
    }

    advectVel() {
        this.Vxprev.set(this.Vx);
        this.Vyprev.set(this.Vy);

        var dt = this.dt;
        var nx = this.nx;
        var h = this.h;

        for (var i = 1; i < this.nx-1; i++) { for (var j = 1; j < this.ny-1; j++) {

            if (this.S[i + nx*j] == 0.0) continue;

            // consider point in the center of the grid
            var xn = i*h + 0.5*h;
            var yn = j*h + 0.5*h;

            // x component
            if (this.S[i-1 + nx*j] != 0.0) {
                var vx = this.Vx[i + nx*j];
                // var vy = this.Vy[i + nx*j];
                // var vx = this.avgVx(i, j);
                var vy = this.avgVy(i, j, this.Vyprev);
                var x  = xn - vx*dt;
                var y  = yn - vy*dt;
                this.Vx[i + nx*j] = this.interpolateFromField(x,y, this.Vxprev);
            }
            // y component
            if (this.S[i + nx*(j-1)] != 0.0) {
                var vx = this.avgVx(i, j, this.Vxprev);
                // var vy = this.avgVy(i, j);
                // var vx = this.Vx[i + nx*j];
                var vy = this.Vy[i + nx*j];
                var x  = xn - vx*dt;
                var y  = yn - vy*dt;
                this.Vy[i + nx*j] = this.interpolateFromField(x,y, this.Vyprev);
            }
       } }
    }

    advectDye() {
        var dt = this.dt;
        this.Dyeprev.set(this.Dye);
        var nx = this.nx; var h = this.h;
        for (var i = 1; i < this.nx-1; i++) { for (var j = 1; j < this.ny-1; j++) {
            if (this.S[i + nx*j] == 0.0) continue;
            var vx = (this.Vx[i + nx*j] + this.Vx[(i+1) + nx*j]) * 0.5;
            var vy = (this.Vy[i + nx*j] + this.Vy[i + nx*(j+1)]) * 0.5;
            var x  = i*h + 0.5*h - vx*dt;
            var y  = j*h + 0.5*h - vy*dt;
            this.Dye[i + nx*j] = this.interpolateFromField(x,y, this.Dyeprev);
        }}
    }

    simulate() {
        this.advectVel();
        this.advectDye();
        this.solveDivergence();
        this.extrapolateBoundary();
    }
}


class FluidRenderer{
    constructor(fluidsim, canvas){
        this.fluidsim = fluidsim;
        this.canvas   = canvas;

        this.ctx      = canvas.getContext('2d');
        this.width    = canvas.width;
        this.height   = canvas.height;

        var scale = canvas.height/fluidsim.ny;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.scale(scale,scale);
        this.ctx.imageSmoothingEnabled = false; // -> nearest-neighbor interpolation
        
        // temp canvas to store original values
        // needed to easly scale images
        this.temp_canvas        = document.createElement('canvas');
        this.temp_canvas.width  = fluidsim.nx;
        this.temp_canvas.height = fluidsim.ny;
        this.temp_ctx      = this.temp_canvas.getContext('2d');
        this.temp_img_data = this.temp_ctx.getImageData(0,0, this.temp_canvas.width, this.temp_canvas.height);
        this.temp_pixels   = this.temp_img_data.data;
    }

    draw() {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        var fl = this.fluidsim;
        var nx = fl.nx;

        var color = [255, 255, 255, 255];
        for (var i = 0; i < fl.nx * fl.ny; i++) {
            var s = fl.Dye[i];
            color[0] = 255*s;
            color[1] = 255*s;
            color[2] = 255*s;

            // #9bb6e0
            if (fl.S[i] == 0) color = [155, 182, 224, 255]; //obstacle

            var p = 4 * i;
            this.temp_pixels[p+0] = color[0];
            this.temp_pixels[p+1] = color[1];
            this.temp_pixels[p+2] = color[2];
            this.temp_pixels[p+3] = color[3];
        }


        // put data into temp_canvas
        this.temp_ctx.putImageData(this.temp_img_data, 0, 0);
        // draw into original canvas 
        // (this will be a scaled version based on this.ctx.scale)
        this.ctx.drawImage(this.temp_canvas, 0, 0);
    }
}

// Scenes

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
            f.S  [i   + nx*j    ] = 0.0;
            f.Dye[i   + nx*j    ] = 1.0;
            f.Vx [i   + nx*j    ] = 0.0;
            f.Vy [i   + nx*j    ] = 0.0;
        }
    } }
}

// some scenes can be dynamic
function scene_WindTunnel(f, _t = 0){
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

    addCircularObstacle(f, 0.5, 0.5, 0.15);
}

var fluidsim      = new FluidSimulator(density, nx, ny, h, dt, n_iter, over_relaxation);
var fluidrenderer = new FluidRenderer(fluidsim, canvas);

var paused = false;
function loop() {
    if (!paused) fluidsim.simulate()
    fluidrenderer.draw();
    requestAnimationFrame(loop);
}

scene_WindTunnel(fluidsim); // prepare scene
loop();
