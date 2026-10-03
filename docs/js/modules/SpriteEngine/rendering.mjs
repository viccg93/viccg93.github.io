//this module relies on canvasEngine, whenever canvasObj is called you should take for granted that it refers to an instance of that
function drawSprite(canvasObj, spriteSheet, atlasElement, x, y, destinyWidth, destinyHeight){
  if (spriteSheet != null) {
    /*
    canvasObj.ctx.imageSmoothingEnabled = false;
    canvasObj.ctx.mozImageSmoothingEnabled = false;
    canvasObj.ctx.webkitImageSmoothingEnabled = false;
    */
    canvasObj.ctx.imageSmoothingQuality = "low"
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

function drawLandscape(canvasObj, landscape, spriteSheet) {
  for(const building of landscape){
    drawSprite(canvasObj, spriteSheet, building.atlasReference, building.x, building.y, building.width, building.height)
  }
}

function drawFramedLandscape(canvasObj, landscape, spriteSheet, deltaTime){
  console.log("drawing triggered")
  canvasObj.ctx.beginPath()
  canvasObj.ctx.fillStyle = 'rgba(255,255,255,1)'
  canvasObj.ctx.rect(0,0,canvasObj.widthDOM,canvasObj.heightDOM)
  canvasObj.ctx.closePath()
  for(const building of landscape){
    //prevents singularity in dt = 0
    if(deltaTime>0 && deltaTime < 10000){
      let space = building.height - (building.height/(deltaTime/1000))
      console.log("space: " + space)
      if(building.height - space > 10){
        drawSprite(canvasObj, spriteSheet, building.atlasReference, building.x, (building.y-space), building.width, building.height) 
      }

    }
  }
}

export {drawSprite, drawLandscape, drawFramedLandscape}
