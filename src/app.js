import Agent from 'yakapa-agent-client'
import * as Common from 'yakapa-common'
import Storage from './storage'

import * as path from 'path'
import * as fs from 'fs'
import perfy from 'perfy'
import { lock } from 'ki1r0y.lock'
import dataForge from 'data-forge'
import * as LZString from 'lz-string'

const EVENT_PREFIX = 'yakapa'
const STORED = `${EVENT_PREFIX}/stored`
const STORE = `${EVENT_PREFIX}/store`

const agent = new Agent({
	port: 3001,
	server: 'https://mprj.cloudapp.net',
	tag: 'f1a33ec7-b0a5-4b65-be40-d2a93fd5b133',
	nickname: 'Storage'
})

agent.client.emitter.on('connected', () => {
	Common.logger.info('Storage connecté avec le tag', agent.client.tag)
})

agent.client.emitter.on(STORE, (socketMessage) => {
		
	const { from, date, message } = socketMessage
	const decompressed = LZString.decompressFromUTF16(message)		
	const { extractor, value } = JSON.parse(decompressed)
	
	Common.logger.info('Storing value from', from)
	const storage = new Storage(from,	extractor,value, date, 3, 10000)
	storage.store(
		() => {
			Common.logger.info('Value storage done for', from)
			const stored = {
				from,
				extractor
			}
			agent.client.emit(STORED, JSON.stringify(stored))
		},
		(error) => {
			Common.logger.warn('Value storage failed for', from, error)
		})
})