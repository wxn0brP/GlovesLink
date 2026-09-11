# Client API

Typed WebSocket client with auto-reconnection and acknowledgments.

## Constructor

```typescript
const client = new GlovesLinkClient<InputEvents, OutputEvents>(url, opts?);
```

```typescript
interface ServerEvents {
    message: (text: string) => void;
}

interface ClientEvents {
    sendMessage: (text: string) => void;
}

const client = new GlovesLinkClient<ServerEvents, ClientEvents>('ws://localhost:3000');
client.on('message', (text) => console.log(text));
client.emit('sendMessage', 'Hello!');
```

## Options

```typescript
{
    logs?: boolean;                  // Enable logging (default: false)
    token?: string;                  // Auth token
    autoConnect?: boolean;           // Connect on instantiation (default: true)
    connectionData?: Record<string, any>; // Custom data sent via URL
    statusPath?: string;             // Status endpoint path (default: "/gloves-link/status")
    reConnect?: boolean;             // Auto-reconnect (default: true)
    reConnectInterval?: number;      // Base interval in ms (default: 1000)
    reConnectBackoffFactor?: number; // Backoff multiplier (default: 2)
    maxReConnectAttempts?: number;   // Max attempts (default: 5)
    maxReConnectDelay?: number;      // Max delay in ms (default: 15000)
}
```

## Methods

```typescript
client.on('event', handler);       // Listen for event
client.once('event', handler);     // Listen once
client.emit('event', ...args);     // Send event
client.send('event', ...args);     // Alias for emit
client.connect();                  // Manual connect
client.disconnect();               // Close + prevent reconnect
client.close();                    // Close (reconnect still triggers)
client.baseOn();                   // Log all built-in events
```

## Built-in Events

```typescript
client.on('connect', (ws) => {});
client.on('disconnect', (event) => {});
client.on('error', (...err) => {});
client.on('connect_unauthorized', (msg) => {});  // 401
client.on('connect_forbidden', (msg) => {});     // 403
client.on('connect_serverError', (msg) => {});   // 500
client.on('reconnect_failed', () => {});
```

## Reconnection

Auto-reconnect uses exponential backoff with jitter:

1. Delay = `reConnectInterval * reConnectBackoffFactor ^ (attempt - 1)`, capped at `maxReConnectDelay`
2. Jitter: random factor (1.0-1.5)
3. Stops after `maxReConnectAttempts`

On abnormal close (code 1006), the client checks the status endpoint first. If it returns 401/403/500, the client emits the corresponding event and does **not** reconnect.

Events sent while disconnected are queued and flushed on reconnect.

## Acknowledgments

```typescript
client.emit('getData', (response) => {
    console.log('Server responded:', response);
});
```

## Binary Transport

```typescript
const client = new GlovesLinkClient('ws://localhost:3000?type=bin');
```

## Properties

```typescript
client.ws;         // Underlying WebSocket
client.opts;       // Configuration
client.url;        // Parsed URL
client.connected;  // Connection status
```
