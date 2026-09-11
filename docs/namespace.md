# Namespace API

Namespaces isolate sockets by URL path. Each has its own auth, connection handler, rooms, and user rooms.

```typescript
const ns = server.of("/chat");
```

## Connection Handler

```typescript
ns.onConnect((socket, authData, authResult) => {
    console.log(`${socket.user.name} connected`);

    socket.on('message', (text) => {
        ns.room('general').emit('message', { user: socket.user.name, text });
    });
});
```

## Authentication

See [Server API - Authentication](./server.md#authentication) for the full auth flow. Auth is set per-namespace:

```typescript
ns.auth(async ({ token }) => {
    const user = await validateToken(token);
    if (!user) return { status: 401, msg: "Invalid token" };
    return { status: 200, user: { _id: user.id, name: user.name } };
});
```

## Emitting

```typescript
ns.emit('announcement', { text: 'Server restarting' });           // All sockets in namespace
ns.emitWithoutSelf(socket, 'userJoined', { userId: socket.id });  // All except sender
```

## Rooms

```typescript
ns.room('lobby');               // Get/create named room
ns.userRoom('user-123');        // Get/create user-specific room
ns.emitToUserId('user-123', 'notification', { type: 'achievement' });
```

Each namespace has a default room containing all its sockets. `ns.emit()` sends to this room.

See [Room API](./room.md) for room details.

## Full Example

```typescript
const ns = server.of("/chat");

ns.auth(async ({ token }) => {
    const user = await db.users.findByToken(token);
    if (!user) return { status: 401, msg: "Invalid token" };
    return { status: 200, user: { _id: user.id, name: user.name } };
});

ns.onConnect((socket) => {
    socket.on('sendMessage', (data) => {
        ns.room('general').emit('message', { user: socket.user.name, text: data.text });
    });

    socket.on('joinRoom', (roomName) => {
        socket.joinRoom(roomName);
        ns.room(roomName).emitWithoutSelf(socket, 'userJoined', { userName: socket.user.name });
    });
});
```
