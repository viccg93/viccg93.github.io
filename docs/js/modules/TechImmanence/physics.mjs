
const gravity = 9.8
//developed by Cha0t1cR1zh0m4
function calculateAngle(canvasWidth, canvasHeight, xPos, yPos){
    let deltaXRD = xPos - canvasWidth
    let minimalGap = Math.PI/64
    //theta and thetaPrime are uncountinous functions, so division over zero should be handled
    //even if due to initial conditions like canvas dimensions never let those values be zero for math coherent model
    let deltaYRD = yPos - canvasHeight
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
    const offsideDivider = 0.5
    const yPos = Math.round((Math.random()*(canvasHeight)) + offside)
    return yPos
}

function calculateXPosition(circle){
    const elapsedTime = Date.now() - circle.initialStamp
    const xPos = circle.xPos + (circle.speed * Math.cos(circle.angle)*(elapsedTime/1000))
    //round() is necessary due canvas pixels are integers, not using it would mean extra overload
    return Math.round(xPos)
}

function calculateYPosition(circle){
    const elapsedTime = Date.now() - circle.initialStamp
    //1000 is a value needed for conversion between ms -> seconds
    const yPos = circle.yPos - (circle.speed * Math.sin(circle.angle)*(elapsedTime/1000)-(0.5*gravity*(Math.pow((elapsedTime/1000 ),2))))
    //round() is necessary due canvas pixels are integers, not using it would mean extra overload
    return Math.round(yPos)
}

function assignSpeed(yPos, angle, canvasHeight){
    //this value normalise minimal speed to fps
    //TODO this value should be revised to guarantee optimal performance on a general relation between x-axis and y-axis
    //const speedNormalisationRatio = (90/1000)
    //minimal speed based on parabolic model to canvas height which limits origin zone's y-axis

    //TODO check up these shit ton stuff that's on the main model

    //stocastic generation with nounces to a not optimal speed
    //tendency to infinite over the next thesis 1/sin^2(theta) -> infinite
    //revisions over the continuity of the model now that math coherency is proven by GPT

    //const minimalSpeed = Math.sqrt((2*gravity)*(yPos-canvasHeight))/Math.pow(Math.sin(angle),2)*(90/1000)
    //angle should be guaranteed to not be theta -> 0
    //epsilon prevents tendency to infinite on sin²(theta)
    const epsilon = 0.05
    const sinAngle = Math.sin(angle)
    const speedRelation = (sinAngle * sinAngle) + (epsilon*epsilon)
    //speedNormalisation is now avoided
    //const minimalSpeed = Math.sqrt((2*gravity)*(yPos-canvasHeight))/Math.pow(Math.sin(angle),2)*(90/1000)
    const minimalSpeed = Math.sqrt((2*gravity*(yPos-canvasHeight))/speedRelation)
    return generateStocasticVariation(minimalSpeed)
}

function generateStocasticVariation(minimalSpeed){
    //this is modified just to the value of speed that's contained into a treshold of gaussian limit generator
    //using single gaussian and not box-muller double limit behaviour sigma -> 0.5 (chaotic behaivour)
    let sigma = 0.4
    return Math.max(0, minimalSpeed * (1 + (sigma * generateGaussianNoise())))
}

//this should implement this model  
//f(u,v)=sqrt(−2ln(u)​cos(2πv))
//proven continuity on uE[0,1] y vE[0,1]
function generateGaussianNoise(){
    let u=0, v=0
    while(u===0) {u = Math.random()}
    while(v===0) {v = Math.random()}
    //return f(u,v)
    return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v)
}
export {calculateAngle, assignXPosition, assignYPosition, calculateXPosition, calculateYPosition, assignSpeed}