let bgImages
let dprGlobal = 1, canvasWidth = 100, canvasHeight=100
let initialStamp = 0, lastTimeFrame=0
const msPerFrame = 1000/120
let ctx

const multiplier = 120
const gravity = 9.81 * multiplier //ms/s²
const ec = 0.5 //restitution coeficient
let isBouncing = false
let bouncingUp = false
let bouncingSpeed = 0
let bouncingMaxHeight = 0
let bouncingStamp = 0
let bouncingCount = 0
let coeficientRestitution = 0.7
let yPos = 0

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
    }
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

async function initLine(sources, idCanvas){
    try{
        let canvas = document.getElementById(idCanvas)
        ctx = canvas.getContext('2d')
        if(sources != false){
            /*
            bgImages = await loadImages(sources)
            if(bgImages.length > 0){
                let canvas = document.getElementById(idCanvas)
                ctx = canvas.getContext('2d'/*, {willReadFrequently: true} **)
                adjustCanvasToWindow(canvas,ctx)
                drawDefaultImage(bgImages[0], ctx)
                initialStamp = Date.now()
                lastTimeFrame = initialStamp
                animate()
                */
               console.log("non formal implementation")
        }else{
            //entry point for drawindg in testing phase
            adjustCanvasToWindow(canvas, ctx)
            let numberOfElements = 5
            let horizontalSpacing = canvasWidth*0.20
            let adjustedRadius = getAdjustedRadius(canvasWidth,numberOfElements,horizontalSpacing)
            ctx.beginPath()
            ctx.fillStyle = 'rgba(0,0,255,0.8)'
            ctx.arc(adjustedRadius,adjustedRadius,adjustedRadius,0,Math.PI*2,false)
            ctx.fill()
            ctx.closePath()

        }
    } catch(err){
        console.error("error loading named sources ", err)
    }
}
//images are going to be passed using event handlers
function drawDefaultImage(image, ctx){
    //ctx.fillStyle = 'rgba(64,21,89,1)'
    ctx.beginPath()
    ctx.drawImage(image,0,0,canvasWidth,canvasHeight)
    /*
    ctx.arc(300,300,200,0,Math.PI*2, false)
    ctx.fill()
    */
    ctx.closePath()
    let pixelSchema = generatePixelSchema(ctx).then(data =>{
        generateGlobalPixelEnsamble(data.data)

    })
    console.log('...')
}

async function generatePixelSchema(ctx){
    return ctx.getImageData(0,0,canvasWidth,canvasHeight)
}

function generateGlobalPixelEnsamble(data){
    //this step is neccesary due to univocity and flattened nature of data array returned by data pixel mechanism
    let totalNumberOfPixels = canvasWidth*canvasHeight
    if(totalNumberOfPixels == data.length){
        console.log("same size")
    }else{
        console.log("not same size")
    }
}

function animate(){
    const now = Date.now()
    const elapsedTime = now - lastTimeFrame
    if(elapsedTime > msPerFrame){
        if(!isBouncing){
            yPos = getNewDrawingPosition(initialStamp)
            console.log(`yPos: ${yPos}`)
            if(yPos <= 1){
                clearCanvas(ctx)
                drawImage(ctx, bgImages[0], yPos)
            }else{
                //this happens on free fall reaching limit
                isBouncing = true
                bouncingSpeed = calculateBouncingSpeed(canvasHeight)
                bouncingMaxHeight = calculateBouncingMaxHeight(canvasHeight)
                bouncingStamp =Date.now()
            }
        }else{
            //this happens when bouncing state has already happened
            clearCanvas(ctx)
            console.log(yPos)
            
        }
        lastTimeFrame = Date.now()
    }
    requestAnimationFrame(animate)
}

//TODO shit to refactor 

function getNewDrawingPosition(initialStamp){
    let elapsedTime = Date.now() - initialStamp
    return Math.round((-canvasHeight) + calculateDistance(elapsedTime/1000))
}

function getNewDrawingPositionOnBouncing(bouncingStamp){
    let elapsedTime = Date.now() - bouncingStamp
    return Math.round()
}

function calculateDistance(time){
    return Math.round((0.5)*gravity*(Math.pow(time,2)))
}

function calculateBouncingSpeed(height){
    return ec * Math.sqrt(2*gravity*height)
}

function calculateBouncingMaxHeight(height){
    //this value is normalized to limit marked onto canvas logic
    return canvasHeight - Math.round(Math.pow(ec,2)*height)
}

function drawImage(ctx, image, yPos){
    ctx.beginPath()
    ctx.drawImage(image,0,yPos,canvasWidth,canvasHeight)
    ctx.closePath()
}

function clearCanvas(ctx){
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.rect(0,0,canvasWidth, canvasHeight)
    ctx.fill()
    ctx.closePath()
}

//******************************************space sizing and references */

let liminalRadius = 0

//adjuster is a regulator for relation between available space and radius tendency to increase
function getAdjustedRadius(width, numberOfElements, horizontalSpacing){
    return Math.round(((width-horizontalSpacing)/(numberOfElements*2)))
}

function calculateGapBetweenCircles(numberOfCircles, adjustedRadius, width, limitGap){
    return (((width-limitGap)/numberOfCircles)-adjustedRadius)
}



export {initLine}
