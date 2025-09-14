# Examples

This document provides several practical examples of how to use GlovesLink in various scenarios.

## Basic Chat Application

### Server

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link/server';
import { FalconFrame } from '@wxn0brp/falcon-frame';

// Create HTTP server with FalconFrame
const app = new FalconFrame();
const server = = app.listen(3000, true);

// Initialize GlovesLink
const glovesLink = new GlovesLinkServer({
    server,
    logs: true
});
glovesLink.falconFrame(app); // Add FalconFrame routes to client and error info

glovesLink.onConnect((socket) => {
    console.log('User connected:', socket.id);
    
    // Handle user joining a chat room
    socket.on('joinRoom', (roomName) => {
        socket.joinRoom(roomName);
        // Notify others in the room
        glovesLink.broadcastRoom(roomName, 'userJoined', {
            userId: socket.id,
            message: `${socket.id} joined the room`
        });
    });
    
    // Handle sending messages
    socket.on('sendMessage', (data) => {
        const { roomName, message } = data;
        // Broadcast to all in room except sender
        glovesLink.broadcastRoom(roomName, 'message', {
            userId: socket.id,
            message: message
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
```

### Client

```typescript
import GlovesLinkClient from '@wxn0brp/gloves-link/client';

// Connect to server
const client = new GlovesLinkClient('ws://localhost:3000', {
    reConnect: true,
    logs: true
});

// Join a room after connecting
client.on('connect', () => {
    client.emit('joinRoom', 'general');
});

// Handle incoming messages
client.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.userId}: ${data.message}`;
    document.getElementById('messages').appendChild(messageElement);
});

// Handle user join notifications
client.on('userJoined', (data) => {
    const notificationElement = document.createElement('div');
    notificationElement.textContent = data.message;
    notificationElement.className = 'notification';
    document.getElementById('messages').appendChild(notificationElement);
});

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    client.emit('sendMessage', {
        roomName: 'general',
        message: messageInput.value
    });
    messageInput.value = '';
}
```

## Real-time Game Lobby

### Server

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link/server';
import http from 'http';

const server = http.createServer();
server.listen(3000);

const glovesLink = new GlovesLinkServer({
    server,
    logs: true
});

// Store game lobbies
const lobbies = new Map();

glovesLink.onConnect((socket) => {
    console.log('Player connected:', socket.id);
    
    // Create a new game lobby
    socket.on('createLobby', (data) => {
        const { lobbyName, maxPlayers } = data;
        const lobbyId = `${lobbyName}-${Date.now()}`;
        
        // Create lobby data
        const lobby = {
            id: lobbyId,
            name: lobbyName,
            maxPlayers: maxPlayers,
            players: [socket.id],
            host: socket.id,
            status: 'waiting' // waiting, playing, finished
        };
        
        lobbies.set(lobbyId, lobby);
        socket.joinRoom(lobbyId);
        
        // Send lobby info back to creator
        socket.emit('lobbyCreated', lobby);
        
        // Broadcast to lobby browser
        glovesLink.broadcast('lobbyListUpdated', {
            action: 'created',
            lobby: lobby
        });
    });
    
    // Join an existing lobby
    socket.on('joinLobby', (lobbyId) => {
        const lobby = lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }
        
        if (lobby.players.length >= lobby.maxPlayers) {
            socket.emit('error', { message: 'Lobby is full' });
            return;
        }
        
        lobby.players.push(socket.id);
        socket.joinRoom(lobbyId);
        
        // Notify lobby members
        glovesLink.broadcastRoom(lobbyId, 'playerJoined', {
            playerId: socket.id,
            playerName: `Player-${socket.id.substring(0, 6)}`
        });
        
        // Send lobby info to joiner
        socket.emit('lobbyJoined', lobby);
        
        // Update lobby browser
        glovesLink.broadcast('lobbyListUpdated', {
            action: 'updated',
            lobby: lobby
        });
    });
    
    // Start the game
    socket.on('startGame', (lobbyId) => {
        const lobby = lobbies.get(lobbyId);
        if (!lobby) return;
        
        if (lobby.host !== socket.id) {
            socket.emit('error', { message: 'Only host can start the game' });
            return;
        }
        
        lobby.status = 'playing';
        
        // Notify all players
        glovesLink.broadcastRoom(lobbyId, 'gameStarted', {
            // Game initialization data
        });
    });
    
    // Handle game actions
    socket.on('gameAction', (data) => {
        const { lobbyId, action, payload } = data;
        // Process game action and broadcast to others
        glovesLink.broadcastRoom(lobbyId, 'gameUpdate', {
            playerId: socket.id,
            action: action,
            payload: payload
        });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        // Remove player from any lobbies they're in
        for (const [lobbyId, lobby] of lobbies.entries()) {
            const playerIndex = lobby.players.indexOf(socket.id);
            if (playerIndex > -1) {
                lobby.players.splice(playerIndex, 1);
                
                // If lobby is now empty, remove it
                if (lobby.players.length === 0) {
                    lobbies.delete(lobbyId);
                    glovesLink.broadcast('lobbyListUpdated', {
                        action: 'deleted',
                        lobbyId: lobbyId
                    });
                } else {
                    // Notify remaining players
                    glovesLink.broadcastRoom(lobbyId, 'playerLeft', {
                        playerId: socket.id
                    });
                    
                    // If host left, assign new host
                    if (lobby.host === socket.id && lobby.players.length > 0) {
                        lobby.host = lobby.players[0];
                        glovesLink.broadcastRoom(lobbyId, 'newHost', {
                            playerId: lobby.host
                        });
                    }
                    
                    // Update lobby browser
                    glovesLink.broadcast('lobbyListUpdated', {
                        action: 'updated',
                        lobby: lobby
                    });
                }
                break;
            }
        }
    });
});
```

### Client

```typescript
import GlovesLinkClient from '@wxn0brp/gloves-link/client';

class GameLobbyClient {
    constructor() {
        this.client = new GlovesLinkClient('ws://localhost:3000', {
            reConnect: true,
            logs: true
        });
        this.currentLobby = null;
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('Connected to game server');
            this.refreshLobbyList();
        });
        
        this.client.on('lobbyListUpdated', (data) => {
            this.updateLobbyListUI(data);
        });
        
        this.client.on('lobbyCreated', (lobby) => {
            this.currentLobby = lobby;
            this.showLobbyScreen(lobby);
        });
        
        this.client.on('lobbyJoined', (lobby) => {
            this.currentLobby = lobby;
            this.showLobbyScreen(lobby);
        });
        
        this.client.on('playerJoined', (data) => {
            this.addPlayerToLobby(data.playerId);
        });
        
        this.client.on('playerLeft', (data) => {
            this.removePlayerFromLobby(data.playerId);
        });
        
        this.client.on('gameStarted', (data) => {
            this.startGame(data);
        });
        
        this.client.on('gameUpdate', (data) => {
            this.handleGameUpdate(data);
        });
    }
    
    createLobby(name, maxPlayers) {
        this.client.emit('createLobby', {
            lobbyName: name,
            maxPlayers: maxPlayers
        });
    }
    
    joinLobby(lobbyId) {
        this.client.emit('joinLobby', lobbyId);
    }
    
    startGame() {
        if (this.currentLobby && this.currentLobby.host === this.client.id) {
            this.client.emit('startGame', this.currentLobby.id);
        }
    }
    
    sendGameAction(action, payload) {
        this.client.emit('gameAction', {
            lobbyId: this.currentLobby.id,
            action: action,
            payload: payload
        });
    }
    
    refreshLobbyList() {
        // In a real implementation, you might have a separate API call
        // or the server could broadcast lobby lists periodically
    }
}

// Initialize the client
const gameClient = new GameLobbyClient();
```

## Authentication Example

### Server

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link/server';
import http from 'http';

// Simple user database (in practice, use a real database)
const users = new Map([
    ['user1', { id: 'user1', token: 'token1', name: 'Alice' }],
    ['user2', { id: 'user2', token: 'token2', name: 'Bob' }]
]);

const server = http.createServer();
server.listen(3000);

const glovesLink = new GlovesLinkServer({
    server,
    logs: true,
    authFn: async ({ headers, url, token }) => {
        // Check if token is valid
        for (const [userId, user] of users.entries()) {
            if (user.token === token) {
                // Attach user info to the socket for later use
                // This would require modifying the GLSocket class or using a session store
                return true;
            }
        }
        return false;
    }
});

// Store user info by socket ID
const socketUsers = new Map();

glovesLink.onConnect((socket) => {
    // In a real implementation, you'd retrieve user info from the auth process
    // For this example, we'll simulate it
    const token = new URL(socket.request.url, 'http://localhost').searchParams.get('token');
    let user = null;
    for (const [userId, userData] of users.entries()) {
        if (userData.token === token) {
            user = userData;
            break;
        }
    }
    
    if (user) {
        socketUsers.set(socket.id, user);
        console.log(`Authenticated user ${user.name} connected with socket ${socket.id}`);
    }
    
    // Handle events with user context
    socket.on('sendMessage', (data) => {
        const user = socketUsers.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'User not authenticated' });
            return;
        }
        
        // Broadcast with user info
        glovesLink.broadcast('message', {
            userId: user.id,
            userName: user.name,
            message: data.message,
            timestamp: Date.now()
        });
    });
    
    socket.on('disconnect', () => {
        socketUsers.delete(socket.id);
        console.log(`Socket ${socket.id} disconnected`);
    });
});
```

### Client

```javascript
import GlovesLinkClient from '@wxn0brp/gloves-link/client';

// In a real app, you'd get this token from a login process
const USER_TOKEN = 'token1'; // Alice's token

const client = new GlovesLinkClient(`ws://localhost:3000?token=${USER_TOKEN}`, {
    reConnect: true,
    logs: true
});

