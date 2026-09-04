import {updateParticlePosition, getMaxSpeed} from './physics.mjs'
let initialStamp = 0
let lastStampRecorded = 0
//this value is for 60 fps
const framewindow = 1000/120
// canvas and array set globally for closure strategy
let canvas
let particles = []

function initParticles(canvas, particles){
    for(let i=0; i < particles.length; i++){
        drawParticle(canvas, particles[i])
        //max speed bypassed here, SHOULD be evaluated as a temp place, COHERENT model not validated
        //this axiom is all cases valid
        particles[i].maxSpeed = getMaxSpeed(canvas.cHeight -(particles[i].initialY))
    }
}

//TODO this should be OPTIMISED for non nominal cases and avoid repetitive axiom
function updateAnddrawParticles(deltaTime){
    canvas.clearWhole()
    for(const particle of particles){
        updateParticlePosition(particle,deltaTime)
        //dirty patch prev refactor
        if(!particle.isAscending && (particle.posY + particle.radius)>canvas.cHeight){
            particle.posY = canvas.cHeight-particle.radius
            drawParticleOnMotion(canvas, particle)
            particle.isAscending = true
            particle.collisionStamp = performance.now()
        }else{
            drawParticleOnMotion(canvas, particle)
        }
        
    }
    console.log("posY: " + particles[0].posY)
}

//this should be REMOVED
function drawParticle(canvas, particle){
    canvas.ctx.fillStyle = particle.fillStyle
    canvas.ctx.beginPath()
    canvas.ctx.arc(particle.initialX,particle.initialY, particle.radius, 0, Math.PI*2,false)
    canvas.ctx.fill()
    canvas.ctx.closePath()
}

function drawParticleOnMotion(canvas, particle){
    canvas.ctx.fillStyle = particle.fillStyle
    canvas.ctx.beginPath()
    canvas.ctx.arc(particle.initialX,particle.posY, particle.radius, 0, Math.PI*2,false)
    canvas.ctx.fill()
    canvas.ctx.closePath()
}

function initAnimation(_canvas, _particles){
    canvas = _canvas
    particles = _particles
    //first axiom of initial time and delta equalty
    initialStamp = performance.now()
    lastStampRecorded = initialStamp
    animate()
}

//particles are bypassed using closure for V8 performance
function animate(){
    console.log("animation triggered")
    if(validateFrameExec(lastStampRecorded)){
        let deltaTime = performance.now() - initialStamp
        console.log("=== animation fully executed at: " + lastStampRecorded)
        console.log("deltaTime: " + deltaTime)
        console.log(particles.length)
        updateAnddrawParticles(deltaTime)
    }else{
        console.log("animation not triggered, awaits")
    }
    lastStampRecorded  = performance.now()
    window.requestAnimationFrame(animate)
}

function validateFrameExec(stamp){
    let isReady = false
    if(performance.now() - stamp >= framewindow){
        isReady = true
    }
    return isReady
}



export {initParticles, initAnimation}

