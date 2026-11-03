import {getCanvas} from '../CanvasEngine/factory.mjs'
import {registerSizingChange} from '../CanvasEngine/rendering.mjs'
import {getSvg, getBuilding} from './dataProcessing.mjs'
import {emitDebris, updateParticles, drawParticles} from './debris.mjs'
import {fallbackWeather, getWeather, getCityHour, getSky, drawSky, drawCelestial, updateRain, drawRain, emitGusts, updateStreaks, drawStreaks} from './atmosphere.mjs'

//debris emitted for every pixel the building rises, per 250px of building width
const debrisPerPixel = 0.08
const groundOpacity = 0.25
//building counts as appeared once the remaining distance is below this portion of its height
const appearedPortion = 0.05
//sky colors are recalculated with this period in milliseconds
const skyRefreshMs = 30000
//parallax depth per layer: canvas height portion a layer is shifted when the canvas is one canvas height away from rest
//negative values are far layers that move slower than the page, positive ones are near layers that move faster
const parallaxDepth = {celestial: -0.12, streaks: -0.05, building: -0.035, rain: 0.08}

//this module relies on canvasEngine, whenever canvasObj is called you should take for granted that it refers to an instance of that
function drawSprite(canvasObj, image, x, y, destinyWidth, destinyHeight){
  if (image != null) {
    canvasObj.ctx.drawImage(
      image,
      Math.floor(x),
      Math.floor(y),
      Math.floor(destinyWidth),
      Math.floor(destinyHeight)
    )
  }else{
    console.error("sprite reference could not be drawn")
  }
}

//svg is rasterised once per size and ink at device resolution, then only that bitmap is drawn on every frame
//source-in keeps line shapes and antialiasing, replacing their color with ink
function renderBuildingRaster(svg, building, ink, dpr){
  const raster = document.createElement('canvas')
  raster.width = Math.max(1, Math.ceil(building.width * dpr))
  raster.height = Math.max(1, Math.ceil(building.height * dpr))
  const rasterCtx = raster.getContext('2d')
  rasterCtx.drawImage(svg, 0, 0, raster.width, raster.height)
  rasterCtx.globalCompositeOperation = 'source-in'
  rasterCtx.fillStyle = ink
  rasterCtx.fillRect(0, 0, raster.width, raster.height)
  return raster
}

//building emerges from the ground, so anything below its baseline is hidden
function drawBuilding(canvasObj, building, image){
  canvasObj.ctx.save()
  canvasObj.ctx.beginPath()
  canvasObj.ctx.rect(0, 0, canvasObj.widthDOM, building.y)
  canvasObj.ctx.clip()
  drawSprite(canvasObj, image, building.x, building.lastY, building.width, building.height)
  canvasObj.ctx.restore()
}

function drawGround(canvasObj, building, ink){
  const margin = building.width * 0.1
  canvasObj.ctx.save()
  canvasObj.ctx.globalAlpha = groundOpacity
  canvasObj.ctx.lineWidth = 1
  canvasObj.ctx.strokeStyle = ink
  canvasObj.ctx.beginPath()
  canvasObj.ctx.moveTo(building.x - margin, building.y)
  canvasObj.ctx.lineTo(building.x + building.width + margin, building.y)
  canvasObj.ctx.stroke()
  canvasObj.ctx.restore()
}

//returns true once the building reaches its final position
function drawFramedBuilding(canvasObj, building, image, deltaTime, unitDivider){
  const timeUnits = deltaTime/unitDivider
  //prevents singularity in dt = 0 due to model h/timeUnits
  if(timeUnits <= 0){
    return false
  }
  if(timeUnits < building.maxTimeUnits){
    const space = building.height - (building.height/timeUnits)
    building.lastY = building.y - space
  }else{
    //remaining distance is below precision, final position is assured
    building.lastY = building.y - building.height
    building.isSettled = true
  }
  drawBuilding(canvasObj, building, image)
  return building.isSettled
}

