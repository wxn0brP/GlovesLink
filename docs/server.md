# Server API

`GlovesLinkServer` manages WebSocket connections and namespaces.

## Constructor

```typescript
const server = new GlovesLinkServer(opts?: Partial<Server_Opts>)
```

```typescript
{
    logs?: boolean;         // Enable logging (default: false)
    statusTimeout?: number; // Socket status TTL in ms (default: 10000)
}
```

## Attaching to HTTP Server

```typescript
const app = new FalconFrame();
const httpServer = app.listen(3000);

const gl = new GlovesLinkServer();
gl.attachToHttpServer(httpServer);
```

## Namespaces

Namespaces isolate sockets by URL path. Each has its own auth, handlers, and rooms.

```typescript
const rootNs = gl.of("/");
const chatNs = gl.of("/chat");
```

Sockets connecting to `ws://host/chat` are routed to the `/chat` namespace. A 404 is returned if no namespace exists for the path.

See [Namespace API](./namespace.md) for details.

## Authentication

Auth is configured per-namespace via `namespace.auth(authFn)`. The function receives connection data and returns a result:

```typescript
gl.of("/").auth(async ({ token, url, headers, request, socket, head, data }) => {
    const user = await validateToken(token);
    if (user) return { status: 200, user };
    return { status: 401, msg: "Invalid token" };
});
```

**AuthFnResult:**

```typescript
{
    status: number;             // 200 = success
    user?: Record<string, any>; // Attached to socket.user
    msg?: string;               // Error message for client
    toSet?: Record<string, any> // Passed to connection handler
}
```

When `user` has an `_id`, the socket is automatically added to a user-specific room accessible via `server.userRoom(userId)`.

**Server_Auth_Opts** (passed to authFn):

```typescript
{
    headers: http.IncomingHttpHeaders;
    url: URL;
    token?: string;
    request: http.IncomingMessage;
    socket: Stream.Duplex;
    head: Buffer;
    data?: Record<string, any>;
}
```

## Error Handling

GlovesLink handles errors automatically and communicates them to the client via the status endpoint:

| Status | Meaning |
|--------|---------|
| 404    | Namespace not found |
| 401    | Auth failed |
| 403    | Access denied |
| 500    | Server error during auth |

The client emits `connect_unauthorized`, `connect_forbidden`, or `connect_serverError` accordingly.

## FalconFrame Integration

```typescript
gl.falconFrame(app);                           // Serve client files + status endpoint
gl.falconFrame(app, "/path/to/client/dist");   // Custom client directory
gl.falconFrame(app, false);                    // Disable client serving
```

This enables the status endpoint at `/gloves-link/status` and serves the browser client.

## Binary Transport

By default, messages use JSON. Add `?type=bin` to the connection URL for binary transport. The binary format uses a delimiter (`\b` by default, configurable via `GLOVES_LINK_DELIMITER` env var) to separate event names, ack IDs, and data.

## Server Methods

```typescript
gl.broadcastRoom('room', 'event', ...args);    // Broadcast to room in root namespace
gl.room('name');                               // Get/create room in root namespace
gl.userRoom('user-123');                       // Get/create user room in root namespace
gl.emitToUserId('user-123', 'event', ...args); // Emit to user across all namespaces
```
