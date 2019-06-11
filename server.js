const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws, req) {
	const ip = req.connection.remoteAddress;
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		ws.send(JSON.stringify(message));
	});
	ws.send('connected');
});