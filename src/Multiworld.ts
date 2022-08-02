import { customAlphabet } from 'nanoid'
import { nolookalikesSafe } from 'nanoid-dictionary'
import { WebSocket } from 'ws'
import { Message } from '../index'

const generateId = customAlphabet(nolookalikesSafe, 6)

export class Multiworld {
    maxClients: number
    connectedClients: Client[]
    rooms: { [key: string]: Room } = {}

    // TODO: Refactor argument to an options argument that can accept a list of currently connected clients. (LONG-TERM)
    //       This would allow the server to store the connected clients somewhere and restore a session after a crash or reboot
    constructor(maxClients?: number) {
        this.maxClients = maxClients || -1
        this.connectedClients = []
    }

    authenticateClient(message: Message, socket: WebSocket) {
        if (!message.data.hasOwnProperty('playerId')) {
            throw new Error('Could not authenticate client. A playerId is required.')
        }

        if (typeof message.data.playerId !== 'number') {
            throw new Error('Could not authenticate client. The \'playerId\' field is not a number.')
        }

        this.connectedClients.push({ playerId: message.data.playerId, socket })
        socket.send({ type: 'MULTI', action: 'AUTH', data: { message: 'Client successfully authenticated.' } })
    }

    createRoom(client: Client) {
        const room = new Room([client]) 
        this.rooms[room.id] = room
    }

    joinRoom(roomId: string, client: Client) {
        if(client.roomId) {
            this.leaveRoom(client.roomId, client)
        }
        client.roomId = this.rooms[roomId].add(client)
    }

    leaveRoom(roomId: string, client: Client) {
        this.rooms[roomId].remove(client)
    }
}

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
        if (this.clients.includes(client) || this.clients.find(value => value.playerId === client.playerId)) {
            throw new Error('Could not join room. Client with this playerId already exists in room.')
        }

        this.clients.push(client)
        return this.id
    }

    remove(client: Client) {
        if (!this.clients.includes(client)) {
            throw new Error('Could not leave room. Client is not in room.')
        }

        const index = this.clients.findIndex(value => value.playerId === client.playerId )
        this.clients.splice(index, 1)
    }
}

export interface Client {
    playerId: number
    socket?: WebSocket
    roomId?: string
}