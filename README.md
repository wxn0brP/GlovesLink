# GlovesLink

GlovesLink is a WebSocket communication library designed for seamless interaction between clients and servers.

## Features

### General
- **WebSocket Communication**: Establish real-time communication between clients and servers.
- **Automatic Reconnection**: Automatically reconnects after disconnection.
- **Authentication Support**: Token-based authentication for secure connections.
- **Logging**: Optional logging for debugging and monitoring.
- **Rooms**: Organize communication within specific rooms for better organization and control.

### Communication
- **Event Emission**: Send events with arbitrary data.
- **Callbacks**: Handle server/client responses with callback functions.

## Installation

```bash
yarn add github:wxn0brp/GlovesLink#dist-server
yarn add github:wxn0brp/GlovesLink#dist-client
```

### Optional Dependencies
[FalconFrame](https://github.com/wxn0brP/FalconFrame) for http server
```bash
yarn add @wxn0brp/falcon-frame
```

## Usage

### Server-Side (with FalconFrame)

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link/server';
import { FalconFrame } from '@wxn0brp/falcon-frame';

const app = new FalconFrame();
const httpServer = app.listen(3000);

const glovesLink = new GlovesLinkServer({
    server: httpServer,
    logs: true,
    authFn: async ({ headers, url, token }) => {
        // Implement your authentication logic here
        return true;
    }
});
glovesLink.falconFrame(app);

glovesLink.onConnect((socket) => {
    console.log('New connection:', socket.id);

    socket.on('exampleEvent', (data) => {
        console.log('Received data:', data);
        socket.emit('response', 'Hello from server');
    });
});
```

### Client-Side

```typescript
import GlovesLinkClient from '@wxn0brp/gloves-link/client';
//or browser
import GlovesLinkClient from 'path/to/your/GlovesLinkClient.js';
// if you use falcon-frame
import GlovesLinkClient from '/gloves-link/client';

const client = new GlovesLinkClient('ws://example.com', {
    reConnect: true,
    reConnectInterval: 5000,
    logs: true,
    token: 'your-auth-token'
});

client.on('connect', () => {
    console.log('Connected to server');
});

client.on('response', (message) => {
    console.log('Response from server:', message);
});

client.emit('exampleEvent', { hello: 'world' });
```

## API Reference

For detailed API documentation, see:

- [Client API](./docs/client.md)
- [Server API](./docs/server.md)
- [Socket API](./docs/socket.md)
- [Room API](./docs/room.md)

## License

MIT License
