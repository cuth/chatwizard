var strftime = require('strftime')
var html = require('yo-yo')
var uniq = require('uniq')

var root = document.querySelector('#content')

var state = {
  channels: [],
  channel: '(status)',
  lines: []
}
var memdb = require('memdb')
var chat = require('./index.js')(memdb())
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

function update () {
  html.update(root, render(state))
  root.querySelector('input[name="text"]').focus()
}
update()
window.addEventListener('resize', update)

var catchlinks = require('catch-links')
catchlinks(window, function (href) {
  console.log(href)
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
      ${state.lines.map(function (m) {
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
  }
}

function handleMsg (msg) {
  var m = /^\/(\S+)/.exec(msg)
  var cmd = (m && m[1] || '').toLowerCase()
  if (cmd === 'join') {
    chat.join(msg.split(/\s+/)[1] || state.channel)
  } else if (cmd === 'part') {
    chat.part(msg.split(/\s+/)[1] || state.channel)
  } else if (cmd) {
    // unknown command
  } else {
    chat.say(state.channel, msg)
  }
}
