// const socket = new WebSocket('ws://https://1cfd5925-d99a-4fb4-9f59-abfbbef2330e.k8s.ondigitalocean.com')
const socket = new WebSocket('ws://localhost:3000')
const $ = {
    currentRoomInput: document.querySelector('#currentRoom'),
    newRoomInput: document.querySelector('#newRoom'),
    playerIdInput: document.querySelector('#playerId'),
    itemNameInput: document.querySelector('#itemName'),
    itemLocationInput: document.querySelector('#itemLocation'),
    connectionButton: document.querySelector('#authorize'),
    createRoomButton: document.querySelector('#createRoom'),
    joinRoomButton: document.querySelector('#joinRoom'),
    multiMapButton: document.querySelector('#loadMultiMap'),
    sendItemButton: document.querySelector('#sendItem')
}
let client
let isLoggedIn = false

// SOCKET STUFF
socket.onopen = ({ data }) => {
    console.log('Connected to server')
}

socket.onclose = ({ data }) => {
    console.log('Connection closed')
}

socket.onmessage = ({ data }) => {
    console.log('Response from server:', data)
    const message = JSON.parse(data)

    if (message.data.error) {
        console.error(message.data.message)
        return
    }

    if (message.action === 'LOGOUT') {
        $.playerIdInput.disabled = false
        $.connectionButton.innerHTML = 'Connect'
        $.createRoomButton.disabled = true
        $.joinRoomButton.disabled = true
        $.newRoomInput.disabled = true
        $.multiMapButton.disabled = true
        $.itemNameInput.disabled = true
        $.itemLocationInput.disabled = true
        $.sendItemButton.disabled = true
    }

    if (message.data.client) {
        client = message.data.client

        // Don't need this and it just adds spam to the debug logs
        if (client.socket) {
            delete client.socket
        }

        if (client.roomId) {
            $.currentRoomInput.value = client.roomId
        } else {
            $.currentRoomInput.value = 'NONE'
        }

        if (message.action === 'LOGIN') {
            $.playerIdInput.disabled = true
            $.connectionButton.innerHTML = 'Disconnect'
            $.createRoomButton.disabled = false
            $.joinRoomButton.disabled = false
            $.newRoomInput.disabled = false
        }

        if (message.action === 'CREATE_ROOM' || message.action === 'JOIN_ROOM') {
            $.createRoomButton.innerHTML = 'Leave room'
            $.multiMapButton.disabled = false
            $.itemNameInput.disabled = false
            $.itemLocationInput.disabled = false
            $.sendItemButton.disabled = false
        }

        if (message.action === 'LEAVE_ROOM') {
            $.createRoomButton.innerHTML = 'Create room'
            $.multiMapButton.disabled = true
            $.itemNameInput.disabled = true
            $.itemLocationInput.disabled = true
            $.sendItemButton.disabled = true
        }
    }
}



// BUTTON STUFF
$.connectionButton.onclick = (ev) => {
    const data = {
        type: 'MULTI',
        action: 'LOGIN',
        data: {
            playerId: parseInt($.playerIdInput.value),
        }
    }

    if (ev.target.innerHTML === 'Disconnect') {
        data.action = 'LOGOUT'
        data.data.client = client
        delete data.data.playerId
    }
    sendToServer(data)
}

$.createRoomButton.onclick = (ev) => {
    const data = {
        type: 'MULTI',
        action: 'CREATE_ROOM',
        data: { client }
    }

    if (ev.target.innerHTML === 'Leave room') {
        data.action = 'LEAVE_ROOM'
        data.data.client = client
    }
    sendToServer(data)
}

$.joinRoomButton.onclick = () => {
    const data = {
        type: 'MULTI',
        action: 'JOIN_ROOM',
        data: {
            roomId: $.newRoomInput.value,
            client
        }
    }
    sendToServer(data)
}

$.multiMapButton.onclick = () => {
    const multiMap = [
        { "name": "fire", "location": "a", "to": 1, "from": 0 },
        { "name": "blizzard", "location": "b", "to": 0, "from": 1 }
    ]

    const data = {
        type: 'MULTI',
        action: 'LOAD_MULTI_MAP',
        data: {
            multiMap,
            client
        }
    }
    sendToServer(data)
}

$.sendItemButton.onclick = () => {
    const data = {
        type: 'MULTI',
        action: 'ITEM',
        data: {
            item: {
                name: $.itemNameInput.value,
                location: $.itemLocationInput.value,
                from: client.playerId
            },
            client
        }
    }
    sendToServer(data)
}


function sendToServer(data) {
    console.log(`Sent to server: ${JSON.stringify(data)}`)
    socket.send(JSON.stringify(data))
}