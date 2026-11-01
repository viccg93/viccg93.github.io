//small markdown to html converter for blog posts
//supports headings, paragraphs, lists, blockquotes, fenced code, rules,
//inline code, bold, italics, links and images
//every text is escaped, so raw html inside a post is shown as text and never executed

const escapeMap = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}
const escapeHtml = text => text.replace(/[&<>"']/g, char => escapeMap[char])

const listPattern = /^\s*([-*+]|\d+[.)])\s+(.*)$/
const rulePattern = /^\s*(\*{3,}|-{3,}|_{3,})\s*$/
//code span, image or link, whatever comes first in the text
const inlinePattern = /`([^`]+)`|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)/g

//relative urls are resolved against the post file, only safe protocols are allowed
function safeUrl(url, baseUrl){
  if(url.startsWith('#')){
    return url
  }
  try{
    const resolved = new URL(url, baseUrl)
    if(['http:', 'https:', 'mailto:'].includes(resolved.protocol)){
      return resolved.href
    }
  }catch(error){
    //invalid urls are dropped below
  }
  return null
}

function emphasis(text){
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\b_(.+?)_\b/g, '<em>$1</em>')
}

function inline(text, baseUrl){
  let html = '', last = 0
  for(const match of text.matchAll(inlinePattern)){
    html += emphasis(text.slice(last, match.index))
    const [whole, code, alt, src, label, href] = match
    if(code !== undefined){
      html += `<code>${escapeHtml(code)}</code>`
    }else if(src !== undefined){
      const url = safeUrl(src, baseUrl)
      html += url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy">` : escapeHtml(whole)
    }else{
      const url = safeUrl(href, baseUrl)
      //links to other sites open in a new tab
      const isExternal = url != null && /^https?:/.test(url) && new URL(url).origin != location.origin
      const target = isExternal ? ' target="_blank" rel="noopener"' : ''
      html += url ? `<a href="${escapeHtml(url)}"${target}>${emphasis(label)}</a>` : emphasis(label)
    }
    last = match.index + whole.length
  }
  return html + emphasis(text.slice(last))
}

function isBlockStart(line){
  return /^(```|#{1,6}\s|>)/.test(line) || listPattern.test(line) || rulePattern.test(line)
}

//baseUrl: absolute url of the post, relative links and images are resolved against it
//headingOffset: levels added to every heading, so a post # sits below the page headings
function parseMarkdown(source, baseUrl = location.href, headingOffset = 1){
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let i = 0
  while(i < lines.length){
    const line = lines[i]
    if(line.trim() == ''){
      i++
      continue
    }

    const fence = line.match(/^```\s*([\w-]*)/)
    if(fence){
      const code = []
      i++
      while(i < lines.length && !lines[i].startsWith('```')){
        code.push(lines[i])
        i++
      }
      //closing fence
      i++
      const language = fence[1] ? ` class="language-${fence[1]}"` : ''
      blocks.push(`<pre><code${language}>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*$/)
    if(heading){
      const level = Math.min(heading[1].length + headingOffset, 6)
      blocks.push(`<h${level}>${inline(heading[2], baseUrl)}</h${level}>`)
      i++
      continue
    }

    if(rulePattern.test(line)){
      blocks.push('<hr>')
      i++
      continue
    }

    if(line.startsWith('>')){
      const quote = []
      while(i < lines.length && lines[i].startsWith('>')){
        quote.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(`<blockquote>${parseMarkdown(quote.join('\n'), baseUrl, headingOffset)}</blockquote>`)
      continue
    }

    const listStart = line.match(listPattern)
    if(listStart){
      const isOrdered = /\d/.test(listStart[1])
      const items = []
      while(i < lines.length){
        const item = lines[i].match(listPattern)
        if(item && /\d/.test(item[1]) == isOrdered){
          items.push(item[2])
        }else if(items.length > 0 && /^\s{2,}\S/.test(lines[i])){
          //indented line continues the previous item
          items[items.length - 1] += ' ' + lines[i].trim()
        }else{
          break
        }
        i++
      }
      const tag = isOrdered ? 'ol' : 'ul'
      blocks.push(`<${tag}>${items.map(item => `<li>${inline(item, baseUrl)}</li>`).join('')}</${tag}>`)
      continue
    }

    //consecutive lines form one paragraph, the first line always enters so the loop moves on
    const paragraph = [line.trim()]
    i++
    while(i < lines.length && lines[i].trim() != '' && !isBlockStart(lines[i])){
      paragraph.push(lines[i].trim())
      i++
    }
    blocks.push(`<p>${inline(paragraph.join(' '), baseUrl)}</p>`)
  }
  return blocks.join('\n')
}

export {parseMarkdown}
