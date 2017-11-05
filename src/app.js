import Server from './server'
import AgentClient from './agentClient'
import Common from './common'

import * as path from 'path'
import * as fs from 'fs'
import { lock } from 'ki1r0y.lock'
import dataForge from 'data-forge'

const server = new Server(true)
const agentClient = new AgentClient()

server.listen()

agentClient.emitter.on('connected', () => {
	console.info(Common.now(), 'Storage connecté avec le tag', agentClient.tag)
})

agentClient.emitter.on('result', (message, from) => {
	console.info(Common.now(), 'Storing result', message, 'from', from)
	const filename = path.join(__dirname, '..', '..', 'storage', `${from}.json`)
	lock(filename, function(unlock) {		
		try {
			const data = {				
				timestamp: new Date().toJSON(),
				source: from,
				...message
			}
			const existing = new dataForge.readFileSync(filename)
			const incoming = new dataForge.DataFrame(data).setIndex("timestamp").dropSeries("timestamp")
			console.log('incoming', incoming.asJSON())
			let dataFrame = undefined
			if (existing)	{
				console.log('existing', existing.parseJSON())
			}				
			//dataFrame = existing ? existing.concat(incoming) : incoming			
			incoming.asJSON().writeFileSync(filename);
			console.info(Common.now(), 'Storage done for', filename)
		} 
		catch(error) {			
			console.warn(Common.now(), 'Storage failed for', filename, error)
		}
		finally {
			unlock()
		}
	});
})