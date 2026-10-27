import {calculateXPosition, calculateYPosition} from './physics.mjs'
import {generateCircles} from './circleFactory.mjs'
let dprGlobal = 1
let canvasWidth = 0, canvasHeight = 0, minRadius = 0, maxRadius = 0, maxCirclesQuantity = 400
//configuration
const fps = 60, msBetweenFrame = Math.round(1000/fps)
const minCoverage = 0.00035
//canvas globals
let canvas, ctx
let images, circles, lastTimeFrame = 0


function adjustCanvasToWindow(canvas,ctx){
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const calculatedWidth = Math.round(rect.width * dpr)
    const calculatedHeight = Math.round(rect.height * dpr)
    if(dprGlobal != dpr || canvas.width != calculatedWidth || canvas.height != calculatedHeight){
        dprGlobal = dpr
        //these dimensions are canvas drawing area related, not DOM element dimensions
        canvas.width = calculatedWidth
        canvas.height = calculatedHeight
        ctx.scale(dpr,dpr)
        canvasWidth = rect.width
        canvasHeight = rect.height
        updateRadiusValues(canvasWidth, canvasHeight)
    }
}

function updateRadiusValues(canvasWidth, canvasHeight){
   const minRadiusValue = Math.sqrt(canvasWidth * canvasHeight * minCoverage)
    minRadius = Math.max(2, Math.round(minRadiusValue))
    maxRadius = Math.max(minRadius + 1, Math.round(minRadiusValue * 4))
}

async function loadImages(sources) {
    const promises = sources.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        });
    });
    //this do a fast-fail if any of the promises is rejected
    return Promise.all(promises);
}

function clearCanvas(ctx){
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
}

function drawCircle(ctx, circle, deltaTime){
    if(circle.validateDrawability()){
        //translations and rotations on the cartesian field are made but original state is guaranteed post-process
        ctx.beginPath()
        ctx.save()
        ctx.translate(Math.round(circle.xPos), Math.round(circle.yPos))
        //w refers to angular speed
        const w = (0.2 * circle.speed) / circle.radius
        const dir = circle.angle > Math.PI / 2 ? -1 : 1
        circle.spinAngle += (dir * w * deltaTime) / 1000
        ctx.rotate(circle.spinAngle)
        ctx.arc(0, 0, circle.radius,0,Math.PI*2,true)
        ctx.clip()
        ctx.drawImage(circle.image,0-circle.radius,0-circle.radius,circle.radius*2,circle.radius*2)
        ctx.closePath()
        ctx.restore()
    }
}

function updateAndDrawCircles(deltaTime){
    const now = Date.now()
    circles.forEach( (circle) => {
        if((!circle.isVisible && !circle.hasAppeared && circle.yPos <= circle.yPosInitial) || (circle.isVisible)){
            circle.xPos = calculateXPosition(circle, now)
            circle.yPos = calculateYPosition(circle, now)
            drawCircle(ctx, circle, deltaTime)
        }else{
            circle.respawn(canvasWidth, canvasHeight, minRadius, maxRadius)
        }
    })
}

function animate(){
    const now = Date.now()
    const deltaTime = Math.min(now - lastTimeFrame, 100)
    
    if(deltaTime > msBetweenFrame){
        adjustCanvasToWindow(canvas,ctx)
        clearCanvas(ctx)
        updateAndDrawCircles(deltaTime)
        lastTimeFrame = now
    }
    requestAnimationFrame(animate)
}

async function initCanvas(idCanvas, maxQuantity, sources, callback) {
    canvas = document.getElementById(idCanvas)
    ctx = canvas.getContext('2d')
    adjustCanvasToWindow(canvas,ctx)
    maxCirclesQuantity = maxQuantity
    try{
        images = await loadImages(sources)
        circles = generateCircles(maxCirclesQuantity,canvasWidth,canvasHeight, minRadius, maxRadius, images)
        animate()
        if(typeof callback !== 'undefined'){
            callback()
        }
    }catch(err){
        console.error("error loading sources ", err)
    }
}
export {initCanvas}




