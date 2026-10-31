//debris and displaced air emitted at ground level while a building breaks through it
//all values are assumed in css pixels and seconds
const gravity = 900
const shardColor = '#0a0a0a'
const dustColor = 'rgb(120, 120, 120)'
const dustOpacity = 0.14
const maxShardsPerFrame = 10

//particle sizes and speeds are proportional to building height, 420px is the reference
function getScale(building){
  return Math.max(0.5, building.height/420)
}

function createShard(building, scale){
  const size = (2 + Math.random()*4) * scale
  return {
    kind: 'shard',
    x: building.x + Math.random()*building.width,
    y: building.y,
    vx: (Math.random() - 0.5) * 220 * scale,
    vy: -(140 + Math.random()*300) * scale,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 14,
    //irregular triangle, vertices are relative to its center
    vertices: [
      [-size, -size*Math.random()],
      [size*Math.random(), -size],
      [size*(0.5 + Math.random()*0.5), size]
    ],
    groundY: building.y,
    life: 0,
    maxLife: 0.8 + Math.random()*0.8
  }
}

function createPuff(building, scale){
  const x = building.x + Math.random()*building.width
  //air is pushed away from the building center
  const direction = x < building.x + building.width/2 ? -1 : 1
  return {
    kind: 'puff',
    x: x,
    y: building.y - Math.random()*6*scale,
    vx: direction * (30 + Math.random()*90) * scale,
    vy: -(8 + Math.random()*24) * scale,
    radius: (3 + Math.random()*6) * scale,
    growth: (10 + Math.random()*16) * scale,
    life: 0,
    maxLife: 1.2 + Math.random()*1.2
  }
}

function emitDebris(particles, building, amount){
  const scale = getScale(building)
  const shards = Math.min(amount, maxShardsPerFrame)
  for(let i=0; i<shards; i++){
    particles.push(createShard(building, scale))
  }
  //roughly one puff for every two shards
  for(let i=0; i<Math.ceil(shards/2); i++){
    particles.push(createPuff(building, scale))
  }
}

//time is the elapsed animation time, it drives a light breeze shared by every particle
function updateParticles(particles, frameSeconds, time){
  const wind = 25*Math.sin(time*1.1) + 10*Math.sin(time*2.7)
  for(const particle of particles){
    particle.life += frameSeconds
    if(particle.kind == 'shard'){
      particle.vy += gravity * frameSeconds
      particle.vx += wind * 0.4 * frameSeconds
      particle.x += particle.vx * frameSeconds
      particle.y += particle.vy * frameSeconds
      particle.angle += particle.spin * frameSeconds
      //shards falling back below ground level are swallowed by the hole
      if(particle.vy > 0 && particle.y > particle.groundY){
        particle.life = particle.maxLife
      }
    }else{
      //drag slows the puff down until only the breeze moves it
      particle.vx *= Math.pow(0.15, frameSeconds)
      particle.x += (particle.vx + wind) * frameSeconds
      particle.y += particle.vy * frameSeconds
      particle.radius += particle.growth * frameSeconds
    }
  }
  //in place compaction keeps the same array reference
  let alive = 0
  for(const particle of particles){
    if(particle.life < particle.maxLife){
      particles[alive++] = particle
    }
  }
  particles.length = alive
}

//ink lets shards follow the line color of the building
function drawParticles(ctx, particles, ink = shardColor){
  ctx.save()
  ctx.lineWidth = 1.2
  ctx.strokeStyle = ink
  ctx.fillStyle = dustColor
  for(const particle of particles){
    const fade = 1 - particle.life/particle.maxLife
    ctx.beginPath()
    if(particle.kind == 'shard'){
      //rotation is applied on vertices directly, avoiding a save/restore per shard
      const cos = Math.cos(particle.angle), sin = Math.sin(particle.angle)
      particle.vertices.forEach(([vx, vy], index)=>{
        const px = particle.x + vx*cos - vy*sin
        const py = particle.y + vx*sin + vy*cos
        index == 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.closePath()
      ctx.globalAlpha = fade
      ctx.stroke()
    }else{
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI*2)
      ctx.globalAlpha = dustOpacity * fade
      ctx.fill()
    }
  }
  ctx.restore()
}

export {emitDebris, updateParticles, drawParticles}
