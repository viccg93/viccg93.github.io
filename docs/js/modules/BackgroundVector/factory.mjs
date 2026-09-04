const initialYFrameSafe = 10

function generateParticles(maxQuantity, minRadius, maxRadius, cWidth, cHeight, color, zoneRadius){
    let numberOfPartcicles = Math.round((Math.random() * (maxQuantity-1)) + 1)
    let particles = []
    let i=0
    while(i<maxQuantity){
        particles.push(generateParticle(minRadius, maxRadius, cWidth, cHeight, color, zoneRadius))
        i++
    }
    return particles

}

//pixel integer is handled, therefore round operations are used across this whole function
//zoneRadius smaller tham cHeight is asummed, ought to be validated somewhere else
function generateParticle(minRadius, maxRadius, cWidth, cHeight, color, zoneRadius){
    return {
        radius: Math.round((Math.random()*maxRadius) + minRadius),
        //this value isn't magical, it does represent superior non visible limit on y axis
        initialY: -Math.round((Math.random() * 60) + 20),
        initialX: Math.round((Math.random()*cWidth - 1) + 1),
        fillStyle: color,
        destinyY: Math.round(Math.random * (cHeight - zoneRadius)),
        //using conservative sys lib for not dealing on 64 float values
        //improvement at future releases
        initialStamp: Date.now(),
        isAscending: false
    } 
}



export {generateParticles}