client.on('connect', () => {
    console.log('Connected with authentication');
});

client.on('unauthorized', () => {
    console.log('Authentication failed');
    // Redirect to login page or show error
});

client.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${data.userName}:</strong> ${data.message}`;
    document.getElementById('chat').appendChild(messageElement);
});

function sendMessage() {
    const input = document.getElementById('messageInput');
    client.emit('sendMessage', {
        message: input.value
    });
    input.value = '';
}
```

## Real-time Dashboard

### Server

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link/server';
import http from 'http';

const server = http.createServer();
server.listen(3000);

const glovesLink = new GlovesLinkServer({
    server,
    logs: true
});

// Simulate real-time data
let metrics = {
    usersOnline: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    requestsPerSecond: 0
};

// Update metrics periodically
setInterval(() => {
    metrics.usersOnline = Math.floor(Math.random() * 1000) + 500;
    metrics.cpuUsage = Math.random() * 100;
    metrics.memoryUsage = Math.random() * 100;
    metrics.requestsPerSecond = Math.floor(Math.random() * 1000);
    
    // Broadcast updated metrics to dashboard room
    glovesLink.broadcastRoom('dashboard', 'metricsUpdate', metrics);
}, 5000);

glovesLink.onConnect((socket) => {
    console.log('Dashboard client connected:', socket.id);
    
    // Add client to dashboard room
    socket.joinRoom('dashboard');
    
    // Send initial metrics
    socket.emit('metricsUpdate', metrics);
    
    // Handle specific metric requests
    socket.on('requestMetricsHistory', (data) => {
        // In a real app, you'd retrieve historical data from a database
        const history = generateMetricsHistory(data.hours);
        socket.emit('metricsHistory', history);
    });
});

