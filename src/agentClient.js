import 'babel-polyfill'
import io from 'socket.io-client'
import * as LZString from 'lz-string'
import {
  EventEmitter
} from 'events'

import Common from './common'

const SOCKET_SERVER_URL = 'https://mprj.cloudapp.net'
const DEFAULT_NICKNAME = 'Storage'

const EVENT_PREFIX = 'yakapa'
const AGENT_TAG = 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133'
const RESULT = `${EVENT_PREFIX}/result`
const AUTHENTICATED = `${EVENT_PREFIX}/authenticated`


class AgentClientEmitter extends EventEmitter {
  doConnected() {
    this.emit('connected')
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
      this._emitter.emit('pong', ms)
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

    this._socket.on(AUTHENTICATED, (socketMessage) => {
      this.authenticated(socketMessage)
    })

    this._socket.on(RESULT, async (socketMessage) => {
      await this.store(socketMessage)
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
    this._emitter.doConnected()
  }

  socketError(error) {
    console.error(Common.now(), 'Socket error', error)
    this._emitter.emit('socketError', error)
  }
 
  connectionError(error) {
    console.info(Common.now(), 'Erreur connexion', error)
    this._emitter.emit('connectionError', error)
  }

  authenticated(socketMessage) {
    console.info(Common.now(), 'Bienvenue', socketMessage.nickname)
    this._isAuthenticated = true
    this._nickname = socketMessage.nickname
    this._emitter.emit('authenticated', socketMessage)
  }
  
  async store(socketMessage) {
    return new Promise((resolve, reject) => {
      if (!this.check(socketMessage)) reject()
      const decompressed = LZString.decompressFromUTF16(socketMessage.message)
      console.info(`Message ${decompressed}`)
      //const emitter = socketMessage.From;
      //this.emit(SocketEvent.CHAT_MESSAGE, Faker.lorem.sentence(15), emitter);
      this._emitter.emit('store', socketMessage)
      resolve()
    })
  }

}