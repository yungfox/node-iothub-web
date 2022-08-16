// import modules
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io')(server)
const cors = require('cors')

// load variables from .env file
require('dotenv').config({ path: path.join(__dirname, './.env') })

// set up connection to the azure iothub device
const connectionString = process.env.AZURE_CONNECTION_STRING
const device = require('azure-iot-device').Client
const protocol = require('azure-iot-device-amqp').Amqp
const client = device.fromConnectionString(connectionString, protocol)

// callback on frontend client connection
io.on('connection', socket => {
    client.on('message', message => {
        // read payload of message incoming from iothub
        let body = message.getBytes().toString('ascii')
        console.log(`new message: ${body}`)
        // forward the message content to the frontend via websockets
        socket.emit('data', body)
        // perform message ACK
        client.complete(message)
    })
    
    // clean up connection to iothub when the frontend disconnects
    socket.on('disconnect', () => {
        console.log('client disconnected')
        client.removeAllListeners('message')
    })
    
    // open connection to iothub
    client.open()
    .then(() => console.log('connected to iothub!'))
    // close connection in case of error
    .catch(() => {
        console.log('disconnected from iothub')
        client.removeAllListeners('message')
        client.close()
    })
})

app.use(cors())

app.use(express.static(path.join(__dirname, './public')))

app.get('/', ({ res }) => {
    res.sendFile(path.join(__dirname, './public/index.html'))
})

server.listen(3000, () => console.log('app listening on port 3000'))