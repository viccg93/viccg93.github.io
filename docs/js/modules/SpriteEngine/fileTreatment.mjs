function readImageasync(src){
    return new Promise((resolve,reject)=>{
        const img = new Image()
        img.onload = ()=> {resolve(img)}
        img.onerror = (error)=> {reject(new Error("Image could not be loaded"))}
        img.src = src
    })
}

//async always return a promise
async function readSpriteSheet(path){
    let spriteSheet = null
    try{
        spriteSheet = await readImageasync(path)
    }catch(error){
        //nullity is assured
        spriteSheet = null
        console.log(error)
    }
    return spriteSheet
}

export {readSpriteSheet}