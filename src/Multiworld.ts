import { Message } from './index.js'
import { Room, Client } from './Room.js'
import { customAlphabet } from 'nanoid'
import nanoidDict from 'nanoid-dictionary'
const { nolookalikesSafe } = nanoidDict

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

    authenticateClient(message: Message): Message {
        if (!message.data.hasOwnProperty('playerId')) {
            throw new Error('Could not authenticate client. A playerId is required.')
        }

        if (typeof message.data.playerId !== 'number') {
            throw new Error('Could not authenticate client. The \'playerId\' field is not a number.')
        }

        const client: any = { playerId: message.data.playerId }
        client.clientId = generateId()
        this.connectedClients.push(client)

        return {
            type: 'MULTI',
            action: 'LOGIN',
            data: {
                message: 'Client successfully authenticated.',
                client
            }
        }
    }

    createRoom(client: Client): Message {
        const room = new Room([client]) 
        this.rooms[room.id] = room
        client.roomId = room.id
        
        return {
            type: 'MULTI',
            action: 'CREATE_ROOM',
            data: {
                message: `Room '${room.id}' created successfully.`,
                roomId: room.id,
                client
            }
        }
    }

    joinRoom(roomId: string, client: Client): Message {
        if (!Object.keys(this.rooms).includes(roomId)) {
            return {
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: `Unable to join room. ${roomId ? `Room '${roomId}' does not exist.` : 'No roomId provided.'}`,
                }
            }
        }

        if (client.roomId) {
            this.leaveRoom(client.roomId, client)
        }

        try {
            client.roomId = this.rooms[roomId].add(client)
        } catch (e: any) {
            return {
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. ' + e.message
                }
            }
        }
        
        return {
            type: 'MULTI',
            action: 'JOIN_ROOM',
            data: {
                message: `Room '${roomId}' joined successfully.`,
                client
            }
        }
    }

    leaveRoom(roomId: string, client: Client): Message {
        if (!client.roomId) {
            return {
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. User is not in a room.',
                }
            }
        }

        if (!Object.keys(this.rooms).includes(roomId)) {
            return {
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: `Unable to leave room. ${roomId ? `User is not in room '${roomId}'.` : 'No roomId provided.'}`,
                }
            }
        }

        try {
            this.rooms[roomId].remove(client)
            delete client.roomId

            if (this.rooms[roomId].clients.length === 0) {
                delete this.rooms[roomId]
            }
        } catch (e: any) {
            return {
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. ' + e.message
                }
            }
        }

        return {
            type: 'MULTI',
            action: 'LEAVE_ROOM',
            data: {
                message: `Room '${roomId}' left successfully.`,
                client
            }
        }
    }

    removeClient(client: Client): Message {
        if (!this.hasClient(client)) {
            return {
                type: 'MULTI',
                action: 'LOGOUT',
                data: {
                    error: true,
                    message: 'User not in list of connected clients.'
                }
            }
        }

        if (client.roomId) {
            const result = this.leaveRoom(client.roomId, client)
            if (result.data.error) {
                return result
            }
        }

        this.connectedClients.splice(this.connectedClients.indexOf(this.hasClient(client) as Client), 1)

        return {
            type: 'MULTI',
            action: 'LOGOUT',
            data: {
                message: 'User disconnected successfully.'
            }
        }
    }

    hasClient(client: Client): Client | undefined {
        return this.connectedClients.find(c => c.clientId === client.clientId)
    }
}
