import {calculateAngle, assignXPosition, assignYPosition, assignSpeed} from './physics.mjs'

function generateCircles(quantityMaxLimit=0, canvasWidth, canvasHeight, minRadius, maxRadius,dpr, images){
    if(quantityMaxLimit == 0){quantityMaxLimit = 200}
    const realQuantity = Math.round((Math.random()*(quantityMaxLimit-1))+1)
    const positiveLimit = realQuantity - Math.round(realQuantity/3)
    //array with size of realQuantity is created on the fly
    return Array.from({length: realQuantity},(_,index)=>{
        const isNegativeSpace = index > positiveLimit
        return generateCircle(canvasWidth, canvasHeight, minRadius/dpr, maxRadius/dpr, images, isNegativeSpace)
    })
}

function generateCircle(canvasWidth, canvasHeight, minRadius, maxRadius, images, isNegativeSpace){
    //ensures this function works even if zero values for dimensions are passed
    canvasWidth=canvasWidth<=0?300:canvasWidth
    canvasHeight=canvasHeight<=0?300:canvasHeight
    
    const yPos = assignYPosition(canvasHeight)
    const xPos = assignXPosition(canvasWidth, isNegativeSpace)
    const earlyAngle = calculateAngle(canvasWidth, canvasHeight, xPos, yPos)
    const imgIndex = Math.trunc(Math.random()*(images.length-1))
    const spinStepSlice = 360

    let circle = {
        yPos: yPos,
        xPos: xPos,
        yPosInitial: yPos,
        angle: earlyAngle,
        spinAngle: 0,
        spinStep: (Math.PI * 2) / ((Math.random() * spinStepSlice) + spinStepSlice),
        speed: assignSpeed(yPos,earlyAngle, canvasHeight),
        radius: Math.round(Math.random() * (maxRadius - minRadius) + minRadius),
        initialStamp: Date.now(),
        hasAppeared: false,
        isVisible: false,
        image: images[imgIndex],
        validateAppearance(){
            if(!this.hasAppeared && this.xPos > 0 && this.xPos < canvasWidth && this.yPos > 0 && this.yPos < canvasHeight){
                this.isVisible = true
                this.hasAppeared = true
            }
        },
        validateVisibility(){
            if(this.hasAppeared && 
                (this.xPos < (-1 * this.radius) || this.xPos > (canvasWidth + this.radius) || 
                this.yPos > (canvasHeight + this.radius) || this.yPos < (-1 * this.radius))
            ){
                this.isVisible = false
            }
        },
        validateDrawability(){
            this.validateAppearance()
            this.validateVisibility()
            let result = false
            if(this.isVisible && this.hasAppeared){
                result = true
            }
            return result
        },
    }
    return circle
}

export {generateCircles}

