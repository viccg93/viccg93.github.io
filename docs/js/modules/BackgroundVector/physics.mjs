const gravity = 300
//considering a semi-solid in a 3 dimension plane
const restitutionFactor = 0.7
//this function is going to be decoupled by desing and it'll be using a delta time strategy for real time independency
function updateParticlePosition(particle, deltaTime){
    
    if(!particle.isAscending){
        //deltaTime is and SHOULD not be incremental, it's by design a non progresive strategy
        let normalisedDelta = normaliseTime(deltaTime)
        particle.posY = Math.round(particle.initialY + gravity*0.5*(Math.pow(normalisedDelta,2)))
    }else{
        //deltatime is assumed to be passed as a after collision value
        let normalisedDelta = normaliseTime(performance.now()-particle.collisionStamp)
        let deltaDistance = Math.round(((particle.maxSpeed * restitutionFactor)*normalisedDelta) - (0.5*gravity* Math.pow(normalisedDelta,2)))
        particle.posY=particle.posY - deltaDistance
    }
    
}

function normaliseTime(timeInMs){
    return timeInMs/1000
}

//no side effects function starategy for performance prev issues
function getMaxSpeed(totalHeight){
    return Math.sqrt(totalHeight*gravity*2)
}



export {updateParticlePosition, getMaxSpeed}