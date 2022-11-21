import { Room } from '../Room'
import { WebSocket } from 'ws'
import { Client } from '../Client'
import { KH2ItemMessage } from '../types/KH2ItemMessage'

// MOCKS ==========

jest.mock('ws')

// TESTS ==========

describe('Room', () => {
    let defaultClient: Client

    beforeEach(() => {
        defaultClient = new Client(0, new WebSocket(''))
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
            const client = new Client(1, new WebSocket(''))
            room.add(client)
            expect(room.clients).toContainEqual(client)
        })

        it('should prevent the same client from joining twice', () => {
            expect(() => { room.add(defaultClient) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should prevent a client with the same playerId of another client in the room from joining', () => {
            expect(() => { room.add(new Client(0, new WebSocket(''))) }).toThrowError('Client with same playerId already exists in room.')
            expect(room.clients).toHaveLength(1)
        })

        it('should return the room\'s id', () => {
            const roomId = room.add(new Client(1, new WebSocket('')))
            expect(roomId).toBe(room.id)
        })
    })

    describe('remove()', () => {
        let room: Room
        let secondClient: Client

        beforeEach(() => {
            secondClient = new Client(1, new WebSocket(''))
            room = new Room([defaultClient, secondClient])
        })

        it('should remove a client from a room', () => {
            room.remove(defaultClient)
            expect(room.clients).toHaveLength(1)
            expect(room.clients).toContainEqual(secondClient)
        })

        it('should require exactly the same client for removal', () => {
            expect(() => { room.remove(new Client(0, new WebSocket(''))) }).toThrow('Client is not in room.')
            expect(room.clients).toHaveLength(2)
            expect(room.clients).toContainEqual(defaultClient)
        })
    })

    describe('getItemInfo()', () => {
        let room: Room

        beforeEach(() => {
            room = new Room([new Client(0, new WebSocket(''))])
        })

        it('should throw an error if it has no MultiMap', () => {
            expect(() => { room.getItemInfo('a', 0 ) }).toThrowError('Room has no MultiMap!')
        })

        it('should throw an error if the MultiMap has no items at the given location for the given player', () => {
            room.setMultiMap([
                { name: 'fire', location: 'a', to: 1, from: 0 },
                { name: 'blizzard', location: 'b', to: 0, from: 1 }
            ])
            expect(() => { room.getItemInfo('b', 0 ) }).toThrowError('Player 0 should not have a dummy item at location b.')
        })

        it('should return a KH2ItemMessage with the item info from the MultiMap', () => {
            room.setMultiMap([
                { name: 'fire', location: 'a', to: 1, from: 0 },
                { name: 'blizzard', location: 'b', to: 0, from: 1 }
            ])

            const itemInfo = room.getItemInfo('a', 0)
            expect(itemInfo).toStrictEqual<KH2ItemMessage>({
                name: 'fire',
                location: 'a',
                to: 1,
                from: 0
            })

            const secondInfo = room.getItemInfo('b', 1)
            expect(secondInfo).toStrictEqual<KH2ItemMessage>({
                name: 'blizzard',
                location: 'b',
                to: 0,
                from: 1
            })
        })
    })

    describe('sendItemToPlayer()', () => {
        let room: Room
        const itemInfo = { name: 'fire', location: 'a', to: 1, from: 0 }

        beforeEach(() => {
            const sender = new Client(0, new WebSocket(''))
            room = new Room([sender])
        })

        it('should throw an error if no client with the specified playerId is in the room', () => {
            expect(() => { room.sendItem(itemInfo) }).toThrowError('No player with playerId 1 in room!')
        })

        it('should send a message to the client with the specified playerId including the item info', () => {
            const receiver = new Client(1, new WebSocket(''))
            room.add(receiver)
            expect(receiver.socket.send).not.toHaveBeenCalled()
            room.sendItem(itemInfo)
            expect(receiver.socket.send).toHaveBeenCalled()
        })
    })
})