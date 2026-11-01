import {parseMarkdown} from './markdown.mjs'

//posts json is an array, cards follow array order
//[{"id": "mi-post", "file": "posts/mi-post.md", "title": "...", "date": "2026-10-31", "summary": "..."}]
//id, file and title are required, date (yyyy-mm-dd) and summary are optional
//id goes in the url hash, so blog.html#mi-post opens that post directly
//a new post only needs its .md file and one more entry in the json

async function loadPosts(source){
  //source can be the array itself or the url of a json file
  if(typeof source == 'string'){
    const response = await fetch(source)
    if(!response.ok){
      throw new Error(`posts json could not be loaded: ${source} (${response.status})`)
    }
    return response.json()
  }
  return source
}

function validatePosts(posts){
  if(!Array.isArray(posts)){
    throw new Error('posts json must be an array')
  }
  return posts.filter((entry, index)=>{
    const isValid = entry != null && ['id', 'file', 'title'].every(key => typeof entry[key] == 'string')
    if(!isValid){
      console.warn(`post at index ${index} is skipped, id, file and title are required`, entry)
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

//cards use the short date so it fits one line, the article shows the long one
const dateFormats = {
  short: new Intl.DateTimeFormat('es-MX', {dateStyle: 'medium'}),
  long: new Intl.DateTimeFormat('es-MX', {dateStyle: 'long'})
}

//dates are read as local days, a bare yyyy-mm-dd would be read as utc and could show the day before
function createDate(date, className, style = 'long'){
  const time = createElement('time', {class: className, datetime: date})
  const parsed = new Date(`${date}T00:00:00`)
  time.textContent = isNaN(parsed) ? date : dateFormats[style].format(parsed)
  return time
}

function createCard(post, href, headingLevel){
  const card = createElement('a', {class: 'blog-card', href: href})
  const meta = createElement('span', {class: 'blog-card-meta'})
  if(post.date){
    meta.append(createDate(post.date, 'blog-card-date', 'short'))
  }
  card.append(meta, createElement(`h${headingLevel}`, {class: 'blog-card-title'}, post.title))
  if(post.summary){
    card.append(createElement('p', {class: 'blog-card-summary'}, post.summary))
  }
  const item = createElement('li')
  item.append(card)
  return item
}

//reader is a full screen dialog that opens from the middle of the screen and closes back to the grid
function createReader(posts){
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const dialog = createElement('dialog', {class: 'blog-reader', 'aria-labelledby': 'blog_reader_title'})
  const bar = createElement('div', {class: 'blog-reader-bar'})
  const closeButton = createElement('button', {type: 'button', class: 'blog-reader-close'}, 'Cerrar ✕')
  bar.append(closeButton)
  const article = createElement('article', {class: 'blog-article'})
  const header = createElement('header', {class: 'blog-article-header'})
  const title = createElement('h2', {id: 'blog_reader_title'})
  const body = createElement('div', {class: 'blog-article-body'})
  article.append(header, body)
  dialog.append(bar, article)
  document.body.append(dialog)

  //every post is requested once, failed requests are forgotten so they can be retried
  const cache = new Map()
  function loadPost(post){
    if(!cache.has(post.id)){
      const url = new URL(post.file, location.href).href
      const request = fetch(url)
        .then(response =>{
          if(!response.ok){
            throw new Error(`post could not be loaded: ${post.file} (${response.status})`)
          }
          return response.text()
        })
        .then(text => parseMarkdown(text, url))
      request.catch(()=> cache.delete(post.id))
      cache.set(post.id, request)
    }
    return cache.get(post.id)
  }

  let current = null
  //true when opening added a history entry, closing then goes back instead of leaving a dead entry
  let hasPushedEntry = false
  let lastCard = null

  function showStatus(text){
    body.replaceChildren(createElement('p', {class: 'blog-article-status'}, text))
  }

  async function open(post){
    current = post
    header.replaceChildren(...(post.date ? [createDate(post.date, 'blog-article-date')] : []), title)
    title.textContent = post.title
    showStatus('Cargando…')
    dialog.classList.remove('is-closing')
    if(!dialog.open){
      document.documentElement.classList.add('blog-reading')
      dialog.showModal()
    }
    dialog.scrollTop = 0
    try{
      const html = await loadPost(post)
      //a newer post may have been opened while this one was loading
      if(current == post){
        body.innerHTML = html
      }
    }catch(error){
      console.error(error)
      if(current == post){
        showStatus('No se pudo cargar el artículo.')
      }
    }
  }

  //closing animation runs first, the dialog is closed when it ends
  function animateClose(){
    if(!dialog.open || dialog.classList.contains('is-closing')){
      return
    }
    if(reducedMotion.matches){
      dialog.close()
      return
    }
    dialog.classList.add('is-closing')
  }

  dialog.addEventListener('animationend', event =>{
    //content animations bubble up, only the dialog's own one counts
    if(event.target == dialog && dialog.classList.contains('is-closing')){
      dialog.classList.remove('is-closing')
      dialog.close()
    }
  })

  dialog.addEventListener('close', ()=>{
    document.documentElement.classList.remove('blog-reading')
    //browsers may close the dialog on their own (repeated escape), the hash is cleared so it can be reopened
    if(current != null && location.hash == `#${current.id}`){
      history.replaceState(null, '', location.pathname + location.search)
    }
    current = null
    hasPushedEntry = false
    lastCard?.focus({preventScroll: true})
  })

  //close button and escape go through the history so the back button stays consistent
  function requestClose(){
    if(hasPushedEntry){
      hasPushedEntry = false
      history.back()
    }else{
      history.replaceState(null, '', location.pathname + location.search)
      animateClose()
    }
  }
  closeButton.addEventListener('click', requestClose)
  dialog.addEventListener('cancel', event =>{
    event.preventDefault()
    requestClose()
  })

  //the hash is the single source of truth: #id opens that post, anything else closes the reader
  function sync(){
    const id = decodeURIComponent(location.hash.slice(1))
    const post = posts.find(entry => entry.id == id)
    if(post != null){
      open(post)
    }else{
      animateClose()
    }
  }
  window.addEventListener('hashchange', sync)

  //cards are plain hash links, clicking one adds a history entry
  function trackCard(card){
    card.addEventListener('click', ()=>{
      lastCard = card
      hasPushedEntry = true
    })
  }

  return {sync, trackCard}
}

//builds the grid of post titles inside the container
//articleHref: page that reads the posts, cards link there instead of opening a reader in this page
//limit: max cards shown, null shows all
//headingLevel: heading level of the card titles, so they fit the page outline
async function initBlog(idContainer, source, {articleHref = null, limit = null, headingLevel = 3} = {}){
  const container = document.getElementById(idContainer)
  let posts
  try{
    posts = validatePosts(await loadPosts(source))
  }catch(error){
    console.error(error)
    return null
  }
  if(posts.length == 0){
    console.error('there are no valid posts to show')
    return null
  }

  const grid = createElement('ul', {class: 'blog-grid'})
  const shown = limit == null ? posts : posts.slice(0, limit)
  const reader = articleHref == null ? createReader(posts) : null
  shown.forEach(post =>{
    const href = `${articleHref ?? ''}#${encodeURIComponent(post.id)}`
    const item = createCard(post, href, headingLevel)
    reader?.trackCard(item.firstChild)
    grid.append(item)
  })
  container.append(grid)

  //a post in the url when the page loads is opened right away
  reader?.sync()
  return {posts}
}

export {initBlog}
