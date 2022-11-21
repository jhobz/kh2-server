import { customAlphabet } from 'nanoid'
import nanoidDict from 'nanoid-dictionary'
import { Client } from './Client.js'
import { Message } from './index.js'
import { KH2ItemMessage } from './types/KH2ItemMessage.js'
import { MultiMap } from './types/MultiMap.js'
const { nolookalikesSafe } = nanoidDict

const generateId = customAlphabet(nolookalikesSafe, 6)

export class Room {
    id: string
    maxClients: number | undefined
    clients: Client[]
    multiMap: MultiMap | undefined

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


    // Multiworld item stuff ----------------

    setMultiMap(multiMap: MultiMap) {
        this.multiMap = multiMap
    }

    getItemInfo(location: string, playerId: number): KH2ItemMessage {
        if (!this.multiMap) {
            throw new Error('Room has no MultiMap!')
        }

        const itemInfo = this.multiMap.find(value => value.location === location && value.from === playerId)
        if (!itemInfo) {
            throw new Error(`Player ${playerId} should not have a dummy item at location ${location}.`)
        }

        return itemInfo
    }

    sendItem(itemInfo: KH2ItemMessage) {
        const client = this.clients.find(c => c.playerId === itemInfo.to)
        if (!client) {
            throw new Error(`No player with playerId ${itemInfo.to} in room!`)
        }

        client.socket.send(JSON.stringify({
            type: 'MULTI',
            action: 'ITEM',
            data: {
                item: itemInfo
            }
        } as Message))
    }
}