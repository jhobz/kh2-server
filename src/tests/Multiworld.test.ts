import { Multiworld, Room } from '../Multiworld'
import WebSocket from 'ws'

describe('Multiworld', () => {
    describe('Room', () => {
        it('should create a list of connected clients', () => {
            const room = new Room([{ playerId: 0 }])

            expect(room.clients).toEqual([{ playerId: 0 }])
        })
    })
})