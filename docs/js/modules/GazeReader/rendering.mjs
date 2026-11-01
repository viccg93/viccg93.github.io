//underlines the word the visitor is looking at, using the webcam through webgazer
//webgazer is downloaded and the camera requested when the page loads (autoStart) or when the button is pressed
//camera frames are processed in the browser, nothing is sent nor saved between visits

const webgazerBase = 'https://cdn.jsdelivr.net/npm/webgazer@3.5.3/dist'
const webgazerUrl = `${webgazerBase}/webgazer.js`
//face detection files are looked for next to the page by default, they are taken from the same cdn release
const faceMeshPath = `${webgazerBase}/mediapipe/face_mesh`
const highlightName = 'gaze-word'
//words are searched every this many milliseconds, gaze predictions arrive much faster
const searchIntervalMs = 120
//words farther than this from the gaze, in css pixels, are not underlined
const maxDistance = 140
//a new word must be this much closer than the current one to take its place, avoids flicker
const switchMargin = 24
//weight of every new prediction in the smoothed gaze point
const smoothing = 0.35

let scriptRequest = null
function loadWebgazer(){
  if(scriptRequest == null){
    scriptRequest = new Promise((resolve, reject)=>{
      const script = document.createElement('script')
      script.src = webgazerUrl
      script.onload = ()=> resolve(window.webgazer)
      script.onerror = ()=>{
        scriptRequest = null
        reject(new Error('webgazer could not be loaded'))
      }
      document.head.append(script)
    })
  }
  return scriptRequest
}

//one range per word inside the root elements, read again on every search so text changes are followed
function collectWords(roots){
  const words = []
  for(const root of roots){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for(let node = walker.nextNode(); node != null; node = walker.nextNode()){
      for(const match of node.textContent.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)){
        const range = document.createRange()
        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)
        words.push(range)
      }
    }
  }
  return words
}

//distance from the point to the word box, zero when the point is inside it
function distanceTo(range, x, y){
  const rect = range.getBoundingClientRect()
  if(rect.width == 0 && rect.height == 0){
    return Infinity
  }
  const dx = Math.max(rect.left - x, 0, x - rect.right)
  const dy = Math.max(rect.top - y, 0, y - rect.bottom)
  return Math.hypot(dx, dy)
}

//button: starts and stops the tracking
//status: empty while everything works, problems and the stopped state are written there, it should be aria-live
//getRoots: returns the elements whose words can be underlined, only visible ones should be returned
//autoStart: asks for the camera right away instead of waiting for the button
function initGazeHighlight({button, status, getRoots, autoStart = false}){
  const isSupported = typeof CSS != 'undefined' && CSS.highlights != null && typeof Highlight == 'function'
    && navigator.mediaDevices?.getUserMedia != null
  if(!isSupported){
    button.disabled = true
    status.textContent = 'Tu navegador no permite el seguimiento de mirada.'
    return null
  }

  let isRunning = false, hasEnded = false
  let gaze = null, current = null, timer = null

  function clearHighlight(){
    current = null
    CSS.highlights.delete(highlightName)
  }

  function onGaze(data){
    if(data == null){
      return
    }
    //exponential average, on top of webgazer's own kalman filter
    gaze = gaze == null ? {x: data.x, y: data.y} : {
      x: gaze.x + (data.x - gaze.x)*smoothing,
      y: gaze.y + (data.y - gaze.y)*smoothing
    }
  }

  function search(){
    if(gaze == null || document.hidden){
      return
    }
    let best = null, bestDistance = Infinity
    for(const word of collectWords(getRoots())){
      const distance = distanceTo(word, gaze.x, gaze.y)
      if(distance < bestDistance){
        best = word
        bestDistance = distance
      }
    }
    if(best == null || bestDistance > maxDistance){
      clearHighlight()
      return
    }
    //ranges are rebuilt on every search, the current word is compared by its position in the text
    const isSameWord = current != null && current.startContainer == best.startContainer && current.startOffset == best.startOffset
    if(isSameWord){
      return
    }
    const currentDistance = current != null && current.startContainer.isConnected ? distanceTo(current, gaze.x, gaze.y) : Infinity
    if(bestDistance < currentDistance - switchMargin){
      current = best
      CSS.highlights.set(highlightName, new Highlight(best))
    }
  }

  //the camera is released and the calibration forgotten, every step is guarded because
  //a failed start can leave webgazer half initialised
  function releaseCamera(){
    const webgazer = window.webgazer
    for(const step of ['clearData', 'stopVideo', 'end']){
      try{
        Promise.resolve(webgazer[step]()).catch(()=>{})
      }catch(error){
        //that part was never created
      }
    }
  }

  //webgazer can not begin again in the same page once it started, a reload is needed
  function finish(message){
    hasEnded = true
    button.textContent = 'Activar seguimiento de mirada'
    button.setAttribute('aria-pressed', 'false')
    button.disabled = true
    status.textContent = message
  }

  async function start(){
    button.disabled = true
    status.textContent = ''
    let webgazer
    try{
      webgazer = await loadWebgazer()
    }catch(error){
      //nothing was started, the button can be pressed again
      console.error(error)
      status.textContent = 'No se pudo cargar el seguimiento de mirada.'
      button.disabled = false
      return
    }
    try{
      webgazer.params.faceMeshSolutionPath = faceMeshPath
      webgazer.saveDataAcrossSessions(false)
        .applyKalmanFilter(true)
        .showPredictionPoints(false)
        .setGazeListener(onGaze)
      await webgazer.begin()
      webgazer.setVideoViewerSize(160, 120)
    }catch(error){
      console.error(error)
      releaseCamera()
      finish('No se pudo usar la cámara. Recarga la página para intentarlo de nuevo.')
      return
    }
    isRunning = true
    timer = setInterval(search, searchIntervalMs)
    button.textContent = 'Detener seguimiento de mirada'
    button.setAttribute('aria-pressed', 'true')
    button.disabled = false
  }

  function stop(){
    clearInterval(timer)
    clearHighlight()
    gaze = null
    isRunning = false
    releaseCamera()
    finish('Cámara apagada. Recarga la página para volver a activarlo.')
  }

  button.addEventListener('click', ()=>{
    if(isRunning){
      stop()
    }else if(!hasEnded){
      start()
    }
  })
  if(autoStart){
    start()
  }
  return {stop: ()=> isRunning && stop()}
}

export {initGazeHighlight}
