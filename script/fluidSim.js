function clamp(x, min, max) {
    return Math.min(max, Math.max(min, x));
}
class FluidSimulator {
    constructor(nx, ny, dt, n_iter) {
        this.density = 1000;
        this.nx = nx;
        this.ny = ny;
        this.h = 1.0 / nx;
        this.n_iter = n_iter;
        this.dt = dt;
        this.n = this.nx * this.ny;
        let n = this.n;
        this.Vx = new Float32Array(n);
        this.Vy = new Float32Array(n);
        this.P = new Float32Array(n); //pressure
        this.S = new Float32Array(n); //object 0 : solid obstacle, 1 : none
        this.S.fill(1.0);
        // helper fields
        this.div = new Float32Array(n);
        this.ss = new Float32Array(n);
        this.Vxprev = new Float32Array(n);
        this.Vyprev = new Float32Array(n);
        this.Dyeprev = new Float32Array(n);
        this.RDye = new Float32Array(n);
        this.GDye = new Float32Array(n);
        this.BDye = new Float32Array(n);
        this.RDyeprev = new Float32Array(n);
        this.GDyeprev = new Float32Array(n);
        this.BDyeprev = new Float32Array(n);
        this.RDye.fill(1.0);
        this.GDye.fill(1.0);
        this.BDye.fill(1.0);
        this.constVx = new Float32Array(n);
        this.constVy = new Float32Array(n);
        this.constRDye = new Float32Array(n);
        this.constGDye = new Float32Array(n);
        this.constBDye = new Float32Array(n);
        this.constVx.fill(NaN);
        this.constVy.fill(NaN);
        this.constRDye.fill(NaN);
        this.constGDye.fill(NaN);
        this.constBDye.fill(NaN);
        // parameter for SOR solver
        this.over_relaxation = 1.9;
    }
    solveDivergence() {
        let nx = this.nx;
        let cp = this.density * this.h / this.dt;
        this.P.fill(0.0);
        for (let k = 0; k < this.n_iter; k++) {
            for (let i = 1; i < this.nx - 1; i++) {
                for (let j = 1; j < this.ny - 1; j++) {
                    if (this.S[i + nx * j] == 0.0)
                        continue;
                    let sx0 = this.S[i - 1 + nx * j];
                    let sx1 = this.S[i + 1 + nx * j];
                    let sy0 = this.S[i + nx * (j - 1)];
                    let sy1 = this.S[i + nx * (j + 1)];
                    let s = sx0 + sx1 + sy0 + sy1;
                    if (s == 0.0)
                        continue;
                    let div = this.Vx[i + 1 + nx * j] - this.Vx[i + nx * j] +
                        this.Vy[i + nx * (j + 1)] - this.Vy[i + nx * j];
                    this.div[i + nx * j] = div;
                    this.ss[i + nx * j] = s;
                    let p = -div / s;
                    p *= this.over_relaxation;
                    this.P[i + nx * j] += cp * p;
                    this.Vx[i + nx * j] -= sx0 * p;
                    this.Vx[i + 1 + nx * j] += sx1 * p;
                    this.Vy[i + nx * j] -= sy0 * p;
                    this.Vy[i + nx * (j + 1)] += sy1 * p;
                }
            }
        }
    }
    applyConstantFields() {
        for (let i = 0; i < this.n; i++) {
            if (!isNaN(this.constVx[i]))
                this.Vx[i] = this.constVx[i];
            if (!isNaN(this.constVy[i]))
                this.Vy[i] = this.constVy[i];
            if (!isNaN(this.constRDye[i]))
                this.RDye[i] = this.constRDye[i];
            if (!isNaN(this.constGDye[i]))
                this.GDye[i] = this.constGDye[i];
            if (!isNaN(this.constBDye[i]))
                this.BDye[i] = this.constBDye[i];
        }
    }
    extrapolateBoundary() {
        let nx = this.nx;
        for (let i = 0; i < this.nx; i++) {
            this.Vx[i + nx * 0] = this.Vx[i + nx * 1];
            this.Vx[i + nx * (this.ny - 1)] = this.Vx[i + nx * (this.ny - 2)];
        }
        for (let j = 0; j < this.ny; j++) {
            this.Vy[0 + nx * j] = this.Vy[1 + nx * j];
            this.Vy[(this.nx - 1) + nx * j] = this.Vy[(this.nx - 2) + nx * j];
        }
    }
    interpolateFromField(x, y, field) {
        let nx = this.nx;
        let h = this.h;
        let i = clamp(x / h, 1, this.nx - 1);
        let j = clamp(y / h, 1, this.ny - 1);
        let i0 = Math.floor(i - 0.5);
        let i1 = i0 + 1;
        let j0 = Math.floor(j - 0.5);
        let j1 = j0 + 1;
        let tx = ((i - 0.5) - i0);
        let ty = ((j - 0.5) - j0);
        let sx = 1.0 - tx;
        let sy = 1.0 - ty;
        let val = sx * sy * field[i0 + nx * j0] +
            tx * sy * field[i1 + nx * j0] +
            tx * ty * field[i1 + nx * j1] +
            sx * ty * field[i0 + nx * j1];
        return val;
    }
    avgVx(i, j, Vx) {
        let nx = this.nx;
        return (Vx[i + nx * (j - 1)] + Vx[i + nx * j] +
            Vx[i + 1 + nx * (j - 1)] + Vx[i + 1 + nx * j]) * 0.25;
    }
    avgVy(i, j, Vy) {
        let nx = this.nx;
        return (Vy[i - 1 + nx * j] + Vy[i + nx * j] +
            Vy[i - 1 + nx * (j + 1)] + Vy[i + nx * (j + 1)]) * 0.25;
    }
    advectVel() {
        this.Vxprev.set(this.Vx);
        this.Vyprev.set(this.Vy);
        let dt = this.dt;
        let nx = this.nx;
        let h = this.h;
        for (let i = 1; i < this.nx - 1; i++) {
            for (let j = 1; j < this.ny - 1; j++) {
                if (this.S[i + nx * j] == 0.0)
                    continue;
                // consider point in the center of the grid
                let xn = i * h + 0.5 * h;
                let yn = j * h + 0.5 * h;
                // x component
                if (this.S[i - 1 + nx * j] != 0.0) {
                    let vx = this.Vx[i + nx * j];
                    // let vy = this.Vy[i + nx*j];
                    // let vx = this.avgVx(i, j);
                    let vy = this.avgVy(i, j, this.Vyprev);
                    let x = xn - vx * dt;
                    let y = yn - vy * dt;
                    this.Vx[i + nx * j] = this.interpolateFromField(x, y, this.Vxprev);
                }
                // y component
                if (this.S[i + nx * (j - 1)] != 0.0) {
                    let vx = this.avgVx(i, j, this.Vxprev);
                    // let vy = this.avgVy(i, j);
                    // let vx = this.Vx[i + nx*j];
                    let vy = this.Vy[i + nx * j];
                    let x = xn - vx * dt;
                    let y = yn - vy * dt;
                    this.Vy[i + nx * j] = this.interpolateFromField(x, y, this.Vyprev);
                }
            }
        }
    }
    advectDye(Dye, Dyeprev) {
        let dt = this.dt;
        Dyeprev.set(Dye);
        let nx = this.nx;
        let h = this.h;
        for (let i = 1; i < this.nx - 1; i++) {
            for (let j = 1; j < this.ny - 1; j++) {
                if (this.S[i + nx * j] == 0.0)
                    continue;
                // let vx = (this.Vx[i + nx*j] + this.Vx[(i+1) + nx*j]) * 0.5;
                // let vy = (this.Vy[i + nx*j] + this.Vy[i + nx*(j+1)]) * 0.5;
                let vx = this.Vx[i + nx * j];
                let vy = this.Vy[i + nx * j];
                let x = i * h + 0.5 * h - vx * dt;
                let y = j * h + 0.5 * h - vy * dt;
                Dye[i + nx * j] = this.interpolateFromField(x, y, Dyeprev);
            }
        }
    }
    simulate() {
        this.solveDivergence();
        this.extrapolateBoundary();
        this.advectVel();
        this.advectDye(this.RDye, this.RDyeprev);
        this.advectDye(this.GDye, this.GDyeprev);
        this.advectDye(this.BDye, this.BDyeprev);
        this.applyConstantFields();
    }
}
function hex2rgb(h) {
    let r = (0xFF) & (h >> 16);
    let g = (0xFF) & (h >> 8);
    let b = (0xFF) & (h >> 0);
    return [r, g, b, 255];
}
function sciColor(val, minVal, maxVal) {
    let range = maxVal - minVal;
    val = clamp(val, minVal, maxVal - 0.0001);
    val = (range == 0.0) ? 0.5 : (val - minVal) / range;
    let m = 0.25;
    let num = Math.floor(val / m);
    let s = (val - num * m) / m;
    let r, g, b;
    switch (num) {
        case 0:
            r = 0.0;
            g = s;
            b = 1.0;
            break;
        case 1:
            r = 0.0;
            g = 1.0;
            b = 1.0 - s;
            break;
        case 2:
            r = s;
            g = 1.0;
            b = 0.0;
            break;
        case 3:
            r = 1.0;
            g = 1.0 - s;
            b = 0.0;
            break;
    }
    return [255 * r, 255 * g, 255 * b, 255];
}
class FluidRenderer {
    constructor(fluidsim, canvas) {
        this.fluidsim = fluidsim;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        let scale = canvas.height / fluidsim.ny;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(scale, scale);
        this.ctx.imageSmoothingEnabled = false; // -> nearest-neighbor interpolation
        // temp canvas to store original values
        this.data_canvas = document.createElement('canvas');
        this.data_canvas.width = fluidsim.nx;
        this.data_canvas.height = fluidsim.ny;
        this.data_ctx = this.data_canvas.getContext('2d');
        this.data_img_data = this.data_ctx.getImageData(0, 0, this.data_canvas.width, this.data_canvas.height);
        this.data_pixels = this.data_img_data.data;
    }
    drawStreamline() {
        var h = this.fluidsim.h;
        var segLen = h * 0.2;
        var numSegs = 15;
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 0.1;
        for (var i = 1; i < this.fluidsim.nx - 1; i += 5) {
            for (var j = 1; j < this.fluidsim.ny - 1; j += 5) {
                var x = (i + 0.5) * h;
                var y = (j + 0.5) * h;
                this.ctx.beginPath();
                this.ctx.moveTo(x / h, y / h);
                for (var n = 0; n < numSegs; n++) {
                    var u = this.fluidsim.interpolateFromField(x, y, this.fluidsim.Vx);
                    var v = this.fluidsim.interpolateFromField(x, y, this.fluidsim.Vy);
                    var l = Math.sqrt(u * u + v * v);
                    x += u / l * segLen;
                    y += v / l * segLen;
                    if (x > this.fluidsim.nx * this.fluidsim.h)
                        break;
                    this.ctx.lineTo(x / h, y / h);
                }
                this.ctx.stroke();
            }
        }
    }
    // TODO : buffer draw
    drawPressure() {
        var fl = this.fluidsim;
        var p_min, p_max;
        p_min = p_max = fl.P[0];
        for (var i = 0; i < fl.nx * fl.ny; i++) {
            p_min = Math.min(p_min, fl.P[i]);
            p_max = Math.max(p_max, fl.P[i]);
        }
        for (var i = 0; i < fl.nx; i++) {
            for (var j = 0; j < fl.ny; j++) {
                var p = fl.P[i + (fl.nx) * j];
                var color = sciColor(p, p_min, p_max);
                var ptr = 4 * (j * this.data_canvas.width + i);
                this.data_pixels[ptr + 0] = color[0];
                this.data_pixels[ptr + 1] = color[1];
                this.data_pixels[ptr + 2] = color[2];
                this.data_pixels[ptr + 3] = color[3];
            }
        }
        // put data into data_canvas
        this.data_ctx.putImageData(this.data_img_data, 0, 0);
        // draw into original canvas
        this.ctx.drawImage(this.data_canvas, 0, 0);
    }
    // var draw_option {
    //     'dye'       : true,
    //     'obstacle'  : true,
    //     'streamline': true,
    // }
    draw(ro) {
        var fl = this.fluidsim;
        let color = [255, 255, 255, 255];
        let obs_color = hex2rgb(0x9BB6E0); //obstacle #9bb6e0
        for (let i = 0; i < fl.n; i++) {
            let color = [255, 255, 255, 255];
            if (ro['show_dye']) {
                color[0] = 255 * fl.RDye[i];
                color[1] = 255 * fl.GDye[i];
                color[2] = 255 * fl.BDye[i];
                color[3] = 255;
            }
            if (fl.S[i] == 0 && ro['show_obstacle'])
                color = obs_color.slice();
            var p = 4 * i;
            this.data_pixels[p + 0] = color[0];
            this.data_pixels[p + 1] = color[1];
            this.data_pixels[p + 2] = color[2];
            this.data_pixels[p + 3] = color[3];
        }
        // put data into data_canvas
        this.data_ctx.putImageData(this.data_img_data, 0, 0);
        // draw into original canvas
        this.ctx.drawImage(this.data_canvas, 0, 0);
        if (ro['show_streamline'])
            this.drawStreamline();
    }
}
export { FluidSimulator, FluidRenderer };
