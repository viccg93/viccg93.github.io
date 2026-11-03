//sky, sun, moon, rain and passing air around a building
//time and weather follow Mexico City, where every building is located
//all values are assumed in css pixels, seconds and hours of the day
const timeZone = 'America/Mexico_City'
const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=19.4326&longitude=-99.1332&current=weather_code&daily=sunrise,sunset&timezone=America%2FMexico_City&forecast_days=1'
//wmo weather codes for drizzle, rain, showers and thunderstorms
const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]
//approximate sunrise and sunset for the city, used until the weather service answers or if it fails
const fallbackWeather = {isRaining: false, sunrise: 6.5, sunset: 18.5}
//hours it takes the sky to go from night to day and back
const transitionHours = 1.5

const palette = {
  night: {top: [11, 16, 38], bottom: [28, 37, 65]},
  dawn: {top: [58, 74, 122], bottom: [246, 169, 107]},
  day: {top: [142, 197, 238], bottom: [230, 243, 251]},
  dusk: {top: [74, 59, 107], bottom: [240, 138, 93]}
}
const darkInk = [10, 10, 10]
const lightInk = [232, 236, 242]
//sky luminance above which dark lines contrast better than light ones
const inkThreshold = 0.42
const sunColor = '#f2a93b'
const moonColor = '#f1ead2'
//horizontal speed of rain drops, it gives their slant
const rainWind = 90
const gustsPerSecond = 0.7

let weatherRequest = null

//a single request is shared by every canvas on the page
function getWeather(){
  if(weatherRequest == null){
    weatherRequest = fetch(weatherUrl)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('weather service answered ' + response.status)))
      .then(data => ({
        isRaining: rainCodes.includes(data.current.weather_code),
        sunrise: isoToHours(data.daily.sunrise[0]),
        sunset: isoToHours(data.daily.sunset[0])
      }))
      .catch(error => {
        console.log(error)
        return {...fallbackWeather}
      })
  }
  return weatherRequest
}

//iso local time like 2026-10-31T06:36 into fractional hours
function isoToHours(iso){
  const [hours, minutes] = iso.slice(11, 16).split(':').map(Number)
  return hours + minutes/60
}

function getCityHour(date = new Date()){
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23'}).formatToParts(date)
  const get = type => Number(parts.find(part => part.type == type).value)
  return get('hour') + get('minute')/60 + get('second')/3600
}

function mix(a, b, factor){
  return a.map((value, index) => value + (b[index] - value)*factor)
}

function toRgb(color){
  return `rgb(${color.map(Math.round).join(', ')})`
}

function luminance([r, g, b]){
  return (0.2126*r + 0.7152*g + 0.0722*b)/255
}

function grey(color){
  const value = luminance(color) * 255 * 0.9
  return [value, value, value]
}

//0 when the body rises, 1 when it sets: the sun travels from sunrise to sunset, the moon the rest of the day
function getArcProgress(hour, sunrise, sunset, isDay){
  if(isDay){
    return (hour - sunrise)/(sunset - sunrise)
  }
  const nightLength = 24 - (sunset - sunrise)
  return ((hour - sunset + 24) % 24)/nightLength
}

function getSky(hour, weather){
  const {sunrise, sunset} = weather
  //keyframes are anchored to real sunrise and sunset, colors are interpolated between them
  const keys = [
    [sunrise - transitionHours, palette.night],
    [sunrise, palette.dawn],
    [sunrise + transitionHours, palette.day],
    [sunset - transitionHours, palette.day],
    [sunset, palette.dusk],
    [sunset + transitionHours, palette.night]
  ]
  let colors = palette.night
  for(let i=0; i<keys.length-1; i++){
    const [fromHour, from] = keys[i], [toHour, to] = keys[i+1]
    if(hour >= fromHour && hour < toHour){
      const factor = (hour - fromHour)/(toHour - fromHour)
      colors = {top: mix(from.top, to.top, factor), bottom: mix(from.bottom, to.bottom, factor)}
      break
    }
  }
  let {top, bottom} = colors
  if(weather.isRaining){
    //rain washes colors out towards a grey of similar brightness
    top = mix(top, grey(top), 0.6)
    bottom = mix(bottom, grey(bottom), 0.6)
  }
  //ink is the line color for building, debris and rain, it must contrast with the sky behind the building
  //it is either dark or light, an interpolated grey would contrast with nothing on mid tone skies
  //buildings sit on the lower part of the canvas, so that is where the sky is measured
  const ink = luminance(mix(top, bottom, 0.65)) > inkThreshold ? darkInk : lightInk
  const isDay = hour >= sunrise && hour < sunset
  return {
    top: toRgb(top),
    bottom: toRgb(bottom),
    ink: toRgb(ink),
    isDay: isDay,
    isRaining: weather.isRaining,
    progress: getArcProgress(hour, sunrise, sunset, isDay)
  }
}

