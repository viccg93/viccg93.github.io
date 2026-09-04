const gravity = 30
//this function is going to be decoupled by desing and it'll be using a delta time strategy for real time independency
function updateParticlePosition(particle, deltaTime){
    //deltaTime is and SHOULD not be incremental, it's by design a non progresive strategy
    let normalisedDelta = normaliseTime(deltaTime)
    particle.posY = Math.round(particle.initialY + gravity*0.5*(Math.pow(normalisedDelta,2)))
}

function normaliseTime(timeInMs){
    return timeInMs/1000
}

export {updateParticlePosition}