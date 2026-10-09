import {readSpriteSheet} from './fileTreatment.mjs'
//all values are assumed in pixels
//heightRelation is an array representing scale for every row in the sheet
function generateAtlas(rows, columns, spriteWidth, rowHeights, xLineGap, yLineGap){
    let atlas = []
    if(rowHeights != null && rows == (rowHeights.length)){
        //indexes ought to be initialised on zero due to first spaces are only gaps in the spritesheet
        let yAxisCovered = 0
        for(let rowIndex=0; rowIndex<rows; rowIndex++){
            for(let colIndex=0; colIndex<columns; colIndex++){
                atlas.push(
                    {
                        x: xLineGap + (colIndex*spriteWidth),
                        y: yLineGap + yAxisCovered,
                        width: spriteWidth,
                        height: rowHeights[rowIndex]
                    }
                )
            }
            //this does summarizes distance fully and effectively processed
            yAxisCovered+= yLineGap + rowHeights[rowIndex]
        }
    }
    return atlas
}

async function getSpriteSheet(path) {
  let spriteSheet = await readSpriteSheet(path)
  return spriteSheet
}

function getScaleFactor(sizingRef, portion, elemSizing){
  let factor = 1
  if(elemSizing>0){
    factor = (sizingRef*portion)/elemSizing
  }
  return  factor
}

//fixed to canvas height, only leaving custom portions
function getLandscape({atlas, canvasWidth, canvasHeight, numberOfElements, portionForScale}){
  let landscape = [], counter=0
  let maxHeightInLandscape = 0
  //offset element to fill empty gap at 0 position of x axis
  const offsetIndex = Math.round(Math.random()*(atlas.length-1))
  landscape.push(generateLandscapeElement(atlas[offsetIndex], canvasHeight, (-atlas[offsetIndex].width/2),portionForScale))
  while(counter<(numberOfElements-2)){
    const index = Math.round(Math.random()*(atlas.length-1))
    const building = generateLandscapeElement(atlas[index],canvasHeight,Math.round(Math.random() * canvasWidth),portionForScale)
    maxHeightInLandscape = Math.max(maxHeightInLandscape,building.height)
    landscape.push(building)
    counter++
  }
  return {landscape: landscape, maxHeightInLandscape: maxHeightInLandscape}
}

function generateLandscapeElement(atlasReference, canvasHeight, xPosition, portionForScale){
  let scaleFactor = getScaleFactor(canvasHeight,portionForScale, atlasReference.height)
  return {
    x: xPosition,
    //this offset is going to be formalised for optimising phase
    //in the meantime this should be considered as an extre space below visible y-axis area
    y: canvasHeight - (20),
    width: atlasReference.width * scaleFactor,
    height: atlasReference.height * scaleFactor,
    atlasReference: atlasReference,
    scaleFactor: scaleFactor
}
}

export {generateAtlas, getSpriteSheet, getLandscape}
