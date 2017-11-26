import Agent from 'yakapa-agent-client'
import * as Common from 'yakapa-common'
import Storage from './storage'

import express from 'express'
import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import dataForge from 'data-forge'
import * as LZString from 'lz-string'

const EVENT_PREFIX = 'yakapa'
const STORED = `${EVENT_PREFIX}/stored`
const STORE = `${EVENT_PREFIX}/store`

const app = express().listen(3001)
const client = new Agent.Client({
	server: 'https://mprj.cloudapp.net',
	tag: 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133',
	nickname: 'Storage'
})

client.emitter.on('connected', () => {
	Common.Logger.info('Storage connecté avec le tag', client.tag)
})

client.emitter.on(STORE, (socketMessage) => {

	const { from, date, message } = socketMessage	
	const decompressed = LZString.decompressFromUTF16(message)	
	const { job, value } = JSON.parse(decompressed)

	Common.Logger.info('Storing value from', from)

	const storage = new Storage(from, job, value, date, 3, 10000)
	storage.store(
		() => {
			Common.Logger.info('Value storage done for', from)
			const stored = { from, job }				
			client.emit(STORED, JSON.stringify(stored))
		},
		(error) => {
			Common.Logger.warn('Value storage failed for', from, error)
		}
	)	

})