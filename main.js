var strftime = require('strftime')
var html = require('yo-yo')
var uniq = require('uniq')
var randomBytes = require('randombytes')

var root = document.querySelector('#content')

var state = {
  channels: [],
  channel: '(status)',
  nym: randomBytes(3).toString('hex'),
  lines: {}
}
var memdb = require('memdb')
var chat = require('./index.js')(state.nym, memdb())
chat.on('join', function (channel) {
  state.channels.push(channel)
  uniq(state.channels)
  state.channel = channel
  update()
})

chat.on('part', function (channel) {
  var ix = state.channels.indexOf(channel)
  if (ix >= 0) state.channels.splice(ix, 1)
  state.channel = state.channels[Math.max(0,ix-1)] || '(status)'
  update()
})

chat.on('say', function (channel, row) {
  if (!state.lines[channel]) state.lines[channel] = []
  state.lines[channel].push(row)
  state.lines[channel].sort(function (a, b) {
    return a.value.time < b.value.time ? -1 : 1
  })
  update()
})

function update () {
  html.update(root, render(state))
  root.querySelector('input[name="text"]').focus()
}
update()
window.addEventListener('resize', update)

var catchlinks = require('catch-links')
catchlinks(window, function (href) {
  console.log('href=', href)
  var m = /(#.+)$/.exec(href)
  if (m) {
    state.channel = m[1]
    update()
  }
})

function render (state) {
  return html`<div id="content">
    <div class="channels"><div class="inner">
      ${state.channels.map(function (channel) {
        return html`<div class="channel">
          <a href="${channel}">${channel}</a>
        </div>`
      })}
    </div></div>
    <div class="lines"><div class="inner">
      ${(state.lines[state.channel] || []).map(function (row) {
        var m = row.value
        return html`<div class="line">
          <span class="time">${strftime('%T', new Date(m.time))}</span>
          <span class="who">${'<' + m.who + '>'}</span>
          <span class="message">${m.message}</span>
        </div>`
      })}
    </div></div>
    <form class="input" onsubmit=${onsubmit}>
      [${state.channel}]
      <input type="text" name="text" onblur=${onblur}
        style="width: calc(100% - ${state.channel.length+6}ex)">
    </form>
  </div>`
  function onblur () { this.focus() }
  function onsubmit (ev) {
    ev.preventDefault()
    var msg = this.elements.text.value
    handleMsg(msg)
    this.elements.text.value = ''
  }
}

function handleMsg (msg) {
  var m = /^\/(\S+)/.exec(msg)
  var cmd = (m && m[1] || '').toLowerCase()
  if (cmd === 'join' || cmd === 'j') {
    chat.join(msg.split(/\s+/)[1] || state.channel)
  } else if (cmd === 'part' || cmd === 'p') {
    chat.part(msg.split(/\s+/)[1] || state.channel)
  } else if (cmd === 'nick' || cmd === 'n') {
    chat.nym = msg.split(/\s+/)[1]
    update()
  } else if (cmd) {
    // unknown command
  } else if (state.channel !== '(status)') {
    chat.say(state.channel, msg)
  }
}
