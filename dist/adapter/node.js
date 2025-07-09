import { WebSocket } from "ws";
export class GlovesLinkWS {
    ws;
    constructor(url) {
        this.ws = new WebSocket(url);
    }
    onOpen(cb) { this.ws.on("open", cb); }
    onMessage(cb) { this.ws.on("message", cb); }
    onClose(cb) { this.ws.on("close", cb); }
    onError(cb) { this.ws.on("error", cb); }
    send(data) { this.ws.send(data); }
    close() { this.ws.close(); }
    static fixUrl(url) {
        if (!url.startsWith("ws"))
            throw new Error("URL must start with ws:// or wss://");
        return url;
    }
}
