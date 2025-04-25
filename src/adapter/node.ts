import { WebSocket } from "ws";

export class GlovesLinkWS {
    ws: WebSocket
    constructor(url: string) {
        this.ws = new WebSocket(url);
    }
    onOpen(cb: any) { this.ws.on("open", cb); }
    onMessage(cb: any) { this.ws.on("message", cb); }
    onClose(cb: any) { this.ws.on("close", cb); }
    onError(cb: any) { this.ws.on("error", cb); }
    send(data: any) { this.ws.send(data); }
    close() { this.ws.close(); }
    static fixUrl(url: string) {
        if (!url.startsWith("ws")) throw new Error("URL must start with ws:// or wss://");
        return url;
    }
}