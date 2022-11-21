import { WebSocket } from 'ws'
import { customAlphabet } from 'nanoid'
import nanoidDict from 'nanoid-dictionary'

const { nolookalikesSafe } = nanoidDict

const generateId = customAlphabet(nolookalikesSafe, 6)

export class Client {
    clientId: string
    playerId: number
    socket: WebSocket
    roomId?: string

    constructor(playerId: number, socket: WebSocket) {
        this.socket = socket
        this.playerId = playerId
        this.clientId = generateId()
    }
}