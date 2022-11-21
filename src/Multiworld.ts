import { WebSocket } from 'ws'
import { Client } from './Client.js'
import { Message } from './index.js'
import { Room } from './Room.js'
import { KH2ItemMessage } from './types/KH2ItemMessage.js'
import { MultiMap } from './types/MultiMap.js'

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

    authenticateClient(message: Message, socket: WebSocket): Message {
        if (!message.data.hasOwnProperty('playerId')) {
            throw new Error('Could not authenticate client. A playerId is required.')
        }

        if (typeof message.data.playerId !== 'number') {
            throw new Error('Could not authenticate client. The \'playerId\' field is not a number.')
        }

        // const client: any = { playerId: message.data.playerId }
        const client = new Client(message.data.playerId, socket)
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
        if (!roomId) {
            return {
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. No roomId provided.'
                }
            }
        }

        const room = this.rooms[roomId]

        if (!room) {
            return {
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: `Unable to join room. Room '${roomId}' does not exist.`
                }
            }
        }

        if (client.roomId) {
            this.leaveRoom(client.roomId, client)
        }

        try {
            client.roomId = room.add(client)
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
        const index = this.connectedClients.indexOf(client)
        if (index < 0) {
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

        this.connectedClients.splice(index, 1)

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

    getClientById(clientId: string): Client | undefined {
        return this.connectedClients.find(c => c.clientId === clientId)
    }

    loadMultiMap(map: MultiMap, roomId: string): Message {
        const room = this.rooms[roomId]

        if (!room) {
            return {
                type: 'MULTI',
                action: 'LOAD_MULTI_MAP',
                data: {
                    error: true,
                    message: 'Could not load MultiMap. Room does not exist.'
                }
            }
        }

        room.setMultiMap(map)

        return {
            type: 'MULTI',
            action: 'LOAD_MULTI_MAP',
            data: {
                message: `MultiMap loaded into room '${roomId}' successfully.`
            }
        }
    }

    handleItem(item: KH2ItemMessage, client: Client): Message {
        // TODO: Split KH2 item strings out to their own enum
        if (item.name !== 'dummy 14') {
            return {
                type: 'MULTI',
                action: 'ITEM',
                data: {
                    message: 'Non-multiworld item tracking not yet implemented.'
                }
            }
        }

        if (!client.roomId) {
            return {
                type: 'MULTI',
                action: 'ITEM',
                data: {
                    error: true,
                    message: 'Could not send item. User is not in a room.'
                }
            }
        }
        const room = this.rooms[client.roomId]
        if (!room) {
            return {
                type: 'MULTI',
                action: 'ITEM',
                data: {
                    error: true,
                    message: 'Could not send item. Specified room does not exist.'
                }
            }
        }

        let itemInfo: KH2ItemMessage
        try {
            itemInfo = room.getItemInfo(item.location, client.playerId) // KH2ItemMessage
            room.sendItem(itemInfo)
        } catch (e: any) {
            return {
                type: 'MULTI',
                action: 'ITEM',
                data: {
                    error: true,
                    message: `Could not send item. ${e.message}`
                }
            }
        }

        return {
            type: 'MULTI',
            action: 'ITEM',
            data: {
                message: `Sent ${itemInfo.name} to Player ${itemInfo.to} successfully.`
            }
        }
    }
}
