# Socket API

`GLSocket` represents a single WebSocket connection on the server side.

## Events

```typescript
socket.on('message', (data) => { /* ... */ });
socket.emit('response', { status: 'success' });
socket.send('response', { status: 'success' }); // Alias for emit
```

## Rooms

```typescript
socket.joinRoom('chat-room');      // Join by name
socket.joinRoom(room);             // Join by Room instance
socket.leaveRoom('chat-room');     // Leave room
socket.leaveAllRooms();            // Leave all rooms
socket.room('chat-room');          // Get room from namespace
socket.userRoom();                 // Get user-specific room (based on user._id)
```

## Disconnect

```typescript
socket.disconnect();
```

## User Data

When auth returns `user`, it is attached to the socket:

```typescript
socket.user; // { _id: string, ... }
```

If `user._id` exists, the socket is automatically added to a user room.

## Acknowledgments

Pass a callback as the last argument to `emit` for request-response patterns:

```typescript
// Server
socket.emit('getData', (response) => {
    console.log('Client responded:', response);
});

// Client
client.on('getData', (ack) => {
    ack({ message: 'Hello!' });
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique socket ID |
| `user` | `T` | User data from auth |
| `namespacePath` | `string` | Namespace this socket belongs to |
| `namespace` | `Namespace` | Parent namespace reference |
| `rooms` | `Set<Room>` | Rooms this socket has joined |
| `dataFormatType` | `"json" \| "bin"` | Message format |
