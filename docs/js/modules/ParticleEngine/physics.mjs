/*
*Developed by Cha0t1cR1zh0m4
*/ 
 
 //round() operations on pixel positions are necessary due canvas pixels are integers, not using it would mean extra overload
const gravity = 40
function calculateAngle(canvasWidth, canvasHeight, xPos, yPos){
    let deltaXRD = xPos - canvasWidth
    let minimalGap = Math.PI/64
    //theta and thetaPrime are uncountinous functions, so division over zero should be handled
    //even if due to initial conditions like canvas dimensions never let those values be zero for math coherent model
    //though atan is valid due to initial zone is always greater than canvasheight model cannot rely on those conditions
    let theta = Math.atan2(yPos,deltaXRD)
    let thetaPrime = Math.atan2(yPos,xPos)
    
    //cTheta turns into zero only when theta is less than zero
    //the main model relies on division, so not computable values should be handled as well
    //cases when atan2 returns -0 are not possible due to yPos is always positive, but this should be handled as part of the model
    //it's handled as 1 because canvas use pixels for drawing
    if(theta == 0 || theta == -0){theta = 1}
    if(thetaPrime == 0 || thetaPrime == -0){thetaPrime = 1} 
    //the math model is by definition a not continous function, but at this point is guaranteed that zero values don't 
    //get into the math model 
    let minAngle = Math.abs((1/2*((theta/Math.abs(theta))+1)* Math.PI) - theta)
    let maxAngle = Math.abs((1/2*((thetaPrime/Math.abs(thetaPrime))+1)* Math.PI) - thetaPrime)
    let angle = Math.random() * (maxAngle -(Math.PI/64)- minAngle) + (minAngle + minimalGap)
    return angle
}

function assignXPosition(canvasWidth, isNegativeSpace){
    let xPos = 0
    //toffside means how many times x-axis is bigger for x value assignation
    const offside = 2
    if(!isNegativeSpace){
        xPos = Math.round(Math.random()*(canvasWidth*offside))
    }else{
        xPos = -Math.round(Math.random()*(canvasWidth))
    }
    return xPos
}

function assignYPosition(canvasHeight){
    //offside means the minimal gap area between visible canvas and the y-axis limit for possible y values
    const offside = 100
    const yPos = Math.round((Math.random()*(canvasHeight)) + (canvasHeight + offside))
    return yPos
}

function calculateXPosition(circle, now){
    const t = (now - circle.initialStamp) / 1000
    return Math.round(circle.xPosInitial + circle.speed * Math.cos(circle.angle) * t)
}

function calculateYPosition(circle, now){
    const t = (now - circle.initialStamp) / 1000
    const y = circle.yPosInitial - (circle.speed * Math.sin(circle.angle) * t - 0.5 * gravity * t * t)
    return Math.round(y)
}

const minSinAngle = 0.25
const apexBias = 2   // 1 = uniforme, 2 = sesgado hacia el borde superior

function assignSpeed(yPos, angle, canvasHeight){
    const apex = Math.pow(Math.random(), apexBias) * canvasHeight
    const sinAngle = Math.max(Math.sin(angle), minSinAngle)
    return Math.sqrt(2 * gravity * (yPos - apex)) / sinAngle
}

//tiempo que tarda la partícula en volver a su altura inicial
function flightDuration(speed, angle){
    return (2 * speed * Math.sin(angle)) / gravity
}

export {calculateAngle, assignXPosition, assignYPosition, calculateXPosition, calculateYPosition, assignSpeed, flightDuration}