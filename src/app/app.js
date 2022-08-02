const socket = new WebSocket('ws://localhost:3000')
const roomElem = document.querySelector('#currentRoom')

// SOCKET STUFF
socket.onopen = ({ data }) => {
    console.log('Connected to server')
}

socket.onclose = ({ data }) => {
    console.log('Connection closed')
}

socket.onmessage = ({ data }) => {
    console.log(`Response from server: ${data}`)
    if (data.type === 'ROOM') {
        roomElem.value = data.roomId
    }
}



// BUTTON STUFF
document.querySelector('#createRoom').onclick = () => {
    socket.send({ type: 'ROOM' })
}

document.querySelector('#joinRoom').onclick = () => {
    socket.send({ type: 'ROOM', roomId: document.querySelector('#newRoom').value })
}
