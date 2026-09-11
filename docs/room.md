# Room API

Rooms group sockets for targeted messaging. Scoped to a namespace, auto-deleted when empty.

## Creating Rooms

```typescript
const room = server.room('chat-room');      // Root namespace
const room = ns.room('lobby');              // Specific namespace
```

## Emitting

```typescript
room.emit('message', { text: 'Hello!' });                    // All sockets
room.emitWithoutSelf(socket, 'userJoined', { id: socket.id }); // All except sender
```

## Joining and Leaving

```typescript
room.join(socket);
room.leave(socket);
room.leaveAll();
```

## Hooks

```typescript
room.onJoin((socket, room) => {
    room.emitWithoutSelf(socket, 'userJoined', { userId: socket.id });
});

room.onLeave((socket, room) => {
    room.emit('userLeft', { userId: socket.id });
});
```

## Properties

```typescript
room.size;      // Number of sockets
room.sockets;   // Array of sockets
room.has(socket); // Check membership
```

## User Rooms

When a socket's `user` has an `_id`, it is automatically added to a user-specific room:

```typescript
server.userRoom('user-123').emit('notification', { text: 'Achievement unlocked!' });
ns.userRoom('user-123').emit('notification', { type: 'achievement' });
```

This targets all sockets of a user within that namespace.
