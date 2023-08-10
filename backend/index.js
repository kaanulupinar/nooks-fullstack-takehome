"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socket_io_1 = require("socket.io");
var http_1 = require("http");
var cors = require("cors");
var bodyParser = require("body-parser");
var models_1 = require("./models");
var app = express();
var httpServer = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
app.use(cors());
app.use(bodyParser.json());
httpServer.listen(8080, function () {
    console.log('listening on *:8080');
});
var sessStore = new models_1.InMemorySessionStore();
app.post('/create', function (req, res) {
    console.log('user made session with sessId ' + req.body.sessId);
    sessStore.addSession(req.body.sessId, req.body.youtubeUrl);
    res.sendStatus(201);
});
var handleJoin = function (sessionStore, socket) { return function (sessionId) {
    if (sessionStore.hasSession(sessionId)) {
        socket.join(sessionId);
        sessionStore.addUser(sessionId, socket.id);
        socket.emit('session joined', sessionStore.getSession(sessionId));
        console.log('user', socket.id, 'joined session', sessionId);
    }
    else {
        socket.emit('error', 'Session not found');
        console.log('user', socket.id, 'tried to join nonexistent session', sessionId);
    }
}; };
var handleStateChange = function (sessionStore, socket) { return function (_a) {
    var sessionId = _a.sessionId, state = _a.state;
    if (sessionStore.hasSession(sessionId)) {
        sessionStore.updateVideoState(sessionId, state);
        socket.to(sessionId).emit('video state change', state);
        console.log('video state changed in session', sessionId, 'to', state);
    }
    else {
        socket.emit('error', 'Session not found');
        console.log('user', socket.id, 'tried to change video state in nonexistent session', sessionId);
    }
}; };
var handleUrlChange = function (sessionStore, socket) { return function (_a) {
    var sessionId = _a.sessionId, url = _a.url;
    if (sessionStore.hasSession(sessionId)) {
        sessionStore.updateVideoUrl(sessionId, url);
        socket.to(sessionId).emit("video url change", url);
        console.log('video url changed in session', sessionId, 'to', url);
    }
    else {
        socket.emit('error', 'Session not found');
        console.log('user', socket.id, 'tried to change video url in nonexistent session', sessionId);
    }
}; };
var handleDisconnect = function (sessionStore, socket) { return function () {
    console.log('user disconnected');
    sessionStore.deleteUser(socket.id);
}; };
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('join session', handleJoin(sessStore, socket));
    socket.on('video state change', handleStateChange(sessStore, socket));
    socket.on('video url change', handleUrlChange(sessStore, socket));
    socket.on('disconnect', handleDisconnect(sessStore, socket));
});
