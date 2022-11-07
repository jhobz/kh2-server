// import WebSocket from 'ws'
import { Multiworld } from '../Multiworld'
import { Room, Client } from '../Room'
import { Message, MessageData } from '../index'
// import { customAlphabet } from 'nanoid'

// MOCKS ==========
// jest.mock('ws')
// jest.mock('nanoid', () => {
//     // Ok, obviously this is gross as fuck. But jest is really dumb and doesn't actually
//     // clear mocks in modules when you use .clearAllMocks or .mockClear. IT DOES RESET THEM
//     // IF YOU USE RESET, but it won't clear. It's extremely frustrating, but this was legitimately
//     // the best solution here.
//     const mockFn = jest.fn(() => 'qwerty')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//         .mockImplementationOnce(() => 'asdfgh')
//     return {
//         __esModule: true,
//         customAlphabet: jest.fn(() => {
//             return mockFn
//         })
//     }
// })

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
        // let socket: WebSocket

        beforeEach(() => {
            mw = new Multiworld(4)
            message = { type: "MULTI", action: "LOGIN", data: { playerId: 0 } }
            // socket = new WebSocket('') 
        })

        it('should require a playerId', () => {
            delete message.data.playerId
            expect(() => mw.authenticateClient(message)).toThrow('Could not authenticate client. A playerId is required.')
        })

        it('should require playerId to be a number', () => {
            message.data.playerId = 'string' as any
            expect(() => mw.authenticateClient(message)).toThrow('Could not authenticate client. The \'playerId\' field is not a number.')
        })

        it('should assign a clientId to the client', () => {
            mw.authenticateClient(message)
            expect(mw.connectedClients[0]).toHaveProperty('clientId')
            expect(mw.connectedClients[0].clientId).not.toEqual('')
        })

        it('should store the client in the list of connected clients', () => {
            expect(mw.connectedClients).toHaveLength(0)
            const response = mw.authenticateClient(message)
            expect(mw.connectedClients).toHaveLength(1)
            expect(mw.connectedClients).toContainEqual({
                clientId: response.data.client?.clientId,
                playerId: message.data.playerId
            })
        })

        it('should return a message on success', () => {
            const messageToClient = mw.authenticateClient(message)
            expect(messageToClient).toHaveProperty('type')
            expect(messageToClient.type).toEqual('MULTI')
            expect(messageToClient).toHaveProperty('action')
            expect(messageToClient.action).toEqual('LOGIN')
            expect(messageToClient).toHaveProperty('data')
            expect(messageToClient.data).toHaveProperty('message')
            expect(messageToClient.data.message).toContain<string>('success')
            expect(messageToClient.data).toHaveProperty('client')
            expect(messageToClient.data.client).toHaveProperty('clientId')
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('createRoom()', () => {
        let mw: Multiworld
        let client: Client

        beforeEach(() => {
            mw = new Multiworld(4)
            client = {
                clientId: 'a',
                playerId: 0
            }
        })

        it('should create a new Room and keep track of its id', () => {
            mw.createRoom(client) 

            expect(Object.keys(mw.rooms)).toHaveLength(1)
            const roomId = Object.keys(mw.rooms)[0]
            expect(typeof roomId).toEqual('string')
            expect(roomId).toHaveLength(6)
            expect(mw.rooms[roomId]).toBeInstanceOf(Room)
            expect(mw.rooms[roomId].clients).toContain(client)
        })

        it('should add the roomId to the client object', () => {
            expect(client).not.toHaveProperty('roomId')
            mw.createRoom(client)
            expect(client).toHaveProperty('roomId')
            expect(client.roomId).toHaveLength(6)
        })

        it('should return a successful message to the client upon successful creation', () => {
            const messageToClient = mw.createRoom(client)

            expect(messageToClient).toHaveProperty('type')
            expect(messageToClient.type).toEqual('MULTI')
            expect(messageToClient).toHaveProperty('action')
            expect(messageToClient.action).toEqual('CREATE_ROOM')
            expect(messageToClient).toHaveProperty('data')
            expect(messageToClient.data).toHaveProperty('message')
            expect(messageToClient.data.message).toContain<string>('success')
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('joinRoom()', () => {
        let mw: Multiworld
        let existingClient: Client
        let roomId: string

        beforeEach(() => {
            mw = new Multiworld(4)
            existingClient = {
                clientId: 'a',
                playerId: 0
            }

            const response = mw.createRoom(existingClient)
            roomId = response.data.roomId as string
        })

        it('should place the client in a matching room', () => {
            const client = { clientId: 'b', playerId: 1 }
            expect(mw.rooms[roomId].clients).toHaveLength(1)
            expect(mw.rooms[roomId].clients).not.toContain(client)

            mw.joinRoom(roomId, client)

            expect(mw.rooms[roomId].clients).toHaveLength(2)
            expect(mw.rooms[roomId].clients).toContain(client)
        })

        it('should return a successful message to the client', () => {
            const client = { clientId: 'b', playerId: 1 }
            const messageToClient = mw.joinRoom(roomId, client)

            expect(messageToClient).toHaveProperty('type')
            expect(messageToClient.type).toEqual('MULTI')
            expect(messageToClient).toHaveProperty('action')
            expect(messageToClient.action).toEqual('JOIN_ROOM')
            expect(messageToClient).toHaveProperty('data')
            expect(messageToClient.data).toHaveProperty('message')
            expect(messageToClient.data.message).toContain<string>('success')
        })

        it('should return an unsuccessful message if there is no roomId', () => {
            const client = { clientId: 'b', playerId: 1 }
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
            const client = { clientId: 'b', playerId: 1 }
            expect(mw.rooms).not.toHaveProperty('asdf')

            mw.joinRoom('asdf', client)
            expect(client).not.toHaveProperty('roomId')
            expect(Object.keys(mw.rooms)).toHaveLength(1)
            expect(mw.rooms).not.toHaveProperty('asdf')
        })

        it('should return an unsuccessful message if the room doesn\'t exist', () => {
            const client = { clientId: 'b', playerId: 1 }
            expect(mw.rooms).not.toHaveProperty('asdf')

            const messageToClient = mw.joinRoom('asdf', client)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'JOIN_ROOM',
                data: {
                    error: true,
                    message: 'Unable to join room. Room \'asdf\' does not exist.',
                }
            })
        })

        it('should gracefully handle errors thrown by Room', () => {
            const client = { clientId: 'b', playerId: 0 }
            const fn = () => mw.joinRoom(roomId, client)
            expect(fn).not.toThrowError()
            expect(fn().data.error).toBe(true)
        })

        it('should fail to join if another client exists with the same playerId in the room', () => {
            const client = { clientId: 'b', playerId: 0 }
            expect(mw.rooms[roomId].clients).toHaveLength(1)
            expect(mw.rooms[roomId].clients).not.toContain(client)

            mw.joinRoom(roomId, client)
            expect(client).not.toHaveProperty('roomId')
            expect(mw.rooms[roomId].clients).toHaveLength(1)
            expect(mw.rooms[roomId].clients).not.toContain(client)
        })

        it('should return an unsuccessful message if another client exists with the same playerId in the room', () => {
            const client = { clientId: 'b', playerId: 0 }
            const messageToClient = mw.joinRoom(roomId, client)
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
            mw.joinRoom(roomId, { clientId: 'b', playerId: 1 })

            expect(existingClient.roomId).toBe(roomId)
            expect(mw.rooms[roomId].clients).toContain(existingClient)

            const response = mw.createRoom({ clientId: 'c', playerId: 1 })
            const secondRoomId = response.data.roomId as string

            mw.joinRoom(secondRoomId, existingClient)
            expect(existingClient.roomId).toBe(secondRoomId)
            expect(mw.rooms[roomId].clients).not.toContain(existingClient)
            expect(mw.rooms[secondRoomId].clients).toContain(existingClient)
        })

        it.todo('should not allow more clients than the maximum number')
    })

    describe('leaveRoom()', () => {
        let mw: Multiworld
        let firstClient: Client
        let secondClient: Client
        let roomId: string

        beforeEach(() => {
            mw = new Multiworld(4)
            firstClient = {
                clientId: 'a',
                playerId: 0
            }
            secondClient = {
                clientId: 'b',
                playerId: 1
            }

            const response = mw.createRoom(firstClient)
            roomId = response.data.roomId as string
            mw.joinRoom(roomId, secondClient)
        })

        it('should remove the client from a room if it is in one', () => {
            expect(mw.rooms[roomId].clients).toHaveLength(2)

            mw.leaveRoom(roomId, firstClient)
            expect(mw.rooms[roomId].clients).toHaveLength(1)
            expect(mw.rooms[roomId].clients).not.toContain(firstClient)
            expect(firstClient).not.toHaveProperty('roomId')
        })

        it('should return a successful message upon leaving a room', () => {
            const messageToClient = mw.leaveRoom(roomId, firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    message: `Room '${roomId}' left successfully.`,
                    client: firstClient
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
            expect(mw.rooms[roomId].clients).toHaveLength(2)
            expect(mw.rooms[roomId].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe(roomId)

            mw.leaveRoom('asdf', firstClient)
            expect(mw.rooms[roomId].clients).toHaveLength(2)
            expect(mw.rooms[roomId].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe(roomId)
        })

        it('should return an unsuccessful message if the user is in a different room than specified', () => {
            expect(mw.rooms[roomId].clients).toHaveLength(2)
            expect(mw.rooms[roomId].clients).toContain(firstClient)
            expect(firstClient.roomId).toBe(roomId)

            const messageToClient = mw.leaveRoom('asdf', firstClient)
            expect(messageToClient).toStrictEqual<Message>({
                type: 'MULTI',
                action: 'LEAVE_ROOM',
                data: {
                    error: true,
                    message: 'Unable to leave room. User is not in room \'asdf\'.'
                }
            })
        })

        it('should return an unsuccessful message if the user is not in a room', () => {
            mw.leaveRoom(roomId, firstClient)
            expect(firstClient).not.toHaveProperty('roomId')

            const messageToClient = mw.leaveRoom('asdf', firstClient)
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
            mw.leaveRoom(roomId, firstClient)
            mw.leaveRoom(roomId, secondClient)
            expect(mw.rooms).not.toHaveProperty(roomId)
        })
    })

    describe('removeClient()', () => {
        let mw: Multiworld
        let client: Client
        let roomId: string

        beforeEach(() => {
            mw = new Multiworld(4)
            const message: Message = { type: "MULTI", action: "LOGIN", data: { playerId: 0 } }
            client = (mw.authenticateClient(message)).data.client as Client
            const response = mw.createRoom(client)
            roomId = response.data.roomId as string
        })

        it('should remove the client from a room if it is in one', () => {
            expect(mw.connectedClients).toContain(client)
            expect(mw.rooms[roomId].clients).toContain(client)

            mw.removeClient(client)
            expect(client).not.toHaveProperty('roomId')
            expect(mw.rooms).not.toHaveProperty(roomId)
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