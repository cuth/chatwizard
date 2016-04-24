var strftime = require('strftime')
var html = require('yo-yo')

var root = document.querySelector('#content')

var state = {
  channels: [
    '#stackvm',
    '#browserify',
    '#p2p',
    '#anarchitecture'
  ],
  channel: '#stackvm',
  lines: [
    {time: 1461528788732, who:'abc',message:'hello'},
    {time: 1461528792147, who:'def',message:'whatever'}
  ]
}
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
    <form class="input">
      [${state.channel}]
      <input type="text" name="text" onblur=${onblur}
        style="width: calc(100% - ${state.channel.length+6}ex)">
    </form>
  </div>`
  function onblur () { this.focus() }
}

/*
var hyperreal = require('hyperreal')
var swarmlog = require('swarmlog')
var keys = require('hyperreal/keys')

var memdb = require('memdb')
var kp = {
  enc: keys.encryptKeypair(),
  sig: keys.signKeypair()
}

var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')

var hub = signalhub('chatwizard.')
*/
