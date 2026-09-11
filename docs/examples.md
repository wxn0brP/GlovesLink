# Examples

## Chat with Auth

**Server:**

```typescript
import { GlovesLinkServer } from '@wxn0brp/gloves-link-server';
import { FalconFrame } from '@wxn0brp/falcon-frame';

const app = new FalconFrame();
const httpServer = app.listen(3000);

const gl = new GlovesLinkServer();
gl.attachToHttpServer(httpServer);
gl.falconFrame(app);

gl.of("/").auth(async ({ token }) => {
    const user = await validateToken(token);
    if (!user) return { status: 401, msg: "Invalid token" };
    return { status: 200, user: { _id: user.id, name: user.name } };
});

gl.of("/").onConnect((socket) => {
    socket.on('message', (text) => {
        gl.of("/").emit('message', { user: socket.user.name, text });
    });
});
```

**Client:**

```typescript
import GlovesLinkClient from '@wxn0brp/gloves-link-client';

const client = new GlovesLinkClient('ws://localhost:3000?token=my-token', {
    reConnect: true
});

client.on('connect', () => console.log('Connected'));
client.on('connect_unauthorized', (msg) => console.log('Auth failed:', msg));
client.on('message', (data) => console.log(`${data.user}: ${data.text}`));

function sendMessage(text: string) {
    client.emit('message', text);
}
```

## Namespaced Channels

```typescript
const chatNs = gl.of("/chat");
chatNs.onConnect((socket) => {
    socket.on('message', (text) => {
        chatNs.room('general').emit('message', { user: socket.user.name, text });
    });
});

const gameNs = gl.of("/game");
gameNs.onConnect((socket) => {
    socket.on('move', (data) => {
        gameNs.emit('playerMove', { player: socket.id, ...data });
    });
});
```

**Client:**

```typescript
const chat = new GlovesLinkClient('ws://localhost:3000/chat');
chat.on('message', (data) => console.log(`${data.user}: ${data.text}`));

const game = new GlovesLinkClient('ws://localhost:3000/game');
game.on('playerMove', (data) => console.log('Move:', data));
```
