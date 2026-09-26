const gravity = 400
//considering a semi-solid in a 3 dimension plane
const bouncingFactor = 0.7
//this function is going to be decoupled by desing and it'll be using a delta time strategy for real time independency
function updateParticlePosition(particle, deltaTime){
    
    if(!particle.isAscending){
        //deltaTime is and SHOULD not be incremental, it's by design a non progresive strategy
        let normalisedDelta = normaliseTime(deltaTime)
        particle.posY = Math.round(particle.initialY + gravity*0.5*(Math.pow(normalisedDelta,2)))
    }else{
        //deltatime is assumed to be passed as a after collision value
        let normalisedDelta = normaliseTime(performance.now()-particle.collisionStamp)
        
        let deltaDistance = (particle.collisionSpeed*normalisedDelta) + (0.5*gravity*normalisedDelta*normalisedDelta)
        particle.posY=Math.round(particle.posCollision - deltaDistance)
    }
    
}

function normaliseTime(timeInMs){
    return timeInMs/1000
}

function getCollisionSpeed(totalHeight){
    return Math.sqrt(2*gravity*totalHeight) * bouncingFactor
}



export {updateParticlePosition, getCollisionSpeed}