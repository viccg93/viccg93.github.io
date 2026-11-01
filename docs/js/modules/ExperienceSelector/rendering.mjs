import {createBuildingScene} from '../SpriteEngine/rendering.mjs'

//places json is an array, badge order follows array order and the first place is selected by default
//[{"image": "gentera.svg", "place": "Gentera", "period": "2021 - 2023", "title": "...", "description": "...", "extra": "..."}]
//image and place are required, period, title, description and extra are optional
//title and description are shown above the building, extra below it and above the badges
//title falls back to place when it is missing
//a new place only needs its svg in the sprites folder and one more entry in the json

async function loadPlaces(source){
  //source can be the array itself or the url of a json file
  if(typeof source == 'string'){
    const response = await fetch(source)
    if(!response.ok){
      throw new Error(`places json could not be loaded: ${source} (${response.status})`)
    }
    return response.json()
  }
  return source
}

function validatePlaces(places){
  if(!Array.isArray(places)){
    throw new Error('places json must be an array')
  }
  return places.filter((entry, index)=>{
    const isValid = entry != null && typeof entry.image == 'string' && typeof entry.place == 'string'
    if(!isValid){
      console.warn(`place at index ${index} is skipped, image and place are required`, entry)
    }
    return isValid
  })
}

function createElement(tag, attributes = {}, text = ''){
  const element = document.createElement(tag)
  for(const [name, value] of Object.entries(attributes)){
    element.setAttribute(name, value)
  }
  element.textContent = text
  return element
}

//builds badges and canvas inside the container
//spritesPath: folder prepended to every image name
//any other option is passed to the building scene (hour, weather, portionForScale...)
async function initExperience(idContainer, source, {spritesPath = 'sprites/', ...sceneOptions} = {}){
  const container = document.getElementById(idContainer)
  let places
  try{
    places = validatePlaces(await loadPlaces(source))
  }catch(error){
    console.error(error)
    return null
  }
  if(places.length == 0){
    console.error('there are no valid places to show')
    return null
  }

  //tabs pattern: badges are tabs, canvas is decorative
  //stage holds the canvas and an overlay column laid over it:
  //title, description, building slot, extra and badges, the building is fitted inside the slot
  const stage = createElement('div', {class: 'experience-stage'})
  const overlay = createElement('div', {class: 'experience-overlay'})
  const headline = createElement('p', {class: 'experience-title'})
  const summary = createElement('p', {class: 'experience-summary'})
  const slot = createElement('div', {class: 'experience-slot', 'aria-hidden': 'true'})
  const extra = createElement('p', {class: 'experience-extra'})
  const tablist = createElement('div', {role: 'tablist', class: 'experience-badges', 'aria-label': 'Lugares'})
  const canvas = createElement('canvas', {id: `${idContainer}_canvas`, class: 'experience-canvas', 'aria-hidden': 'true'})
  const title = createElement('h3')
  const period = createElement('p', {class: 'experience-period'})

  const badges = places.map((entry, index)=>{
    const badge = createElement('button', {
      type: 'button',
      role: 'tab',
      id: `${idContainer}_tab_${index}`,
      class: 'experience-badge',
      'aria-selected': 'false',
      tabindex: '-1',
      //index staggers the shine that runs across the dots on narrow screens
      style: `--i: ${index}`
    }, entry.place)
    badge.addEventListener('click', ()=> select(index))
    tablist.append(badge)
    return badge
  })
  tablist.style.setProperty('--count', badges.length)
  overlay.append(headline, summary, slot, extra, tablist)
  stage.append(canvas, overlay)
  container.append(stage)

  //canvas must be in the document before the scene measures it
  //sky colors are shared with css so texts and dots on narrow screens contrast with the sky behind them
  const scene = createBuildingScene(canvas.id, {
    ...sceneOptions,
    onSkyChange: sky => stage.style.setProperty('--sky-ink', sky.ink),
    //slot position relative to the canvas, it is read again on every restart so resizes are followed
    getArea: ()=>{
      const canvasRect = canvas.getBoundingClientRect()
      const slotRect = slot.getBoundingClientRect()
      return {top: slotRect.top - canvasRect.top, height: slotRect.height}
    }
  })
  const pathOf = entry => spritesPath + entry.image
  scene.preload(places.map(pathOf))

  let selected = 0
  //selecting the current badge again replays the animation
  function select(index, moveFocus = false){
    selected = index
    badges.forEach((badge, badgeIndex)=>{
      const isSelected = badgeIndex == index
      badge.setAttribute('aria-selected', String(isSelected))
      badge.tabIndex = isSelected ? 0 : -1
    })
    const entry = places[index]
    title.textContent = entry.place
    period.textContent = entry.period ?? ''
    period.hidden = !entry.period
    //overlay texts keep their space even when empty, so the building slot never moves
    headline.textContent = entry.title ?? entry.place
    summary.textContent = entry.description ?? ''
    extra.textContent = entry.extra ?? ''
    //selected badge is centered inside the row when it overflows on narrow screens,
    //only the row scrolls, scrollIntoView would also move the page on first load
    const badge = badges[index]
    tablist.scrollTo({left: badge.offsetLeft - (tablist.clientWidth - badge.offsetWidth)/2, behavior: 'smooth'})
    if(moveFocus){
      badge.focus({preventScroll: true})
    }
    scene.show(pathOf(entry))
  }

  const last = badges.length - 1
  const previousIndex = ()=> selected == 0 ? last : selected - 1
  const nextIndex = ()=> selected == last ? 0 : selected + 1

  //arrow keys move between badges, home and end jump to the first and last one
  tablist.addEventListener('keydown', event =>{
    const next = {
      ArrowRight: nextIndex,
      ArrowLeft: previousIndex,
      Home: ()=> 0,
      End: ()=> last
    }[event.key]
    if(next === undefined){
      return
    }
    event.preventDefault()
    select(next(), true)
  })

  //here arrow motion is handled
  new IntersectionObserver(entries =>{
    isStageVisible = entries[0].isIntersecting
  }, {threshold: 0.5}).observe(stage)

  document.addEventListener('keydown', event =>{
    const step = {ArrowRight: nextIndex, ArrowLeft: previousIndex}[event.key]
    const target = event.target
    //tablist handles its own keys, fields and modified keys keep their usual behavior
    const isIgnored = !isStageVisible || step === undefined || tablist.contains(target)
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
      || target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if(isIgnored){
      return
    }
    event.preventDefault()
    select(step())
  })

  select(0)
  return {select}
}

export {initExperience}
