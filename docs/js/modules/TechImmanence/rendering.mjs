import {calculateXPosition, calculateYPosition} from './physics.mjs'
import {generateCircles} from './circleFactory.mjs'
let dprGlobal = 1
let canvasWidth = 0, canvasHeight = 0, minRadius = 0, maxRadius = 0, maxCirclesQuantity = 400
//configuration
const fps = 60, msBetweenFrame = Math.round(1000/fps)
//canvas globals
let canvas = document.getElementById('main_canvas'), ctx = canvas.getContext('2d'), lastTimeFrame = 0
let images, circles

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
        //adjust globals for convenience
        canvasWidth = rect.width
        canvasHeight = rect.height
        //maxRadius = Math.round((canvasHeight)*(1/7))
        //minRadius = Math.round(maxRadius/5)

        let aspectRelation = canvasWidth/canvasHeight

        maxRadius = Math.round(aspectRelation*(((canvasWidth+canvasHeight)/2)*(20/canvasWidth)))
        minRadius = Math.round(canvasWidth*0.005)
    }
}
function clearCanvas(ctx){
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.beginPath()
    ctx.rect(0,0,canvasWidth, canvasHeight)
    ctx.fill()
    ctx.closePath()
}

function drawCircle(ctx, circle){
    const frameWindow = 1000/400
    if(circle.validateDrawability()){
        //translations and rotations on the cartesian field are made but original state is guaranteed post-process
        ctx.beginPath()
        ctx.save()
        ctx.translate(Math.round(circle.xPos), Math.round(circle.yPos))
        //w refers to angular speed
        //s refers to spin coeficient
        const s = 2
        let w = (s*circle.speed)/circle.radius
        //w is adjusted to match fps canvas refresh rate
        if(circle.angle > (Math.PI/2)){w = -w}
        circle.spinAngle = circle.spinAngle += (w/frameWindow)
        ctx.rotate(circle.spinAngle)
        ctx.arc(0, 0, circle.radius,0,Math.PI*2,true)
        ctx.clip()
        ctx.drawImage(circle.image,0-circle.radius,0-circle.radius,circle.radius*2,circle.radius*2)
        ctx.closePath()
        ctx.restore()
    }
}

function updateAndDrawCircles(){
    circles.forEach( (circle, index) => {
        if((!circle.isVisible && !circle.hasAppeared && circle.yPos <= circle.yPosInitial) || (circle.isVisible)){
            circle.xPos = calculateXPosition(circle)
            circle.yPos = calculateYPosition(circle)
            drawCircle(ctx, circle)
        }else{
            circles.splice(index,1)
        }
    })
    if(circles.length < Math.round(maxCirclesQuantity/10)){
        circles.push(...generateCircles(Math.round(Math.random()*maxCirclesQuantity),canvasWidth,canvasHeight, minRadius, maxRadius, dprGlobal, images))
    }
}

function animate(){
    const now = Date.now()
    const deltaTime = now - lastTimeFrame
    
    if(deltaTime > msBetweenFrame){
        adjustCanvasToWindow(canvas,ctx)
        clearCanvas(ctx)
        updateAndDrawCircles()
        lastTimeFrame = Date.now()
    }
    requestAnimationFrame(animate)
}

async function initCanvas(maxQuantity, sources, callback) {
    maxCirclesQuantity = maxQuantity
    try{
        images = await loadImages(sources)
        circles = generateCircles(maxCirclesQuantity,canvasWidth,canvasHeight, minRadius, maxRadius, dprGlobal, images)
        animate()
        if(typeof callback !== 'undefined'){
            callback()
        }
    }catch(err){
        console.error("error loading sources ", err)
    }
}
export {initCanvas}




