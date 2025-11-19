# GlovesLink

GlovesLink is a WebSocket communication library designed for seamless interaction between clients and servers.

[Main repo](https://github.com/wxn0brP/GlovesLink) |
[Client repo](https://github.com/wxn0brP/GlovesLink-client) |
[Server repo](https://github.com/wxn0brP/GlovesLink-server)

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
npm i @wxn0brp/gloves-link-server @wxn0brp/gloves-link-client @wxn0brp/falcon-frame
```

## API Reference

For detailed API documentation, see:

- [Client API](./docs/client.md)
- [Server API](./docs/server.md)
- [Socket API](./docs/socket.md)
- [Room API](./docs/room.md)

## License

MIT License
