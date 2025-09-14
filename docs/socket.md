# Socket API

The GLSocket class represents an individual WebSocket connection on the server side. It provides methods for sending and receiving events, as well as managing room memberships.

## Class: GLSocket

### Properties

- `id`: string - Unique identifier for the socket
- `ws`: WebSocket - The underlying WebSocket connection
- `server`: GlovesLinkServer - Reference to the parent server instance
- `rooms`: Set<string> - Set of room names the socket has joined
- `ackIdCounter`: number - Counter for tracking acknowledgment IDs
- `ackCallbacks`: Map<number, Function> - Map of acknowledgment callbacks
- `logs`: boolean - Whether logging is enabled
- `handlers`: { [key: string]: Function } - Event handlers

### Methods

#### `on(event, handler)`

Listen for events from the client.

```typescript
socket.on(event: string, handler: (...args: any[]) => void | any)
```

**Parameters:**
- `event` (string): The event name to listen for
- `handler` (Function): The function to call when the event is received

**Example:**
```typescript
socket.on('message', (data) => {
    console.log('Received message:', data);
});
```

#### `emit(event, ...args)`

Emit an event to the client with optional data.

```typescript
socket.emit(event: string, ...args: any[])
```

**Parameters:**
- `event` (string): The event name to emit
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
socket.emit('response', { status: 'success', data: 'Hello client!' });
```

#### `send(event, ...args)`

Alias for `emit`. Send an event to the client with optional data.

```typescript
socket.send(event: string, ...args: any[])
```

#### `close()`

Close the WebSocket connection.

```typescript
socket.close()
```

#### `joinRoom(roomName)`

Join a specific room.

```typescript
socket.joinRoom(roomName: string)
```

**Parameters:**
- `roomName` (string): The name of the room to join

**Example:**
```typescript
socket.on('joinChat', (roomName) => {
    socket.joinRoom(roomName);
    socket.emit('joined', { room: roomName });
});
```

#### `leaveRoom(roomName)`

Leave a specific room.

```typescript
socket.leaveRoom(roomName: string)
```

**Parameters:**
- `roomName` (string): The name of the room to leave

**Example:**
```typescript
socket.on('leaveChat', (roomName) => {
    socket.leaveRoom(roomName);
    socket.emit('left', { room: roomName });
});
```

#### `leaveAllRooms()`

Leave all joined rooms.

```typescript
socket.leaveAllRooms()
```

**Example:**
```typescript
socket.on('disconnect', () => {
    socket.leaveAllRooms();
});
```

### Acknowledgments

Like the client, sockets support acknowledgments for events. You can send a function as part of the data, and it will be called when the client responds.

**Server-side:**
```typescript
socket.emit('getData', (response) => {
    console.log('Client response:', response);
});
```

**Client-side:**
```javascript
client.on('getData', (ack) => {
    ack({ message: 'Hello from client!' });
});
```