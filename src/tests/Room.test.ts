import { Room, Client } from '../Room'
import { WebSocket } from 'ws'

jest.mock('ws')

describe('Room', () => {
    let defaultClient: Client

    beforeEach(() => {
        defaultClient = { clientId: 'a', playerId: 0 }
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
            const client = { clientId: 'b', playerId: 1 }
            room.add(client)
            expect(room.clients).toContainEqual(client)
        })

        it('should prevent the same client from joining twice', () => {
            expect(() => { room.add(defaultClient) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should prevent a client with the same playerId of another client in the room from joining', () => {
            expect(() => { room.add({ clientId: 'b', playerId: 0 }) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should return the room\'s id', () => {
            const roomId = room.add({ clientId: 'b', playerId: 1 })
            expect(roomId).toBe(room.id)
        })
    })

    describe('remove()', () => {
        let room: Room
        let secondClient: Client

        beforeEach(() => {
            secondClient = { clientId: 'b', playerId: 1 }
            room = new Room([defaultClient, secondClient])
        })

        it('should remove a client from a room', () => {
            room.remove(defaultClient)
            expect(room.clients).toHaveLength(1)
            expect(room.clients).toContainEqual(secondClient)
        })

        it('should require exactly the same client for removal', () => {
            expect(() => { room.remove({ clientId: 'c', playerId: 0 }) }).toThrow('Client is not in room.')
            expect(room.clients).toHaveLength(2)
            expect(room.clients).toContainEqual(defaultClient)
        })
    })
})