# GlovesLink

Typed WebSocket communication with namespaces, rooms, and rate limiting.

[Main repo](https://github.com/wxn0brP/GlovesLink) |
[Client repo](https://github.com/wxn0brP/GlovesLink-client) |
[Server repo](https://github.com/wxn0brP/GlovesLink-server)

## Quickstart

```bash
bun add @wxn0brp/gloves-link-server @wxn0brp/gloves-link-client
```

**Server:**

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link-server';
import { FalconFrame } from '@wxn0brp/falcon-frame';

const app = new FalconFrame();
const httpServer = app.listen(3000);

const gl = new GlovesLinkServer();
gl.attachToHttpServer(httpServer);
gl.falconFrame(app);

gl.of("/").onConnect((socket) => {
    socket.on('message', (text) => {
        socket.emit('message', { user: socket.id, text });
    });
});
```

**Client:**

```typescript
import GlovesLinkClient from '@wxn0brp/gloves-link-client';

const client = new GlovesLinkClient('ws://localhost:3000');

client.on('connect', () => client.emit('message', 'Hello!'));
client.on('message', (data) => console.log(`${data.user}: ${data.text}`));
```

## Docs

- [Server API](./docs/server.md) - namespaces, auth, falconFrame integration
- [Namespace API](./docs/namespace.md) - rooms, user rooms, scoped emits
- [Socket API](./docs/socket.md) - events, rooms, acknowledgments
- [Room API](./docs/room.md) - group messaging, join/leave hooks
- [Client API](./docs/client.md) - connection, reconnection, typed events
- [Examples](./docs/examples.md) - common patterns
- [Limit API](./docs/limit.md) - rate limiting and validation

## License

MIT
