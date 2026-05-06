let dprGlobal = 1, canvasWidth = 100, canvasHeight = 100;

function adjustCanvasToWindow(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const calculatedWidth = Math.round(rect.width * dpr);
    const calculatedHeight = Math.round(rect.height * dpr);

    if (dprGlobal !== dpr || canvas.width !== calculatedWidth || canvas.height !== calculatedHeight) {
        dprGlobal = dpr;
        canvas.width = calculatedWidth;
        canvas.height = calculatedHeight;
        canvasWidth = rect.width;
        canvasHeight = rect.height;
    }
}

function initBackground(source, idCanvas, blacknessLimit) {
    const canvas = document.getElementById(idCanvas);
    const ctx = canvas.getContext('2d');
    adjustCanvasToWindow(canvas, ctx);

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = canvasWidth;
    baseCanvas.height = canvasHeight;
    const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });

    let background = {};
    if (source) {
        baseCtx.drawImage(source, 0, 0, canvasWidth, canvasHeight);
        
        background = {
            canvas: canvas,
            ctx: ctx,
            baseCanvas: baseCanvas, 
            baseCtx: baseCtx,
            imageData: baseCtx.getImageData(0, 0, canvasWidth, canvasHeight),
            undrawingStep: 20,
            blackUpperLimit: blacknessLimit,
            animateBehavior: function () {
                proccessImageSection(this.imageData.data, this.undrawingStep, this.blackUpperLimit);
                this.baseCtx.putImageData(this.imageData, 0, 0);
                //this provides automatic scale on retina/4k displays
                this.ctx.drawImage(this.baseCanvas, 0, 0, canvas.width, canvas.height);
            }
        };
    }
    return background;
}

function proccessImageSection(data, step, limit) {
    for (let i = 0, len = data.length; i < len; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];

        if (r > limit && g > limit && b > limit) {
            data[i]     = r < (255 - step) ? r + step : 255;
            data[i + 1] = g < (255 - step) ? g + step : 255;
            data[i + 2] = b < (255 - step) ? b + step : 255;
        } else if (r > step && g > step && b > step) {
            data[i]     -= step;
            data[i + 1] -= step;
            data[i + 2] -= step;
        }
    }
}

function animateBackground(background, delayMs) {
    setTimeout(() => {
        background.animateBehavior();
        requestAnimationFrame(() => animateBackground(background, delayMs));
    }, delayMs);
}

export { initBackground, animateBackground };
