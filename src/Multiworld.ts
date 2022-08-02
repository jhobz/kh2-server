import { customAlphabet } from 'nanoid'
import { nolookalikesSafe } from 'nanoid-dictionary'
import { WebSocket } from 'ws'

const generateId = customAlphabet(nolookalikesSafe, 6)

export class Multiworld {
    maxClients: number
    // connectedClients: string[] // TODO: Do we want this?
    rooms: { [key: string]: Room } = {}

    constructor(maxClients: number) {
        this.maxClients = maxClients
    }

    createRoom(client: Client) {
        const room = new Room([client]) 
        this.rooms[room.id] = room
    }

    joinRoom(roomId: string, client: Client) {
        this.rooms[roomId].add(client)
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
        // TODO: Prevent same client from joining twice
        this.clients.push(client)
    }

    remove(client: Client) {
        // TODO: Check against a client that isn't in the room
        this.clients.splice(this.clients.indexOf(client), 1)
    }
}

interface Client {
    playerId: number
    socket?: WebSocket
}