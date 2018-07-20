const express = require('express');
const fs = require('fs');
let app = express();
var http = require('http').Server(app);
var https = require('https')
let port = 3000;
let host = '192.168.1.248';
const path = require('path');
const rootPath = path.normalize(__dirname + '/');
app.use(express.static(rootPath + '/dist'));

app.use((req, res, next)=>{
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.set('views', rootPath + 'dist');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const options = {
	key: fs.readFileSync('./cert/server-key.pem'),
	cert: fs.readFileSync('./cert/server-cert.pem')
}

const httpsServer = https.createServer(options, app)

const io = require('socket.io')(httpsServer);

io.on('connection', function(socket){
	console.log('a user connected');

	socket.on('message', function(message) {
	    log('Client said: ', message);
	    // for a real app, would be room-only (not broadcast)
	    socket.broadcast.emit('message', message);
	})
});

httpsServer.listen(port, host, function(){
	console.log(`Server Running at: https://${host}:${port}`);
});