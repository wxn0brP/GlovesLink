# Client API

The client-side API for GlovesLink provides a simple interface for connecting to a WebSocket server and exchanging messages.

## Class: GlovesLinkClient

### Constructor

```typescript
new GlovesLinkClient(url: string, opts?: Partial<GLC_Opts>)
```

**Parameters:**

- `url` (string): The WebSocket server URL to connect to
- `opts` (Partial<GLC_Opts>, optional): Configuration options

**Options:**

```typescript
{
    reConnect?: boolean;        // Whether to automatically reconnect after disconnection (default: true)
    reConnectInterval?: number; // Reconnection interval in milliseconds (default: 1000)
    logs?: boolean;             // Enable or disable logging (default: false)
    token?: string;             // Authentication token (default: null)
}
```

### Properties

- `ws`: WebSocket - The underlying WebSocket connection
- `ackIdCounter`: number - Counter for tracking acknowledgment IDs
- `ackCallbacks`: Map<number, Function> - Map of acknowledgment callbacks
- `handlers`: { [key: string]: Function } - Event handlers
- `opts`: GLC_Opts - Configuration options
- `url`: URL - The parsed WebSocket URL

### Methods

#### `on(event, handler)`

Listen for events from the server.

```typescript
client.on(event: string, handler: (...args: any[]) => void | any)
```

**Parameters:**
- `event` (string): The event name to listen for
- `handler` (Function): The function to call when the event is received

**Example:**
```typescript
client.on('message', (data) => {
    console.log('Received message:', data);
});
```

#### `emit(event, ...args)`

Emit an event to the server with optional data.

```typescript
client.emit(event: string, ...args: any[])
```

**Parameters:**
- `event` (string): The event name to emit
- `...args` (any[]): Optional data to send with the event

**Example:**
```typescript
client.emit('sendMessage', { text: 'Hello server!' });
```

#### `send(event, ...args)`

Alias for `emit`. Send an event to the server with optional data.

```typescript
client.send(event: string, ...args: any[])
```

#### `close()`

Close the WebSocket connection.

```typescript
client.close()
```

### Events

The client can listen for the following built-in events:

- `connect`: Emitted when the connection is established
- `disconnect`: Emitted when the connection is closed
- `error`: Emitted when an error occurs
- `unauthorized`: Emitted when authentication fails with a 401 status
- `forbidden`: Emitted when access is denied with a 403 status
- `serverError`: Emitted when the server encounters an error with a 500 status

**Example:**
```typescript
client.on('connect', () => {
    console.log('Connected to server');
});

client.on('disconnect', () => {
    console.log('Disconnected from server');
});
```

### Acknowledgments

GlovesLink supports acknowledgments for events. You can send a function as part of the data, and it will be called when the server responds.

**Client-side:**
```typescript
client.emit('getData', (response) => {
    console.log('Server response:', response);
});
```

**Server-side:**
```typescript
socket.on('getData', (cb) => {
    cb({ message: 'Hello from server!' });
});
```