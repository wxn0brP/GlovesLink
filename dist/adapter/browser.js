export class GlovesLinkWS {
    ws;
    constructor(url) {
        this.ws = new WebSocket(url);
    }
    onOpen(cb) { this.ws.addEventListener("open", cb); }
    onMessage(cb) { this.ws.addEventListener("message", (e) => cb(e.data)); }
    onClose(cb) { this.ws.addEventListener("close", cb); }
    onError(cb) { this.ws.addEventListener("error", cb); }
    send(data) { this.ws.send(data); }
    close() { this.ws.close(); }
    static fixUrl(url) {
        if (url.startsWith("/"))
            url = window.location.host + url;
        if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
            const protocol = window?.location?.protocol === "https:" ? "wss://" : "ws://";
            url = protocol + url;
        }
        return url;
    }
}
