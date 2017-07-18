const electron = require('electron');
const libpath = require('path');
const express = require('express');
const server = express();
const del = require('del');
const fs = require('fs');
const robot = require('robotjs');
const io = require('socket.io')(server.listen(3000));
const { exec } = require('child_process');
const { app, BrowserWindow } = electron;

const CAPTURE_PATH = libpath.join(__dirname, 'capture.png');
/** @type {Electron.BrowserWindow} */
let browserWindow = null;
let cursorX = 0;
let cursorY = 0;

const create = () => {
	const { size: { width, height } } = electron.screen.getPrimaryDisplay();
	const w = new BrowserWindow({
		width,
		height,
		frame: false,
		transparent: true,
		alwaysOnTop: true
	});
	w.setIgnoreMouseEvents(true);
	w.loadURL(`file://${libpath.join(__dirname, 'dst/index.html')}`);
	w.on('closed', () => { browserWindow = null; });

	browserWindow = w;
};

app.on('ready', () => {
	create();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!browserWindow) {
		create();
	}
});

server.use('/client', express.static(libpath.join(__dirname, '../client/docs')));

server.get('/', (req, res) => {
	res.redirect('/client');
});

server.get('/capture', (req, res) => {
	exec(`screencapture ${CAPTURE_PATH}`, (err) => {
		if (err) {
			console.error(err);
			res.send(500);
		} else {
			if (fs.existsSync(CAPTURE_PATH)) {
				res.send(fs.readFileSync(CAPTURE_PATH).toString('base64'));
				del.sync(CAPTURE_PATH);
			} else {
				res.send(500);
			}
		}
	});
});

io.on('connection', (socket) => {
	socket.on('touch', ({ dx, dy }) => {
		cursorX += dx;
		cursorY += dy;
		io.emit('cursor', { x: cursorX, y: cursorY });
	});

	socket.on('absolute', ({ nx, ny }) => {
		const { size: { width, height } } = electron.screen.getPrimaryDisplay();
		const x = nx * width;
		const y = ny * height;
		cursorX = x;
		cursorY = y - 22;
		io.emit('cursor', { x: cursorX, y: cursorY });
	});

	socket.on('click', () => {
		const { x, y } = robot.getMousePos();
		robot.moveMouse(Math.floor(cursorX), Math.floor(cursorY) + 22);
		robot.mouseClick('left', false);
		robot.moveMouse(x, y);
	});

	socket.on('double-click', () => {
		const { x, y } = robot.getMousePos();
		robot.moveMouse(Math.floor(cursorX), Math.floor(cursorY) + 22);
		robot.mouseClick('left', true);
		robot.moveMouse(x, y);
	});
});
