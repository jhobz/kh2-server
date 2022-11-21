// import express from 'express'
import WebSocket, { WebSocketServer } from 'ws'
import { Client } from './Client.js'
import { Multiworld } from './Multiworld.js'
import { MultiMap } from './types/MultiMap.js'
import Ajv from 'ajv'
import MultiMapSchema from './schemas/MultiMap.schema.json' assert { type: 'json' }
import KH2ItemSchema from './schemas/KH2Item.schema.json' assert { type: 'json' }
import { KH2ItemMessage } from './types/KH2ItemMessage.js'

const ajv = new Ajv.default({allErrors: true})
const validateMultiMap = ajv.compile<MultiMap>(MultiMapSchema)
const validateKH2ItemMessage = ajv.compile<KH2ItemMessage>(KH2ItemSchema)

// const app = express()
const port = 3000 // TODO: process.env.PORT
const server = new WebSocketServer({ port, })
const mw = new Multiworld(64)

server.on('connection', socket => {
    socket.on('message', message => {
        console.log('client sent message: ', message.toString())
        const response = handleMessage(JSON.parse(message.toString()), socket)
        console.log('sending to client:', response)
        socket.send(JSON.stringify(response))
    })
})

export interface Message {
    type: 'MULTI' | 'OTHER' // 'OTHER' is yet to be implemented
    action: 'LOGIN' | 'LOGOUT' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'CREATE_ROOM' | 'ITEM' | 'LOAD_MULTI_MAP'
    data: MessageData
}

export interface MessageData {
    playerId?: number
    location?: string
    error?: boolean
    message?: string
    client?: Client
    roomId?: string
    multiMap?: MultiMap
    item?: KH2ItemMessage
}

function handleMessage(message: Message, socket: WebSocket): Message {
    if (message.type !== 'MULTI') {
        // For now, no other types are supported
        return {} as Message
    }

    if (message.action === 'LOGIN') {
        return mw.authenticateClient(message, socket)
    }

    const client = mw.getClientById(message.data.client?.clientId as string)
    if (!client) {
        // ERROR, NOT CONNECTED, NEED TO AUTH
        return {
            type: 'MULTI',
            action: 'LOGOUT',
            data: {
                error: true,
                message: 'User not in list of connected clients.'
            }
        }
    }

    switch (message.action) {
        case 'LOGOUT':
            return mw.removeClient(client)
        case 'CREATE_ROOM':
            return mw.createRoom(client)
        case 'JOIN_ROOM':
            return mw.joinRoom(message.data.roomId as string, client)
        case 'LEAVE_ROOM':
            return mw.leaveRoom(client.roomId as string, client)
        case 'LOAD_MULTI_MAP':
            const multiMap = message.data.multiMap as MultiMap
            if (validateMultiMap(multiMap)) {
                return mw.loadMultiMap(multiMap, client.roomId as string)
            }
            return {
                type: 'MULTI',
                action: 'LOAD_MULTI_MAP',
                data: {
                    error: true,
                    message: 'Cannot load MultiMap. Map is not valid.'
                }
            }
        case 'ITEM':
            const kh2Item = message.data.item as KH2ItemMessage
            if (validateKH2ItemMessage(kh2Item)) {
                return mw.handleItem(message.data.item as KH2ItemMessage, client)
            }
            return {
                type: 'MULTI',
                action: 'ITEM',
                data: {
                    error: true,
                    message: 'Cannot read item info.'
                }
            }
        default:
            return {} as Message
    }
}

// app.get('/', (req, res) => {

// })

// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`)
// })