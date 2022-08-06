import { Room, Client } from '../Room'
import { WebSocket } from 'ws'

jest.mock('ws')

describe('Room', () => {
    let defaultClient: Client

    beforeEach(() => {
        defaultClient = { playerId: 0, socket: new WebSocket('') }
    })

    describe('constructor()', () => {
        it('should create a list of connected clients', () => {
            const room = new Room([defaultClient])

            expect(room.clients).toEqual([defaultClient])
        })
    })

    describe('add()', () => {
        let room: Room

        beforeEach(() => {
            room = new Room([defaultClient])
        })

        it('should add a client to an existing room', () => {
            const client = { playerId: 1, socket: new WebSocket('') }
            room.add(client)
            expect(room.clients).toContainEqual(client)
        })

        it('should prevent the same client from joining twice', () => {
            expect(() => { room.add(defaultClient) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should prevent a client with the same id of another client in the room from joining', () => {
            expect(() => { room.add({ playerId: 0, socket: new WebSocket('') }) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should return the room\'s id', () => {
            const roomId = room.add({ playerId: 1, socket: new WebSocket('') })
            expect(roomId).toBe(room.id)
        })
    })

    describe('remove()', () => {
        let room: Room
        let secondClient: Client

        beforeEach(() => {
            secondClient = { playerId: 1, socket: new WebSocket('') }
            room = new Room([defaultClient, secondClient])
        })

        it('should remove a client from a room', () => {
            room.remove(defaultClient)
            expect(room.clients).toHaveLength(1)
            expect(room.clients).toContainEqual(secondClient)
        })

        it('should require exactly the same client for removal', () => {
            expect(() => { room.remove({ playerId: 0, socket: new WebSocket('') }) }).toThrow('Client is not in room.')
            expect(room.clients).toHaveLength(2)
            expect(room.clients).toContainEqual(defaultClient)
        })
    })
})