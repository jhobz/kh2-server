import { customAlphabet } from 'nanoid'
import nanoidDict from 'nanoid-dictionary'
import { WebSocket } from 'ws'
const { nolookalikesSafe } = nanoidDict

const generateId = customAlphabet(nolookalikesSafe, 6)

export class Room {
    id: string
    maxClients: number | undefined
    clients: Client[]

    constructor(initialClients: Client[], maxClients?: number) {
        this.id = generateId()
        this.clients = initialClients || []
        this.maxClients = maxClients
    }

    add(client: Client) {
        if (this.containsClient(client) || this.clients.find(value => value.playerId === client.playerId)) {
            throw new Error('Client with same playerId already exists in room.')
        }

        this.clients.push(client)
        return this.id
    }

    remove(client: Client) {
        if (!this.containsClient(client)) {
            throw new Error('Client is not in room.')
        }

        const index = this.clients.findIndex(value => value.playerId === client.playerId )
        this.clients.splice(index, 1)
    }

    containsClient(client: Client) {
        return this.clients.find(c => c.clientId === client.clientId)
    }
}

export interface Client {
    clientId: string
    playerId: number
    roomId?: string
}