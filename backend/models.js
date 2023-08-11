"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionStore = void 0;
var InMemorySessionStore = /** @class */ (function () {
    function InMemorySessionStore() {
        this.sessions = {};
    }
    InMemorySessionStore.prototype.addSession = function (sessionId, youtubeUrl) {
        this.sessions[sessionId] = {
            youtubeUrl: youtubeUrl,
            users: [],
            videoState: {
                playing: false,
                time: 0,
            },
            lastUpdated: Date.now()
        };
    };
    InMemorySessionStore.prototype.getSession = function (sessionId) {
        return this.sessions[sessionId];
    };
    InMemorySessionStore.prototype.hasSession = function (sessionId) {
        return sessionId in this.sessions;
    };
    InMemorySessionStore.prototype.addUser = function (sessionId, socketId) {
        this.sessions[sessionId].users.push(socketId);
    };
    InMemorySessionStore.prototype.deleteUser = function (socketId) {
        for (var sessId in this.sessions) { //not very scalable
            var session = this.sessions[sessId];
            var index = session.users.indexOf(socketId);
            if (index > -1) {
                session.users.splice(index, 1);
                if (session.users.length === 0) {
                    delete this.sessions[sessId];
                    console.log('session', sessId, 'deleted due to no users');
                }
            }
        }
    };
    InMemorySessionStore.prototype.updateVideoState = function (sessionId, videoState) {
        this.sessions[sessionId].videoState = videoState;
        this.sessions[sessionId].lastUpdated = Date.now();
    };
    InMemorySessionStore.prototype.updateVideoUrl = function (sessionId, url) {
        this.sessions[sessionId].youtubeUrl = url;
        this.sessions[sessionId].videoState = {
            playing: false,
            time: 0
        };
    };
    return InMemorySessionStore;
}());
exports.InMemorySessionStore = InMemorySessionStore;
