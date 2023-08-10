export interface VideoState {
  playing: boolean;
  time: number;
}

export interface Session {
  youtubeUrl: string;
  users: string[];
  videoState: VideoState;
}

export interface SessionStore {

  addSession(sessionId:string, youtubeUrl: string): void;

  getSession(sessionId: string): Session;

  hasSession(sessionId: string): boolean;

  addUser(sessionId: string, socketId: string): void;

  deleteUser(socketId: string): void;

  updateVideoState(sessionId: string, videoState: VideoState): void;

  updateVideoUrl(sessionId: string, url: string): void;
}

export class InMemorySessionStore implements SessionStore {

  private sessions: Record<string, Session>;

  constructor() {
    this.sessions = {};
  }

  addSession(sessionId: string, youtubeUrl: string) {
    this.sessions[sessionId] = {
      youtubeUrl,
      users: [],
      videoState: {
        playing: false,
        time: 0
      }
    }
  }

  getSession(sessionId: string) {
    return this.sessions[sessionId];
  }

  hasSession(sessionId: string) { 
    return sessionId in this.sessions;
  }

  addUser(sessionId: string, socketId: string) {
    this.sessions[sessionId].users.push(socketId)
  }

  deleteUser(socketId: string) {
    for (const sessId in this.sessions) { //not very scalable
      const session = this.sessions[sessId];
      const index = session.users.indexOf(socketId);
      if (index > -1) {
        session.users.splice(index, 1);
        if (session.users.length === 0) {
          delete this.sessions[sessId];
          console.log('session', sessId, 'deleted due to no users');
        }
      }
    }
  }

  updateVideoState(sessionId: string, videoState: VideoState) {
    this.sessions[sessionId].videoState = videoState;
  }

  updateVideoUrl(sessionId: string, url: string) {
    this.sessions[sessionId].youtubeUrl = url;
  }


}