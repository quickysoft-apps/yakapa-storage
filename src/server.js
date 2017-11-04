import express from 'express'
import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
const request = require('request')

import Common from './common'

const DEFAULT_PUBLIC_PORT = 80
const DEFAULT_PRIVATE_PORT = 3001
const DEFAULT_PUBLIC_SSL_PORT = 444
const DEFAULT_PRIVATE_SSL_PORT = 3444
const DEFAULT_HOST = 'http://mprj.cloudapp.net'
const DEFAULT_SSL_HOST = 'https://mprj.cloudapp.net'

export default class Server {

  constructor(secure = true) {

    this._secure = secure  
   
    const sslOptions = {
      key: fs.readFileSync('/home/azemour/yakapa/yakapa-storage/yakapass.pem'),
      cert: fs.readFileSync('/home/azemour/yakapa/yakapa-storage/yakapass.crt')
    }

    this.publicPort = secure ? DEFAULT_PUBLIC_SSL_PORT : DEFAULT_PUBLIC_PORT
    this.privatePort = secure ? DEFAULT_PRIVATE_SSL_PORT : DEFAULT_PRIVATE_PORT
    this.expressApp = express()    
    this.webServer = secure ? https.Server(sslOptions, this.expressApp) : http.Server(this.expressApp)    
		this.expressApp.use(express.static(path.resolve(__dirname, '..', 'static')))
    this.expressApp.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '..', 'static', 'index.html'))
    })    
		
  }   
  
  listen() {
    this.webServer.listen(this.privatePort, () => {
      console.info(Common.now(), `Listening on *:${this.publicPort} --> *:${this.privatePort}`)
    })    
  } 
	
  toJson(json) {
    return typeof json === 'object' ? json : JSON.parse(json)
  }

}