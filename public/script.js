const socket = io.connect('http://localhost:3000', { 'sync disconnect on unload': false })

window.onload = () => {
    socket.on('data', data => {
        document.getElementById('message').innerText = data
    })
}