//stack json maps the text of a stack item to its github repositories, newest first
//{"user": "viccg93", "technologies": {"Rust": {"repos": ["guessing_game", ...], "all": "https://github.com/..."}}}
//a repo is "name" for the main user or "owner/name" for another account, those show their owner next to the name
//repos is required, all is optional: when a list is longer than maxShown it is cut and all is linked at the end,
//without all the whole list is shown and the panel scrolls
//items without an entry stay as plain text, so the section still works without this script

let panelCount = 0

function createElement(tag, attributes = {}, text = ''){
  const element = document.createElement(tag)
  for(const [name, value] of Object.entries(attributes)){
    element.setAttribute(name, value)
  }
  element.textContent = text
  return element
}

function parseRepo(user, repo){
  const [owner, name] = repo.includes('/') ? repo.split('/') : [user, repo]
  return {owner, name, url: `https://github.com/${owner}/${name}`, isOtherAccount: owner != user}
}

//repository names open in a new tab, the arrow is decorative and the tab warning is read by screen readers
function createRepoLink(href, text, label){
  const link = createElement('a', {href, target: '_blank', rel: 'noopener', 'aria-label': `${label}, se abre en otra pestaña`}, text)
  link.append(createElement('span', {'aria-hidden': 'true', class: 'stack-repos-arrow'}, ' ↗'))
  return link
}

function buildPanel(user, tech, {repos, all}, maxShown){
  const panel = createElement('div', {class: 'stack-repos', id: `stack_repos_${panelCount++}`, hidden: ''})
  const count = repos.length
  panel.append(createElement('p', {class: 'stack-repos-title'}, count == 1 ? 'Repositorio en GitHub' : `Repositorios en GitHub · ${count}`))
  const shown = all && count > maxShown ? repos.slice(0, maxShown) : repos
  const list = createElement('ul', {class: 'stack-repos-list'})
  for(const repo of shown){
    const {owner, name, url, isOtherAccount} = parseRepo(user, repo)
    const item = createElement('li')
    const link = createRepoLink(url, name, isOtherAccount ? `Repositorio ${name} de la cuenta ${owner}` : `Repositorio ${name}`)
    if(isOtherAccount){
      link.prepend(createElement('span', {class: 'stack-repos-owner', 'aria-hidden': 'true'}, `${owner}/`))
    }
    item.append(link)
    list.append(item)
  }
  panel.append(list)
  if(shown.length < count){
    const more = createRepoLink(all, `Ver los ${count} en GitHub`, `Ver los ${count} repositorios de ${tech} en GitHub`)
    more.classList.add('stack-repos-all')
    panel.append(more)
  }
  return panel
}

//the item text becomes a button that discloses the panel, the count tells which items have repositories
function enhanceItem(item, user, tech, entry, maxShown){
  const panel = buildPanel(user, tech, entry, maxShown)
  const button = createElement('button', {type: 'button', class: 'stack-tech', 'aria-expanded': 'false', 'aria-controls': panel.id}, tech)
  button.append(
    createElement('span', {class: 'stack-tech-count', 'aria-hidden': 'true'}, String(entry.repos.length)),
    createElement('span', {class: 'stack-sr'}, `, ${entry.repos.length} ${entry.repos.length == 1 ? 'repositorio' : 'repositorios'}`)
  )
  item.textContent = ''
  item.classList.add('stack-item--repos')
  item.append(button, panel)
  return {item, button, panel}
}

async function initStackRepos(listSelector, source, {maxShown = 6} = {}){
  const list = document.querySelector(listSelector)
  if(list == null){
    return
  }
  let data
  try{
    const response = await fetch(source)
    if(!response.ok){
      throw new Error(`stack repos json could not be loaded: ${source} (${response.status})`)
    }
    data = await response.json()
  }catch(error){
    console.error(error)
    return
  }

  const technologies = data.technologies ?? {}
  const used = new Set()
  const tips = []
  for(const item of list.querySelectorAll('.stack-items li')){
    const tech = item.textContent.trim()
    const entry = technologies[tech]
    if(entry == null || !Array.isArray(entry.repos) || entry.repos.length == 0){
      continue
    }
    used.add(tech)
    tips.push(enhanceItem(item, data.user, tech, entry, maxShown))
  }
  //a key that matches no item usually means the item text was renamed in the html
  for(const tech of Object.keys(technologies)){
    if(!used.has(tech)){
      console.warn(`stack repos: "${tech}" does not match any stack item`)
    }
  }

  //one panel at a time: hover opens it for a mouse, a click pins it so it stays after the pointer leaves
  let current = null, mode = null, closeTimer = 0

  function open(tip, newMode){
    clearTimeout(closeTimer)
    if(current != null && current != tip){
      close()
    }
    current = tip
    mode = newMode
    tip.button.setAttribute('aria-expanded', 'true')
    tip.panel.hidden = false
    //panel grows to the right of its item, it is aligned to the item end when it would leave the screen
    tip.panel.classList.remove('stack-repos--end')
    if(tip.panel.getBoundingClientRect().right > document.documentElement.clientWidth - 8){
      tip.panel.classList.add('stack-repos--end')
    }
  }

  function close(){
    clearTimeout(closeTimer)
    if(current == null){
      return
    }
    current.button.setAttribute('aria-expanded', 'false')
    current.panel.hidden = true
    current = null
    mode = null
  }

  for(const tip of tips){
    //touch and pen get no hover, they use the click
    tip.item.addEventListener('pointerenter', event =>{
      if(event.pointerType != 'mouse'){
        return
      }
      if(current == tip){
        clearTimeout(closeTimer)
      }else if(mode != 'pinned'){
        open(tip, 'hover')
      }
    })
    //the delay lets the pointer cross the gap between the item and its panel
    tip.item.addEventListener('pointerleave', event =>{
      if(event.pointerType == 'mouse' && current == tip && mode == 'hover'){
        closeTimer = setTimeout(close, 200)
      }
    })
    tip.button.addEventListener('click', ()=>{
      if(current == tip && mode == 'pinned'){
        close()
      }else{
        open(tip, 'pinned')
      }
    })
    //focus leaving the item and its panel closes it, so tabbing through the stack never leaves panels behind
    tip.item.addEventListener('focusout', event =>{
      if(current == tip && !tip.item.contains(event.relatedTarget)){
        close()
      }
    })
  }

  document.addEventListener('keydown', event =>{
    if(event.key == 'Escape' && current != null){
      const button = current.button
      const hadFocus = current.item.contains(document.activeElement)
      close()
      if(hadFocus){
        button.focus()
      }
    }
  })

  document.addEventListener('click', event =>{
    if(current != null && !current.item.contains(event.target)){
      close()
    }
  })
}

export {initStackRepos}
