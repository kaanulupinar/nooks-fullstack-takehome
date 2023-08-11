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

app.get('/sessions/:sessionId', (req, res) => { //get current video state for when a user clicks "join session"
  if (sessStore.hasSession(req.params.sessionId)) {
    const session = sessStore.getSession(req.params.sessionId)
    let vidState: VideoState;
    if (session.videoState.playing) { //video is currently playing, have to account for time since last update
      const secondsSinceUpdate = (Date.now() - session.lastUpdated)/1000
      vidState = {
        playing: true,
        time: session.videoState.time + secondsSinceUpdate
      };
    } else {
      vidState = session.videoState
    }
    res.json(vidState);
  } else {
    res.status(404).json({ error: "Session not found" });
  }
})

const handleJoin = (sessionStore: SessionStore, socket: Socket) => (sessionId: string) => {
  if (sessionStore.hasSession(sessionId)) {
    socket.join(sessionId);
    sessionStore.addUser(sessionId, socket.id);
    socket.emit('session joined', { youtubeUrl: sessionStore.getSession(sessionId).youtubeUrl });
    console.log('user', socket.id, 'joined session', sessionId);
  } else {
    socket.emit('error', 'Session not found');
    console.log('user', socket.id, 'tried to join nonexistent session', sessionId); //should never happen
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
