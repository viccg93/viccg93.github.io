function getCanvas(idCanvas){
    let canvas = document.getElementById(idCanvas)
    let ctx = canvas.getContext('2d')
    //using a obj in return statement
    return {
        canvas: canvas,
        ctx: ctx,
        globalDPR: 1,
        widthDOM: 0,
        heightDOM: 0,
        cWidth: 0,
        cHeight: 0,
        adjustSizing(){
            const dpr = window.devicePixelRatio || 1
            const rect = this.canvas.getBoundingClientRect()
            const calculatedWidth = Math.round(rect.width * dpr)
            const calculatedHeight = Math.round(rect.height * dpr)
            //change only mechanism
            if(this.globalDPR != dpr || this.canvas.width != calculatedWidth || this.canvas.height != calculatedHeight){
                this.globalDPR = dpr
                //these dimensions are canvas drawing area related, not DOM element dimensions
                this.canvas.width = calculatedWidth
                this.canvas.height = calculatedHeight
                this.ctx.scale(dpr,dpr)
                //update sizing members
                this.widthDOM = rect.width
                this.heightDOM = rect.height
                this.cWidth = calculatedWidth
                this.cHeight = calculatedHeight
            }
        },
        clearWhole(){
            this.ctx.clearRect(0,0,this.cWidth,this.cHeight)
        }
    }
}

export {getCanvas}