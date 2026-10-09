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

//this should be changed
function getScaleFactor(canvasWidth, widthRelationExpected, widthReference) {
  let expectedWidth = canvasWidth * widthRelationExpected
  return (expectedWidth/widthReference).toFixed(2)
}

function getLandscape({ atlas, canvasWidth, canvasHeight, numberOfElements, widthRelationExpected, widthReference,}){
  let landscape = [], counter=0
  const scaleFactor = getScaleFactor(canvasWidth, widthRelationExpected, widthReference)
  //offset element to fill empty gap at 0 position of x axis
  const offsetIndex = Math.round(Math.random()*(atlas.length-1))
  landscape.push(generateLandscapeElement(atlas[offsetIndex], canvasHeight, (-atlas[offsetIndex].width/2),scaleFactor))
  while(counter<(numberOfElements-2)){
    const index = Math.round(Math.random()*(atlas.length-1))
    landscape.push(generateLandscapeElement(atlas[index],canvasHeight,Math.round(Math.random() * canvasWidth),scaleFactor))
    counter++
  }
  return landscape
}

function generateLandscapeElement(atlasReference, canvasHeight, xPosition, scaleFactor){
  return {
    x: xPosition,
    y: canvasHeight - (20),
    width: atlasReference.width * scaleFactor,
    height: atlasReference.height * scaleFactor,
    atlasReference: atlasReference
}
}

export {generateAtlas, getSpriteSheet, getLandscape}
