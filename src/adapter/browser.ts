export class GlovesLinkWS {
    ws: WebSocket;
    constructor(url: string) {
        this.ws = new WebSocket(url);
    }
    onOpen(cb: any) { this.ws.addEventListener("open", cb); }
    onMessage(cb: any) { this.ws.addEventListener("message", (e) => cb(e.data)); }
    onClose(cb: any) { this.ws.addEventListener("close", cb); }
    onError(cb: any) { this.ws.addEventListener("error", cb); }
    send(data: any) { this.ws.send(data); }
    close() { this.ws.close(); }
    static fixUrl(url: string) {
        if (url.startsWith("/")) url = window.location.host + url;
        if (!url.startsWith("ws://") && !url.startsWith("wss://")){ 
            const protocol = window?.location?.protocol === "https:" ? "wss://" : "ws://";
            url = protocol + url;
        }
        return url;
    }
}