function generateMetricsHistory(hours) {
    const history = [];
    const now = Date.now();
    for (let i = hours - 1; i >= 0; i--) {
        const timestamp = now - (i * 3600000); // 1 hour intervals
        history.push({
            timestamp: timestamp,
            usersOnline: Math.floor(Math.random() * 1000) + 500,
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            requestsPerSecond: Math.floor(Math.random() * 1000)
        });
    }
    return history;
}
```

### Client

```javascript
import GlovesLinkClient from '@wxn0brp/gloves-link/client';

class DashboardClient {
    constructor() {
        this.client = new GlovesLinkClient('ws://localhost:3000', {
            reConnect: true,
            logs: true
        });
        this.metricsHistory = [];
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.client.on('connect', () => {
            console.log('Connected to dashboard server');
            this.requestMetricsHistory(24); // Get 24 hours of history
        });
        
        this.client.on('metricsUpdate', (metrics) => {
            this.updateMetricsDisplay(metrics);
            this.addToMetricsHistory(metrics);
        });
        
        this.client.on('metricsHistory', (history) => {
            this.metricsHistory = history;
            this.renderCharts();
        });
    }
    
    updateMetricsDisplay(metrics) {
        document.getElementById('usersOnline').textContent = metrics.usersOnline;
        document.getElementById('cpuUsage').textContent = metrics.cpuUsage.toFixed(2) + '%';
        document.getElementById('memoryUsage').textContent = metrics.memoryUsage.toFixed(2) + '%';
        document.getElementById('requestsPerSecond').textContent = metrics.requestsPerSecond;
        
        // Update progress bars or charts
        this.updateProgressBar('cpuUsageBar', metrics.cpuUsage);
        this.updateProgressBar('memoryUsageBar', metrics.memoryUsage);
    }
    
    updateProgressBar(elementId, value) {
        const bar = document.getElementById(elementId);
        bar.style.width = value + '%';
        bar.className = value > 80 ? 'progress-bar bg-danger' : 
                        value > 60 ? 'progress-bar bg-warning' : 
                        'progress-bar bg-success';
    }
    
    addToMetricsHistory(metrics) {
        this.metricsHistory.push({
            timestamp: Date.now(),
            ...metrics
        });
        
        // Keep only last 100 entries
        if (this.metricsHistory.length > 100) {
            this.metricsHistory.shift();
        }
        
        this.renderCharts();
    }
    
    requestMetricsHistory(hours) {
        this.client.emit('requestMetricsHistory', { hours: hours });
    }
    
    renderCharts() {
        // In a real implementation, you'd use a charting library like Chart.js
        // This is just a placeholder for the concept
        console.log('Rendering charts with', this.metricsHistory.length, 'data points');
    }
}

// Initialize dashboard
const dashboard = new DashboardClient();
```