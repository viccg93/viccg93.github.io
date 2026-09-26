//this module relies on canvasEngine, whenever canvasObj is called you should take for granted that it refers to an instance of that
import {readSpriteSheet} from './fileTreatment.mjs'

async function drawSprite(canvasObj, path, atlasElement, destinyWidth, destinyHeight){
    let spriteImage = await readSpriteSheet(path)
    if(spriteImage != null){
        canvasObj.ctx.drawImage(spriteImage,atlasElement.x,atlasElement.y,atlasElement.width, atlasElement.height,0,0,destinyWidth,destinyHeight)
        console.log("sprite sheet reference fully drawn")
    }else{
        console.error("sprite sheet reference could not be drawn")
    }
}

export {drawSprite}