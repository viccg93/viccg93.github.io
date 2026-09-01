function registerSizingChange(canvas, drawingFunction){
    window.addEventListener('resize', ()=>{
        canvas.adjustSizing()
        console.log('adjustments are made on canvas')
        drawingFunction()
    })
}

export {registerSizingChange}