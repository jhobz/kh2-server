// import express from 'express'
import WebSocket from 'ws'
// import Multiworld from './Multiworld'

// const app = express()
const port = 3000 // TODO: process.env.PORT
const server = new WebSocket.Server({ port })

server.on('connection', socket => {
    socket.on('message', message => {
        console.log(`client sent message: ${message}`)

        // TODO: Check for type of message, perform different actions
        // * create multiworld room
        // * join multiworld room
        // * "send" item
    })
})

export interface Message {
    type: 'MULTI' | 'OTHER' // 'OTHER' is yet to be implemented
    action: 'AUTH' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'CREATE_ROOM' | 'ITEM'
    data: MessageData
}

export interface MessageData {
    playerId?: number
    item?: string
    location?: string
    roomId?: string
    message?: string
}

// app.get('/', (req, res) => {

// })

// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`)
// })