//one canvas, one loop: show() swaps the building and replays its appearance
//portionForScale: building height relative to canvas height
//maxWidthPortion: max building width relative to canvas width
//unitDivider: milliseconds per time unit, bigger values mean slower appearance
//precision: pixels left to final position when motion is stopped
//hour: fixed hour of the day for the sky, null follows Mexico City clock
//weather: 'auto' follows Mexico City weather, 'rain' and 'clear' force it
//onSkyChange: called with the sky every time its ink changes, lets the page match elements over the canvas
//getArea: returns {top, height} in css pixels of the canvas band the building must fit in,
//portionForScale then applies to that band, null uses the whole canvas
//parallax: multiplier of the layer depths while scrolling, 0 turns it off
function createBuildingScene(idCanvas, {portionForScale = 0.7, maxWidthPortion = 0.8, unitDivider = 150, precision = 2, hour = null, weather = 'auto', onSkyChange = null, getArea = null, parallax = 1} = {}){
  const canvasObj = getCanvas(idCanvas)
  canvasObj.adjustSizing()
  //users asking for reduced motion get the building already in place and a still atmosphere
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  //every svg is requested once, the promise is kept so concurrent requests share it
  const svgCache = new Map()
  let svg = null, svgPath = ''
  let building = null
  const particles = [], streaks = [], drops = []
  let emitAccumulator = 0
  let startStamp = null, lastStamp = null
  let raster = null, rasterKey = ''
  let sky = null, lastSkyStamp = 0, lastInk = ''
  let isVisible = true
  let showRequest = 0

  //sky starts with approximate values and is refreshed as soon as real weather arrives
  let currentWeather = {...fallbackWeather, isRaining: weather == 'rain'}
  getWeather().then(result => {
    currentWeather = weather == 'auto' ? result : {...result, isRaining: weather == 'rain'}
    sky = null
  })

  function buildBuilding(){
    const area = getArea != null ? getArea() : {top: 0, height: canvasObj.heightDOM}
    return getBuilding({
      svg: svg,
      canvasWidth: canvasObj.widthDOM,
      canvasHeight: canvasObj.heightDOM,
      areaTop: area.top,
      areaHeight: area.height,
      portionForScale: portionForScale,
      maxWidthPortion: maxWidthPortion,
      precision: precision
    })
  }

  function loadSvg(path){
    if(!svgCache.has(path)){
      svgCache.set(path, getSvg(path))
    }
    return svgCache.get(path)
  }

  function refreshSky(currentStamp){
    sky = getSky(hour ?? getCityHour(), currentWeather)
    lastSkyStamp = currentStamp
    if(onSkyChange != null && sky.ink != lastInk){
      lastInk = sky.ink
      onSkyChange(sky)
    }
    if(building != null){
      const key = `${svgPath}:${building.width}x${building.height}@${canvasObj.globalDPR}:${sky.ink}`
      if(key != rasterKey){
        raster = renderBuildingRaster(svg, building, sky.ink, canvasObj.globalDPR)
        rasterKey = key
      }
    }
  }

  //scroll position of the canvas relative to rest, rest means its top edge on the top of the viewport
  //canvas height is the unit instead of the viewport, so mobile toolbars showing and hiding do not shake the layers
  //result goes from -1 to 1, reduced motion keeps every layer still
  function getScrollShift(){
    if(reducedMotion || parallax == 0 || canvasObj.heightDOM == 0){
      return 0
    }
    const top = canvasObj.canvas.getBoundingClientRect().top
    return Math.max(-1, Math.min(1, top/canvasObj.heightDOM))
  }

  //loop never ends: once the building is in place the atmosphere keeps moving
  function animate(currentStamp){
    requestAnimationFrame(animate)
    //first frame stamp is used as origin, so deltaTime never starts negative
    if(startStamp == null){
      startStamp = currentStamp
      lastStamp = currentStamp
    }
    //capped so a background tab does not throw particles across the canvas when it comes back
    const frameSeconds = Math.min((currentStamp - lastStamp)/1000, 0.05)
    lastStamp = currentStamp
    //off screen canvases skip all drawing work
    if(!isVisible){
      return
    }
    //deltaTime means in this context time elapsed from first frame
    const deltaTime = reducedMotion ? Infinity : currentStamp - startStamp
    if(sky == null || currentStamp - lastSkyStamp > skyRefreshMs){
      refreshSky(currentStamp)
    }
    const width = canvasObj.widthDOM, height = canvasObj.heightDOM
    const ctx = canvasObj.ctx
    //every layer is drawn with its own vertical offset, physics keeps working in unshifted coordinates
    const shift = getScrollShift() * parallax * height
    const offsetOf = layer => shift * parallaxDepth[layer]

    //sky is a gradient over the whole canvas, shifting it would not be noticed
    drawSky(ctx, width, height, sky)
    ctx.save()
    ctx.translate(0, offsetOf('celestial'))
    drawCelestial(ctx, width, height, sky)
    ctx.restore()

    //ground, building and debris move together, the building keeps fitting its slot
    ctx.save()
    ctx.translate(0, offsetOf('building'))
    if(building != null){
      drawGround(canvasObj, building, sky.ink)
      const previousTop = building.lastY
      const isSettled = drawFramedBuilding(canvasObj, building, raster, deltaTime, unitDivider)

      //ground only breaks while the building is rising above it, faster rise means more debris
      const rise = previousTop - building.lastY
      if(!isSettled && rise > 0 && building.lastY < building.y){
        emitAccumulator += rise * debrisPerPixel * (building.width/250)
        const amount = Math.floor(emitAccumulator)
        emitAccumulator -= amount
        if(amount > 0){
          emitDebris(particles, building, amount)
        }
      }

      //air starts passing once the building is visibly in place, not when the 1/t tail ends
      const remaining = building.lastY - (building.y - building.height)
      if(!reducedMotion && remaining <= building.height * appearedPortion){
        emitGusts(streaks, width, height, frameSeconds)
      }
    }
    updateParticles(particles, frameSeconds, deltaTime/1000)
    drawParticles(ctx, particles, sky.ink)
    ctx.restore()

    updateStreaks(streaks, width, frameSeconds)
    ctx.save()
    ctx.translate(0, offsetOf('streaks'))
    drawStreaks(ctx, streaks, sky.ink)
    ctx.restore()

    //rain covers the whole canvas, so instead of translating it the drops wrap around its height
    updateRain(drops, width, height, reducedMotion ? 0 : frameSeconds, sky.isRaining)
    drawRain(ctx, drops, sky.ink, height, offsetOf('rain'))
  }

  //restarting only resets the state, the loop is the same
  function startAnimation(){
    building = svg != null ? buildBuilding() : null
    particles.length = 0
    streaks.length = 0
    emitAccumulator = 0
    startStamp = null
    sky = null
  }

  async function show(path){
    const request = ++showRequest
    const loaded = await loadSvg(path)
    //a newer selection arrived while this one was loading, or the svg failed
    if(request != showRequest || loaded == null){
      return
    }
    svg = loaded
    svgPath = path
    startAnimation()
  }

  function preload(paths){
    paths.forEach(loadSvg)
  }

  //canvas can be sized in vw/vh, any change on its drawing area restarts the animation
  //device pixels are compared so zoom and dpr changes are covered as well
  let lastWidth = canvasObj.cWidth, lastHeight = canvasObj.cHeight
  registerSizingChange(canvasObj, ()=>{
    if(canvasObj.cWidth != lastWidth || canvasObj.cHeight != lastHeight){
      lastWidth = canvasObj.cWidth
      lastHeight = canvasObj.cHeight
      drops.length = 0
      startAnimation()
    }
  })

  new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting
  }).observe(canvasObj.canvas)

  requestAnimationFrame(animate)
  return {show, preload}
}

//single building shortcut, kept for pages that draw one fixed building per canvas
async function initBuilding(idCanvas, svgPath, options = {}){
  const scene = createBuildingScene(idCanvas, options)
  await scene.show(svgPath)
  return scene
}

export {drawSprite, drawFramedBuilding, createBuildingScene, initBuilding}