function drawSky(ctx, width, height, sky){
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, sky.top)
  gradient.addColorStop(1, sky.bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function drawCelestial(ctx, width, height, sky){
  const x = width * (0.08 + 0.84*sky.progress)
  const y = height * (0.42 - 0.3*Math.sin(Math.PI*sky.progress))
  const radius = Math.max(8, Math.min(width, height) * 0.035)
  ctx.save()
  //clouds are implied by dimming the body when it rains
  ctx.globalAlpha = sky.isRaining ? 0.35 : 1
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  if(sky.isDay){
    ctx.strokeStyle = sunColor
    ctx.arc(x, y, radius, 0, Math.PI*2)
    for(let i=0; i<8; i++){
      const angle = i * Math.PI/4
      ctx.moveTo(x + Math.cos(angle)*radius*1.45, y + Math.sin(angle)*radius*1.45)
      ctx.lineTo(x + Math.cos(angle)*radius*1.9, y + Math.sin(angle)*radius*1.9)
    }
  }else{
    //crescent: outer left half circle closed by a narrower half ellipse
    ctx.strokeStyle = moonColor
    ctx.arc(x, y, radius, -Math.PI/2, Math.PI/2, true)
    ctx.ellipse(x, y, radius*0.45, radius, 0, Math.PI/2, Math.PI*1.5, false)
    ctx.closePath()
  }
  ctx.stroke()
  ctx.restore()
}

//drops are born up to this distance above the canvas
const dropSpawnBand = 40

function createDrop(width, height, scale, anywhere){
  return {
    //drops drift with the wind, so they are born a bit to the left of the canvas too
    x: Math.random()*width*1.2 - width*0.2,
    y: anywhere ? Math.random()*height : -Math.random()*dropSpawnBand,
    length: (10 + Math.random()*14) * scale,
    speed: (520 + Math.random()*300) * scale
  }
}

function updateRain(drops, width, height, frameSeconds, isRaining){
  const scale = Math.max(0.5, height/640)
  const target = isRaining ? Math.round(width*height/9000) : 0
  while(drops.length < target){
    drops.push(createDrop(width, height, scale, true))
  }
  drops.length = Math.min(drops.length, target)
  for(const drop of drops){
    drop.y += drop.speed * frameSeconds
    drop.x += rainWind * frameSeconds
    if(drop.y - drop.length > height){
      Object.assign(drop, createDrop(width, height, scale, false))
    }
  }
}

//offset shifts drops vertically for parallax, a drop pushed out of one edge comes back from the other one,
//rain is random so the wrap is not noticed and the canvas never shows an empty band
function drawRain(ctx, drops, ink, height = 0, offset = 0){
  if(drops.length == 0){
    return
  }
  ctx.save()
  ctx.strokeStyle = ink
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  //a single path keeps rain at one stroke call per frame
  ctx.beginPath()
  for(const drop of drops){
    //slant follows the wind: horizontal over vertical speed
    const slant = rainWind/drop.speed
    let y = drop.y
    if(offset != 0){
      //a drop lives between the spawn band and its tail leaving the bottom edge
      const span = height + dropSpawnBand + drop.length
      y = (((y + offset + dropSpawnBand) % span) + span) % span - dropSpawnBand
    }
    ctx.moveTo(drop.x, y)
    ctx.lineTo(drop.x - slant*drop.length, y - drop.length)
  }
  ctx.stroke()
  ctx.restore()
}

//a gust is a group of one to three parallel wavy streaks crossing from left to right
function emitGusts(streaks, width, height, frameSeconds){
  if(Math.random() >= gustsPerSecond * frameSeconds){
    return
  }
  const scale = Math.max(0.5, height/640)
  const y = height * (0.12 + Math.random()*0.6)
  const count = 1 + Math.floor(Math.random()*3)
  for(let i=0; i<count; i++){
    streaks.push({
      x: -Math.random()*60*scale,
      y: y + i*9*scale,
      length: (90 + Math.random()*130) * scale,
      speed: (280 + Math.random()*200) * scale,
      amplitude: (2 + Math.random()*5) * scale,
      wavelength: (140 + Math.random()*80) * scale,
      phase: Math.random() * Math.PI * 2
    })
  }
}

function updateStreaks(streaks, width, frameSeconds){
  for(const streak of streaks){
    streak.x += streak.speed * frameSeconds
  }
  //in place compaction, streaks die once their tail leaves the canvas
  let alive = 0
  for(const streak of streaks){
    if(streak.x - streak.length < width){
      streaks[alive++] = streak
    }
  }
  streaks.length = alive
}

//the wave is fixed in space, so the streak slides along it like air following a current
function drawStreaks(ctx, streaks, ink){
  const segments = 14
  ctx.save()
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for(const streak of streaks){
    const point = index => {
      const px = streak.x - streak.length*index/segments
      return [px, streak.y + streak.amplitude*Math.sin(2*Math.PI*px/streak.wavelength + streak.phase)]
    }
    //head is the most opaque segment, the tail fades out
    for(let i=0; i<segments; i++){
      const [x0, y0] = point(i), [x1, y1] = point(i+1)
      ctx.globalAlpha = 0.45 * (1 - i/segments)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export {fallbackWeather, getWeather, getCityHour, getSky, drawSky, drawCelestial, updateRain, drawRain, emitGusts, updateStreaks, drawStreaks}
