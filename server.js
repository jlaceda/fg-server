const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let players = [];
let eventsBuffer = [];



wss.on('connection', function connection(ws, req) {
	let playerId = 0;
	if (players.length < 2) {
		players.push(true);
		playerId = players.length;
		ws.send(JSON.stringify({
			connected: true,
			playerId: playerId
		}));
	} else {
		ws.send(JSON.stringify({
			refused: true,
		}));
		return;
	}
	
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		eventsBuffer.push({
			player: playerId,
			input: JSON.parse(message).input
		});
	});
});

// enums
const DIRECTION = Object.freeze({
	"LEFT": 1, 
	"RIGHT": 2
});
const SCENE = Object.freeze({
	"FIGHT": 0,
	"MENU": 1,
	"END": 2
});
const INPUT = Object.freeze({
	"NOOP": 0,
	"LEFT": 1,
	"RIGHT": 2,
	"ATTACK": 3
});
const PLAYER_STATE = Object.freeze({
	"STANDING": 0,
	"WALKING": 1,
	"ATTACKING": 2,
	"STUN": 3
});

let WORLD = {
	1: {
		x: 50,
		y: 200,
		state: PLAYER_STATE.STANDING,
		direction: DIRECTION.RIGHT
	},
	2: {
		x: 200,
		y: 200,
		state: PLAYER_STATE.STANDING,
		direction: DIRECTION.LEFT
	},
}

/*
events should be
{
	player: 1,
	input: 1
}
*/

function processEvents (WORLD, eventsBuffer) {
	let i;
	for (i = 0; i < eventsBuffer.length; i++) {
		const event = eventsBuffer[i];
		const p = event.player;
		switch (event.input) {
			case INPUT.ATTACK:
				if (WORLD[p].state !== PLAYER_STATE.ATTACKING) {
					WORLD[p].state = PLAYER_STATE.ATTACKING;
				}
				break;
			case INPUT.RIGHT:
				WORLD[p].direction = DIRECTION.RIGHT
				WORLD[p].state = PLAYER_STATE.WALKING
				break;
			case INPUT.LEFT:
				WORLD[p].direction = DIRECTION.LEFT
				WORLD[p].state = PLAYER_STATE.WALKING
				break;
			default:
				if (WORLD[p].state === PLAYER_STATE.WALKING
					|| WORLD[p].state === PLAYER_STATE.ATTACKING) {
						WORLD[p].state = PLAYER_STATE.STANDING;
				}
				break;
		}
	}
	// remove processed inputs from eventsBuffer
	eventsBuffer.splice(0, i+1);
}

function simulateWorld (WORLD) {
	for (let i = 1; i < 3; i++) {
		if (WORLD[i].state === PLAYER_STATE.WALKING) {
			if (WORLD[i].direction === DIRECTION.LEFT) {
				WORLD[i].x = WORLD[i].x - 2.5;
			}
			if (WORLD[i].direction === DIRECTION.RIGHT) {
				WORLD[i].x = WORLD[i].x + 2.5;
			}
		}
	}
}

function broadcastWorldState (WORLD) {
	wss.clients.forEach(function each(client) {
		console.log("broadcasting WorldState:", WORLD);
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(WORLD));
		}
	});
};


// server tick
setInterval(function(){
	processEvents(WORLD, eventsBuffer);
	simulateWorld(WORLD);
	broadcastWorldState(WORLD);
}, 10);