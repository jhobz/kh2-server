import WebSocket from 'ws'
import { Multiworld, Room, Client } from '../Multiworld'
import { Message, MessageData } from '../../index'

jest.mock('ws')

describe('Room', () => {
    let defaultClient: Client

    beforeEach(() => {
        defaultClient = { playerId: 0 }
    })

    describe('constructor()', () => {
        it('should create a list of connected clients', () => {
            const room = new Room([defaultClient])

            expect(room.clients).toEqual([{ playerId: 0 }])
        })
    })

    describe('add()', () => {
        let room: Room

        beforeEach(() => {
            room = new Room([defaultClient])
        })

        it('should add a client to an existing room', () => {
            room.add({ playerId: 1 })
            expect(room.clients).toContainEqual({ playerId: 1 })
        })

        it('should prevent the same client from joining twice', () => {
            expect(() => { room.add(defaultClient) }).toThrow('Could not join room. Client with this playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should prevent a client with the same id of another client in the room from joining', () => {
            expect(() => { room.add({ playerId: 0 }) }).toThrow('Could not join room. Client with this playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })
    })

    describe('remove()', () => {
        let room: Room

        beforeEach(() => {
            room = new Room([defaultClient, { playerId: 1 }])
        })

        it('should remove a client from a room', () => {
            room.remove(defaultClient)
            expect(room.clients).toHaveLength(1)
            expect(room.clients).toContainEqual({ playerId: 1 })
        })

        it('should require exactly the same client for removal', () => {
            expect(() => { room.remove({ playerId: 0 }) }).toThrow('Could not leave room. Client is not in room.')
            expect(room.clients).toHaveLength(2)
            expect(room.clients).toContainEqual({ playerId: 0 })
        })
    })
})

describe('Multiworld', () => {
    describe('constructor()', () => {
        it('should default to no maximum number of clients', () => {
            const mw = new Multiworld()
            expect(mw.maxClients).toBe(-1)
        })

        it('should set the maximum number of clients, if included', () => {
            const mw = new Multiworld(64)
            expect(mw.maxClients).toBe(64)
        })
    })

    describe('authenticateClient()', () => {
        let mw: Multiworld
        let message: Message
        let socket: WebSocket

        beforeEach(() => {
            mw = new Multiworld(4)
            message = { type: "MULTI", action: "AUTH", data: { playerId: 0 } }
            socket = new WebSocket('') 
        })

        it('should require a playerId', () => {
            delete message.data.playerId
            expect(() => { mw.authenticateClient(message, socket) }).toThrow('Could not authenticate client. A playerId is required.')
        })

        it('should require playerId to be a number', () => {
            message.data.playerId = 'string' as any
            expect(() => { mw.authenticateClient(message, socket) }).toThrow('Could not authenticate client. The \'playerId\' field is not a number.')
        })

        it('should store the client in the list of connected clients', () => {
            expect(mw.connectedClients).toHaveLength(0)
            mw.authenticateClient(message, socket)
            expect(mw.connectedClients).toHaveLength(1)
            expect(mw.connectedClients).toContainEqual({ playerId: message.data.playerId, socket })
        })

        it('should send the client a message on success', () => {
            mw.authenticateClient(message, socket)
            expect(socket.send).toHaveBeenCalledWith({ type: 'MULTI', action: 'AUTH', data: { message: 'Client successfully authenticated.' } })
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('createRoom()', () => {
        it('should create a new Room', () => {
            fail()
        })

        it('should place the client in the new Room', () => {
            fail()
        })

        it('should keep track of the new Room and its id', () => {
            fail()
        })
    })

    describe('joinRoom()', () => {
        it('should place the client in a matching room', () => {
            fail()
        })

        it('should not place the client in a room that doesn\'t exist', () => {
            fail()
        })

        it('should not allow joining if another client exists with the same playerId in the room', () => {
            fail()
        })

        it('should move the client from one room to another if it is already in one', () => {
            fail()
        })
    })

    describe('leaveRoom()', () => {
        it('should remove the client from a room if it is in one', () => {
            fail()
        })

        it('should not remove a different client from the room', () => {
            fail()
        })
    })
})