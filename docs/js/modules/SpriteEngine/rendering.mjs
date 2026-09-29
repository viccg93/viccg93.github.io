//this module relies on canvasEngine, whenever canvasObj is called you should take for granted that it refers to an instance of that
async function drawSprite(canvasObj, spriteSheet, atlasElement, x, y, destinyWidth, destinyHeight){
  if (spriteSheet != null) {
    canvasObj.ctx.imageSmoothingEnabled = false;
    canvasObj.ctx.mozImageSmoothingEnabled = false;
    canvasObj.ctx.webkitImageSmoothingEnabled = false;
    //canvasObj.ctx.imageSmoothingQuality = "high";
    //canvasObj.ctx.drawImage(spriteSheet,atlasElement.x,atlasElement.y,atlasElement.width, atlasElement.height,x,y,destinyWidth,destinyHeight)
    canvasObj.ctx.drawImage(
      spriteSheet,
      Math.floor(atlasElement.x),
      Math.floor(atlasElement.y),
      Math.floor(atlasElement.width),
      Math.floor(atlasElement.height),
      Math.floor(x),
      Math.floor(y),
      Math.floor(destinyWidth),
      Math.floor(destinyHeight)
    );
    console.log("sprite sheet reference fully drawn")
    }else{
        console.error("sprite sheet reference could not be drawn")
    }
}

function drawLandscape(canvasObj, referenceWidth, atlas) {
  console.log("hey")

}

export {drawSprite}
