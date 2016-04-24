var hyperlog = require('hyperlog')
var keys = require('hyperreal/keys')
var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var has = require('has')
var wswarm = require('webrtc-swarm')
var onend = require('end-of-stream')
var pump = require('pump')
var through = require('through2')
var sub = require('subleveldown')
var shasum = require('shasum')

module.exports = Chat
inherits(Chat, EventEmitter)

function Chat (nym, db) {
  if (!(this instanceof Chat)) return new Chat(nym, db)
  EventEmitter.call(this)
  this.db = db
  this.logs = {}
  this.swarms = {}
  this.peers = {}
  this.onswarm = {}
  this.nym = nym
  this.hubs = [ 'https://signalhub.mafintosh.com/' ]
}

Chat.prototype.join = function (channel) {
  var self = this
  if (has(self.swarms, channel)) {
    return self.emit('join', channel)
  }
  self.logs[channel] = hyperlog(
    sub(self.db, channel), { valueEncoding: 'json' })

  self.logs[channel].createReadStream({ live: true })
    .on('data', function (row) {
      self.emit('say', channel, row)
    })

  self.emit('join', channel)
  var hub = signalhub(shasum('chatwizard.' + channel), self.hubs)
  var swarm = wswarm(hub)
  self.swarms[channel] = swarm
  self.peers[channel] = {}
  console.log('onswarm')
  self.onswarm[channel] = function (peer, id) {
    console.log('PEER', id)
    self.peers[channel][id] = peer
    peer.pipe(self.logs[channel].replicate({ live: true })).pipe(peer)
  }
  swarm.on('peer', self.onswarm[channel])
}

Chat.prototype.part = function (channel) {
  var self = this
  if (!has(self.swarms, channel)) return
  delete self.logs[channel]
  self.swarms[channel].removeListener('peer', self.onswarm[channel])
  delete self.swarms[channel]
  delete self.onswarm[channel]
  Object.keys(self.peers[channel]).forEach(function (key) {
    self.peers[channel][key].destroy()
  })
  delete self.peers[channel]
  self.emit('part', channel)
}

Chat.prototype.say = function (channel, msg) {
  var data = {
    time: Date.now(),
    who: this.nym,
    message: msg
  }
  this.logs[channel].append(data, function (err, node) {})
}
