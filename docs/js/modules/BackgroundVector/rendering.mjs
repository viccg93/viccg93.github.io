function initParticles(canvas, particles){
    for(let i=0; i < particles.length; i++){
        drawParticle(canvas, particles[i])
    }
}

function drawParticle(canvas, particle){
    canvas.ctx.fillStyle = particle.fillStyle
    canvas.ctx.beginPath()
    canvas.ctx.arc(particle.initialX,60, particle.radius, 0, Math.PI*2,false)
    canvas.ctx.fill()
    canvas.ctx.closePath()
}

export {initParticles}

