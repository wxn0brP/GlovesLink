# Server API

The server-side API for GlovesLink provides functionality for managing WebSocket connections, handling events, and organizing clients into rooms.

## Class: GlovesLinkServer

### Constructor

```typescript
new GlovesLinkServer(opts: Partial<Server_Opts>)
```

**Parameters:**

- `opts` (Partial<Server_Opts>): Configuration options

**Options:**

```typescript
{
    server: http.Server;                            // HTTP server instance (required)
    logs?: boolean;                                 // Enable or disable logging (default: false)
    authFn?: (data: Server_Auth_Opts) => boolean | Promise<boolean>; // Authentication function (default: () => true)
}
```

**Server_Auth_Opts:**
```typescript
{
    headers: IncomingHttpHeaders;  // HTTP headers from the connection request
    url: URL;                      // Parsed URL from the connection request
    token?: string;                // Authentication token from URL parameters
}
```

### Properties

- `wss`: WebSocketServer - The underlying WebSocket server
- `logs`: boolean - Whether logging is enabled
- `opts`: Server_Opts - Configuration options
- `rooms`: Rooms - Map of room instances
- `globalRoom`: Room - The global room containing all connected sockets

### Methods

#### `onConnect(handler)`

Handle new client connections.

```typescript
server.onConnect(handler: (socket: GLSocket) => void)
```

**Parameters:**
- `handler` (Function): The function to call when a new client connects

**Example:**
```typescript
server.onConnect((socket) => {
    console.log('New connection:', socket.id);
    
    socket.on('message', (data) => {
        console.log('Received message:', data);
    });
});
```

#### `broadcast(event, ...args)`

Broadcast an event to all connected clients.

```typescript
server.broadcast(event: string, ...args: any[])
```

**Parameters:**
- `event` (string): The event name to broadcast
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
server.broadcast('notification', { message: 'Hello to all clients!' });
```

#### `broadcastRoom(roomName, event, ...args)`

Broadcast an event to all clients in a specific room.

```typescript
server.broadcastRoom(roomName: string, event: string, ...args: any[])
```

**Parameters:**
- `roomName` (string): The name of the room to broadcast to
- `event` (string): The event name to broadcast
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
server.broadcastRoom('chat-room', 'message', { 
    user: 'John', 
    text: 'Hello everyone!' 
});
```

#### `broadcastWithoutSelf(socket, event, ...args)`

Broadcast an event to all clients except the specified socket.

```typescript
server.broadcastWithoutSelf(socket: GLSocket, event: string, ...args: any[])
```

**Parameters:**
- `socket` (GLSocket): The socket to exclude from the broadcast
- `event` (string): The event name to broadcast
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
server.onConnect((socket) => {
    // Notify all other clients about the new connection
    server.broadcastWithoutSelf(socket, 'userJoined', { 
        userId: socket.id, 
        message: 'A new user joined' 
    });
});
```

#### `room(name)`

Get or create a room by name.

```typescript
server.room(name: string): Room
```

**Parameters:**
- `name` (string): The name of the room

**Returns:**
- `Room`: The room instance

**Example:**
```typescript
const chatRoom = server.room('chat-room');
chatRoom.onJoin((socket) => {
    console.log('User joined chat room:', socket.id);
});
```

#### `falconFrame(app, clientDir)`

Integrate with FalconFrame for serving client files.

```typescript
server.falconFrame(app: FalconFrame, clientDir?: string)
```

**Parameters:**
- `app` (FalconFrame): The FalconFrame application instance
- `clientDir` (string, optional): Path to the client files directory

### Authentication

GlovesLink supports custom authentication through the `authFn` option. This function is called for each new connection and should return `true` for successful authentication or `false` to reject the connection.

**Example:**
```typescript
const glovesLink = new GlovesLinkServer({
    server: httpServer,
    authFn: async ({ headers, url, token }) => {
        // Check token against database
        if (token && await validateToken(token)) {
            return true;
        }
        return false;
    }
});
```

### Error Handling

GlovesLink handles several error cases automatically:
- 401 Unauthorized: When authentication fails
- 403 Forbidden: When access is denied
- 500 Internal Server Error: When an unexpected error occurs during authentication

These errors are communicated to the client through specific events.