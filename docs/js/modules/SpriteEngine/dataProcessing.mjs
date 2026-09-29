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

export {generateAtlas, getSpriteSheet}
