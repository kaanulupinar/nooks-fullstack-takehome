import express = require('express');
import { Express } from 'express';
import { Server, Socket } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import cors = require('cors');
import * as bodyParser from 'body-parser';
import { VideoState, SessionStore, InMemorySessionStore } from './models'

const app: Express = express();
const httpServer: HTTPServer = createServer(app);
const io: Server = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(bodyParser.json());

httpServer.listen(8080, () => {
  console.log('listening on *:8080');
});

const sessStore = new InMemorySessionStore();

app.post('/create', (req, res) => {
  console.log('user made session with sessId ' + req.body.sessId);
  sessStore.addSession(req.body.sessId, req.body.youtubeUrl)
  res.sendStatus(201);
});

const handleJoin = (sessionStore: SessionStore, socket: Socket) => (sessionId: string) => {
  if (sessionStore.hasSession(sessionId)) {
    socket.join(sessionId);
    sessionStore.addUser(sessionId, socket.id);
    socket.emit('session joined', sessionStore.getSession(sessionId));
    console.log('user', socket.id, 'joined session', sessionId);
  } else {
    socket.emit('error', 'Session not found');
    console.log('user', socket.id, 'tried to join nonexistent session', sessionId);
  }
}

const handleStateChange = (sessionStore: SessionStore, socket: Socket) => ({ sessionId, state }: { sessionId: string; state: VideoState }) => {
  if (sessionStore.hasSession(sessionId)) {
    sessionStore.updateVideoState(sessionId, state);
    socket.to(sessionId).emit('video state change', state);
    console.log('video state changed in session', sessionId, 'to', state);
  } else {
    socket.emit('error', 'Session not found');
    console.log('user', socket.id, 'tried to change video state in nonexistent session', sessionId);
  }
}

const handleUrlChange = (sessionStore: SessionStore, socket: Socket) => ({ sessionId, url }: { sessionId: string; url: string }) => {
  if (sessionStore.hasSession(sessionId)) {
    sessionStore.updateVideoUrl(sessionId, url);
    socket.to(sessionId).emit("video url change", url)
    console.log('video url changed in session', sessionId, 'to', url);
  } else {
    socket.emit('error', 'Session not found');
    console.log('user', socket.id, 'tried to change video url in nonexistent session', sessionId);
  }
}

const handleDisconnect = (sessionStore: SessionStore, socket: Socket) => () => {
  console.log('user disconnected');
  sessionStore.deleteUser(socket.id);
}

io.on('connection', (socket: Socket) => {
  console.log('a user connected');

  socket.on('join session', handleJoin(sessStore, socket));

  socket.on('video state change', handleStateChange(sessStore, socket));

  socket.on('video url change', handleUrlChange(sessStore, socket));

  socket.on('disconnect', handleDisconnect(sessStore, socket));
});
