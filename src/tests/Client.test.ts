import { Client } from '../Client'
import { WebSocket } from 'ws'

// MOCKS ==========

jest.mock('ws')

// TESTS ==========

describe('Client', () => {
    describe('constructor()', () => {
        it('should assign a clientId to the client', () => {
            const client = new Client(0, new WebSocket(''))
            expect(client).toHaveProperty('clientId')
            expect(client.clientId).not.toEqual('')
        })
    })
})