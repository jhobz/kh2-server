// import express from 'express'
import WebSocket, { WebSocketServer } from 'ws'
import { Client } from './Room.js'
import { Multiworld } from './Multiworld.js'
import { MultiMap } from './types/MultiMap.js'
import ajv from 'ajv'
import * as MultiMapSchema from './schemas/MultiMap.schema.json' assert { type: 'json' }

const validateMultiMap = new ajv.default({ allErrors: true }).compile<MultiMap>(MultiMapSchema)

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
    item?: string
    location?: string
    error?: boolean
    message?: string
    client?: Client
    roomId?: string
    multiMap?: MultiMap
}

function handleMessage(message: Message, socket: WebSocket): Message {
    if (message.type !== 'MULTI') {
        // For now, no other types are supported
        return {} as Message
    }

    switch (message.action) {
        case 'LOGIN':
            return mw.authenticateClient(message)
        case 'LOGOUT':
            return mw.removeClient(message.data.client as Client)
        case 'CREATE_ROOM':
            console.log('MESSAGE', message)
            return mw.createRoom(message.data.client as Client)
        case 'JOIN_ROOM':
            return mw.joinRoom(message.data.roomId as string, message.data.client as Client)
        case 'LEAVE_ROOM':
            return mw.leaveRoom(message.data.client?.roomId as string, message.data.client as Client)
        case 'LOAD_MULTI_MAP':
            const multiMap = message.data.multiMap as MultiMap
            if (validateMultiMap(multiMap)) {
                return mw.loadMultiMap(multiMap, message.data.client?.roomId as string)
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
            return {} as Message
        default:
            return {} as Message
    }
}

// app.get('/', (req, res) => {

// })

// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`)
// })