import Server from './server'
import AgentClient from './agentClient'
import Common from './common'

const server = new Server(true)
const agentClient = new AgentClient()

server.listen()

agentClient.emitter.on('connected', () => {
	console.info(Common.now(), 'Storage connecté avec le tag', agentClient.tag)
})