# Room API

Rooms in GlovesLink provide a way to organize clients into groups for more targeted messaging. Rooms can be used for features like chat rooms, game lobbies, or any scenario where you need to send messages to a subset of connected clients.

## Class: Room

### Properties

- `clients`: Set<GLSocket> - Set of sockets in the room
- `eventEmitter`: EventEmitter - Internal event emitter for room events

### Methods

#### `join(socket)`

Add a socket to the room.

```typescript
room.join(socket: GLSocket)
```

**Parameters:**
- `socket` (GLSocket): The socket to add to the room

#### `leave(socket)`

Remove a socket from the room.

```typescript
room.leave(socket: GLSocket)
```

**Parameters:**
- `socket` (GLSocket): The socket to remove from the room

#### `leaveAll()`

Remove all sockets from the room.

```typescript
room.leaveAll()
```

#### `onJoin(handler)`

Register a handler for when a socket joins the room.

```typescript
room.onJoin(handler: (socket: GLSocket, room: Room) => void)
```

**Parameters:**
- `handler` (Function): The function to call when a socket joins

**Example:**
```typescript
room.onJoin((socket, room) => {
    console.log(`Socket ${socket.id} joined the room`);
    // Notify other clients in the room
    room.emitWithoutSelf(socket, 'userJoined', { userId: socket.id });
});
```

#### `onLeave(handler)`

Register a handler for when a socket leaves the room.

```typescript
room.onLeave(handler: (socket: GLSocket, room: Room) => void)
```

**Parameters:**
- `handler` (Function): The function to call when a socket leaves

**Example:**
```typescript
room.onLeave((socket, room) => {
    console.log(`Socket ${socket.id} left the room`);
    // Notify other clients in the room
    room.emit('userLeft', { userId: socket.id });
});
```

#### `size`

Get the number of sockets in the room.

```typescript
room.size
```

**Returns:**
- `number`: The number of sockets in the room

#### `sockets`

Get an array of all sockets in the room.

```typescript
room.sockets
```

**Returns:**
- `GLSocket[]`: Array of sockets in the room

#### `emit(event, ...args)`

Send an event to all sockets in the room.

```typescript
room.emit(event: string, ...args: any[])
```

**Parameters:**
- `event` (string): The event name to emit
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
room.emit('message', { 
    user: 'John', 
    text: 'Hello everyone in this room!' 
});
```

#### `emitWithoutSelf(socket, event, ...args)`

Send an event to all sockets in the room except the specified socket.

```typescript
room.emitWithoutSelf(socket: GLSocket, event: string, ...args: any[])
```

**Parameters:**
- `socket` (GLSocket): The socket to exclude from the broadcast
- `event` (string): The event name to emit
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
// When a user sends a message, broadcast it to others but not themselves
room.onJoin((socket) => {
    socket.on('sendMessage', (data) => {
        room.emitWithoutSelf(socket, 'message', {
            user: socket.id,
            text: data.text
        });
    });
});
```

#### `has(socket)`

Check if a socket is in the room.

```typescript
room.has(socket: GLSocket)
```

**Parameters:**
- `socket` (GLSocket): The socket to check

**Returns:**
- `boolean`: True if the socket is in the room, false otherwise

## Working with Rooms

### Creating and Accessing Rooms

Rooms are created automatically when first accessed:

```typescript
// Get or create a room
const chatRoom = server.room('chat-room');

// Or access the global room
const globalRoom = server.globalRoom;
```

### Joining and Leaving Rooms

Sockets can join and leave rooms:

```typescript
// From the server side
server.onConnect((socket) => {
    // Join a room
    const chatRoom = server.room('chat-room');
    chatRoom.join(socket);
    
    // Or use the socket method
    socket.joinRoom('chat-room');
});

// From the socket side
socket.on('joinRoom', (roomName) => {
    socket.joinRoom(roomName);
});

socket.on('leaveRoom', (roomName) => {
    socket.leaveRoom(roomName);
});
```

### Broadcasting to Rooms

You can broadcast messages to all members of a room:

```typescript
// From the server
server.broadcastRoom('chat-room', 'announcement', {
    message: 'Server maintenance in 10 minutes'
});

// From a room instance
const chatRoom = server.room('chat-room');
chatRoom.emit('message', {
    user: 'System',
    text: 'Welcome to the chat room!'
});
```