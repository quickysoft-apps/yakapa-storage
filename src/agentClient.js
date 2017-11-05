import 'babel-polyfill'
import io from 'socket.io-client'
import * as LZString from 'lz-string'
import { EventEmitter } from 'events'

import Common from './common'

const SOCKET_SERVER_URL = 'https://mprj.cloudapp.net'
const DEFAULT_NICKNAME = 'Storage'

const AGENT_TAG = 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133'
const EVENT_PREFIX = 'yakapa'
const RESULT = `${EVENT_PREFIX}/result`

class AgentClientEmitter extends EventEmitter {
  
  connected() {
    this.emit('connected')
  }
  
  socketError(error) {
    this.emit('socketError', error)
  }
  
  connectionError(error) {
    this.emit('connectionError', error)
  }
  
  pong(ms) {
    this.emit('pong', ms)
  }
  
  result(message, from) {
    this.emit('result', message, from)
  }
}

export default class AgentClient {

  constructor() {

    this._emitter = new AgentClientEmitter()
    this._isAuthenticated = false
    this._tag = AGENT_TAG

    this._socket = io(SOCKET_SERVER_URL, {
      rejectUnauthorized: false,
      query: `tag=${this._tag}`
    })

    this._socket.on('pong', (ms) => {
      this._emitter.pong(ms)
    })

    this._socket.on('connect', () => {
      this.connected()
    })

    this._socket.on('connect_error', (error) => {
      this.connectionError(error)
    })

    this._socket.on('error', (error) => {
      this.socketError(error)
    })

    this._socket.on(RESULT, (socketMessage) => {      
      this.result(socketMessage)
    })
  }

  get tag() {
    return this._tag
  }

  get emitter() {
    return this._emitter
  }

  getJson(json) {
    return typeof json === 'object' ? json : JSON.parse(json)
  }

  check(socketMessage) {

    if (this._isAuthenticated === false) {
      console.warn(`${Common.now()} Pas authentifié`)
      return false
    }

    if (socketMessage == null) {
      console.warn(`${Common.now()} Pas de message à traiter`)
      return false
    }

    if (socketMessage.from == null) {
      console.warn(`${Common.now()} Expéditeur non défini'`)
      return false
    }

    console.info(socketMessage)
    return true
  }

  emit(event = RESULT, payload, to) {
    const compressed = payload != null ? LZString.compressToUTF16(payload) : null
    const socketMessage = {
      from: this._tag,
      nickname: `${DEFAULT_NICKNAME} ${this._tag}`,
      to: to,
      message: compressed
    }

    this._socket.emit(event, socketMessage)
  }

  connected() {
    console.info(Common.now(), 'Connecté à', SOCKET_SERVER_URL)
    this._isAuthenticated = true
    this._emitter.connected()
  }

  socketError(error) {
    console.error(Common.now(), 'Socket error', error)
    this._emitter.socketError(error)
  }
 
  connectionError(error) {
    console.info(Common.now(), 'Erreur connexion', error)
    this._emitter.connectionError(error)
  }
  
  result(socketMessage) {        
    if (!this.check(socketMessage)) {
      return
    }
    const decompressed = LZString.decompressFromUTF16(socketMessage.message)
    console.info(`Message ${decompressed}`)      
    this._emitter.result(decompressed, socketMessage.from)      
  }

}