function readImageasync(src){
    return new Promise((resolve,reject)=>{
        const img = new Image()
        img.onload = ()=> {resolve(img)}
        img.onerror = (error)=> {reject(new Error("Image could not be loaded: " + src))}
        img.src = src
    })
}

//async always return a promise
//svg root element must declare width and height, otherwise some browsers report zero natural dimensions
async function readSvg(path){
    let svg = null
    try{
        svg = await readImageasync(path)
        if(svg.naturalWidth == 0 || svg.naturalHeight == 0){
            throw new Error("svg has no intrinsic dimensions, width and height attributes are required: " + path)
        }
    }catch(error){
        //nullity is assured
        svg = null
        console.log(error)
    }
    return svg
}

export {readSvg}
