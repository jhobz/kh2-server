import WebSocket from 'ws'
import { Multiworld } from '../Multiworld'
import { Room, Client } from '../Room'
import { Message, MessageData } from '../index'
import { customAlphabet } from 'nanoid'

// MOCKS ==========
jest.mock('ws')
jest.mock('nanoid', () => {
    // Ok, obviously this is gross as fuck. But jest is really dumb and doesn't actually
    // clear mocks in modules when you use .clearAllMocks or .mockClear. IT DOES RESET THEM
    // IF YOU USE RESET, but it won't clear. It's extremely frustrating, but this was legitimately
    // the best solution here.
    const mockFn = jest.fn(() => 'qwerty')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
        .mockImplementationOnce(() => 'asdfgh')
    return {
        __esModule: true,
        customAlphabet: jest.fn(() => {
            return mockFn
        })
    }
})

// TESTS ==========

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
            message = { type: "MULTI", action: "LOGIN", data: { playerId: 0 } }
            socket = new WebSocket('') 
        })

        it('should require a playerId', () => {
            delete message.data.playerId
            expect(() => mw.authenticateClient(message, socket)).toThrow('Could not authenticate client. A playerId is required.')
        })

        it('should require playerId to be a number', () => {
            message.data.playerId = 'string' as any
            expect(() => mw.authenticateClient(message, socket)).toThrow('Could not authenticate client. The \'playerId\' field is not a number.')
        })

        it('should store the client in the list of connected clients', () => {
            expect(mw.connectedClients).toHaveLength(0)
            mw.authenticateClient(message, socket)
            expect(mw.connectedClients).toHaveLength(1)
            expect(mw.connectedClients).toContainEqual({ playerId: message.data.playerId, socket })
        })

        it('should return a message on success', () => {
            const messageToClient = mw.authenticateClient(message, socket)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LOGIN',
                data: {
                    message: 'Client successfully authenticated.',
                    client: {
                        playerId: 0,
                        socket
                    }
                }
            })
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('createRoom()', () => {
        let mw: Multiworld
        let client: Client

        beforeEach(() => {
            mw = new Multiworld(4)
            client = {
                playerId: 0,
                socket: new WebSocket('')
            }
        })

        it('should create a new Room and keep track of its id', () => {
            mw.createRoom(client) 

            expect(Object.keys(mw.rooms)).toHaveLength(1)
            expect(Object.keys(mw.rooms)[0]).toBe('asdfgh')
            expect(mw.rooms['asdfgh']).toBeInstanceOf(Room)
            expect(mw.rooms['asdfgh'].clients).toContain(client)
        })

        it('should add the roomId to the client object', () => {
            expect(client).not.toHaveProperty('roomId')
            mw.createRoom(client)
            expect(client).toHaveProperty('roomId')
            expect(client.roomId).toBe('asdfgh')
        })

        it('should return a successful message to the client upon successful creation', () => {
            const messageToClient = mw.createRoom(client)

            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'CREATE_ROOM',
                data: {
                    message: 'Room \'asdfgh\' created successfully.',
                    client
                }
            })
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('joinRoom()', () => {
        let mw: Multiworld
        let existingClient: Client

        beforeEach(() => {
            mw = new Multiworld(4)
            existingClient = {
                playerId: 0,
                socket: new WebSocket('')
            }

            mw.createRoom(existingClient)
        })

        it('should place the client in a matching room', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            expect(mw.rooms['asdfgh'].clients).toHaveLength(1)
            expect(mw.rooms['asdfgh'].clients).not.toContain(client)

            mw.joinRoom('asdfgh', client)

            expect(mw.rooms['asdfgh'].clients).toHaveLength(2)
            expect(mw.rooms['asdfgh'].clients).toContain(client)
        })

        it('should return a successful message to the client', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            const messageToClient = mw.joinRoom('asdfgh', client)

            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    message: 'Room \'asdfgh\' joined successfully.',
                    client
                }
            })
        })

        it('should return an unsuccessful message if there is no roomId', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            const messageToClient = mw.joinRoom('', client)

            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. No roomId provided.',
                }
            })
        })

        it('should not move the client if the room doesn\'t exist', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            expect(mw.rooms).not.toHaveProperty('qwerty')

            mw.joinRoom('qwerty', client)
            expect(client).not.toHaveProperty('roomId')
            expect(Object.keys(mw.rooms)).toHaveLength(1)
            expect(mw.rooms).not.toHaveProperty('qwerty')
        })

        it('should return an unsuccessful message if the room doesn\'t exist', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            expect(mw.rooms).not.toHaveProperty('qwerty')

            const messageToClient = mw.joinRoom('qwerty', client)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. Room \'qwerty\' does not exist.',
                }
            })
        })

        it('should gracefully handle errors thrown by Room', () => {
            const client = { playerId: 0, socket: new WebSocket('') }
            const fn = () => mw.joinRoom('asdfgh', client)
            expect(fn).not.toThrowError()
            expect(fn().data.error).toBe(true)
        })

        it('should fail to join if another client exists with the same playerId in the room', () => {
            const client = { playerId: 0, socket: new WebSocket('') }
            expect(mw.rooms['asdfgh'].clients).toHaveLength(1)
            expect(mw.rooms['asdfgh'].clients).not.toContain(client)

            mw.joinRoom('asdfgh', client)
            expect(client).not.toHaveProperty('roomId')
            expect(mw.rooms['asdfgh'].clients).toHaveLength(1)
            expect(mw.rooms['asdfgh'].clients).not.toContain(client)
        })

        it('should return an unsuccessful message if another client exists with the same playerId in the room', () => {
            const client = { playerId: 0, socket: new WebSocket('') }
            const messageToClient = mw.joinRoom('asdfgh', client)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. Client with same playerId already exists in room.'
                }
            })
        })

        it('should move the client from one room to another if it is already in one', () => {
            // Add another client so that the room still exists after one client leaves
            mw.joinRoom('asdfgh', { playerId: 1, socket: new WebSocket('') })
            expect(existingClient.roomId).toBe('asdfgh')
            expect(mw.rooms['asdfgh'].clients).toContain(existingClient)

            mw.createRoom({ playerId: 1, socket: new WebSocket('') })
            expect(mw.rooms).toHaveProperty('qwerty')

            mw.joinRoom('qwerty', existingClient)
            expect(existingClient.roomId).toBe('qwerty')
            expect(mw.rooms['asdfgh'].clients).not.toContain(existingClient)
            expect(mw.rooms['qwerty'].clients).toContain(existingClient)
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('leaveRoom()', () => {
        let mw: Multiworld
        let firstClient: Client
        let secondClient: Client

        beforeEach(() => {
            mw = new Multiworld(4)
            firstClient = {
                playerId: 0,
                socket: new WebSocket('')
            }
            secondClient = {
                playerId: 1,
                socket: new WebSocket('')
            }

            mw.createRoom(firstClient)
            mw.joinRoom('qwerty', secondClient)
        })

        it('should remove the client from a room if it is in one', () => {
            expect(mw.rooms['qwerty'].clients).toHaveLength(2)

            mw.leaveRoom('qwerty', firstClient)
            expect(mw.rooms['qwerty'].clients).toHaveLength(1)
            expect(mw.rooms['qwerty'].clients).not.toContain(firstClient)
            expect(firstClient).not.toHaveProperty('roomId')
        })

        it('should return a successful message upon leaving a room', () => {
            const messageToClient = mw.leaveRoom('qwerty', firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    message: 'Room \'qwerty\' left successfully.'
                }
            })
        })

        it('should return an unsuccessful message if no roomId is specified', () => {
            const messageToClient = mw.leaveRoom('', firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. No roomId provided.'
                }
            })
        })

        it('should not leave its current room if the id is different from what is passed', () => {
            expect(mw.rooms['qwerty'].clients).toHaveLength(2)
            expect(mw.rooms['qwerty'].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe('qwerty')

            mw.leaveRoom('asdfgh', firstClient)
            expect(mw.rooms['qwerty'].clients).toHaveLength(2)
            expect(mw.rooms['qwerty'].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe('qwerty')
        })

        it('should return an unsuccessful message if the user is in a different room than specified', () => {
            expect(mw.rooms['qwerty'].clients).toHaveLength(2)
            expect(mw.rooms['qwerty'].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe('qwerty')

            const messageToClient = mw.leaveRoom('asdfgh', firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. User is not in room \'asdfgh\'.'
                }
            })
        })

        it('should return an unsuccessful message if the user is not in a room', () => {
            mw.leaveRoom('qwerty', firstClient)
            expect(firstClient).not.toHaveProperty('roomId')

            const messageToClient = mw.leaveRoom('asdfgh', firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. User is not in a room.'
                }
            })
        })

        it('should clean up any rooms with no more users', () => {
            mw.leaveRoom('qwerty', firstClient)
            mw.leaveRoom('qwerty', secondClient)
            expect(mw.rooms).not.toHaveProperty('qwerty')
        })
    })

    describe('removeClient()', () => {
        let mw: Multiworld
        let client: Client

        beforeEach(() => {
            mw = new Multiworld(4)
            const message: Message = { type: "MULTI", action: "LOGIN", data: { playerId: 0 } }
            const socket = new WebSocket('') 
            client = (mw.authenticateClient(message, socket)).data.client as Client
            mw.createRoom(client)
        })

        it('should remove the client from a room if it is in one', () => {
            expect(mw.connectedClients).toContain(client)
            expect(mw.rooms['qwerty'].clients).toContain(client)

            mw.removeClient(client)
            expect(client).not.toHaveProperty('roomId')
            expect(mw.rooms).not.toHaveProperty('qwerty')
        })

        it('should remove the client from the list of connected clients', () => {
            expect(mw.connectedClients).toHaveLength(1)
            expect(mw.connectedClients).toContain(client)

            mw.removeClient(client)
            expect(mw.connectedClients).toHaveLength(0)
            expect(mw.connectedClients).not.toContain(client)
        })

        it('should send a successful message upon removal', () => {
            const messageToClient = mw.removeClient(client)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LOGOUT',
                data: {
                    message: 'User disconnected successfully.'
                }
            })
        })

        it('should send an unsuccessful message if the client is not in the list of connected clients', () => {
            mw.connectedClients.splice(mw.connectedClients.indexOf(client), 1)
            const messageToClient = mw.removeClient(client)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LOGOUT',
                data: {
                    error: true,
                    message: 'User not in list of connected clients.'
                }
            })
        })
    })
})