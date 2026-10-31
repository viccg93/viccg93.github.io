import {readSvg} from './fileTreatment.mjs'
//all values are assumed in css pixels

async function getSvg(path) {
  let svg = await readSvg(path)
  return svg
}

function getScaleFactor(sizingRef, portion, elemSizing){
  let factor = 1
  if(elemSizing>0){
    factor = (sizingRef*portion)/elemSizing
  }
  return  factor
}

//building is centered horizontally and vertically inside the area band and scaled to a portion of its height,
//unless its width would exceed maxWidthPortion of canvas width, then width rules the scale
//area defaults to the whole canvas
//y is the baseline: final position of the building's bottom edge
function getBuilding({svg, canvasWidth, canvasHeight, areaTop = 0, areaHeight = canvasHeight, portionForScale, maxWidthPortion, precision}){
  const scaleFactor = Math.min(
    getScaleFactor(areaHeight, portionForScale, svg.naturalHeight),
    getScaleFactor(canvasWidth, maxWidthPortion, svg.naturalWidth)
  )
  const width = svg.naturalWidth * scaleFactor
  const height = svg.naturalHeight * scaleFactor
  return {
    x: (canvasWidth - width)/2,
    y: areaTop + (areaHeight + height)/2,
    width: width,
    height: height,
    scaleFactor: scaleFactor,
    //building starts hidden below the baseline until the first framed draw
    lastY: canvasHeight,
    isSettled: false,
    //max times units elapsed to draw the whole building is calculated here
    maxTimeUnits: calculateMaxTimeAnimation(height, precision)
  }
}

//remaining distance to final position is height/timeUnits,
//so it gets below precision (in pixels) once timeUnits reaches height/precision
function calculateMaxTimeAnimation(referenceElementHeight, precision){
  const auxPrecision = 20
  let timeUnits = 0
  if(precision>0){
    timeUnits = referenceElementHeight/precision
  }else{
    timeUnits = referenceElementHeight/auxPrecision
  }
  return timeUnits
}

export {getSvg, getBuilding}
