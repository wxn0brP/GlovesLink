import * as roomUtils from "./room.js";
export class GLSocket {
    ws;
    id;
    ackIdCounter = 1;
    ackCallbacks = new Map();
    logs = false;
    handlers;
    constructor(ws, id) {
        this.ws = ws;
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.handlers = {};
        this.ws.on("message", (raw) => this._handle(raw));
    }
    _handle(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        }
        catch {
            if (this.logs)
                console.warn("[ws] Invalid JSON:", raw);
            return;
        }
        if ("ack" in msg) {
            const ackId = msg.ack;
            const ackCallback = this.ackCallbacks.get(ackId);
            if (ackCallback) {
                this.ackCallbacks.delete(ackId);
                ackCallback(...msg.data);
            }
            return;
        }
        const { evt, data, ackI } = msg;
        if (!evt || (data && !Array.isArray(data)))
            return;
        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex])
                    break;
                const ackId = data[ackIndex];
                data[ackIndex] = (...res) => {
                    this.ws.send(JSON.stringify({ ack: ackId, data: res }));
                };
            }
        }
        if (!this.handlers[evt])
            return;
        this.handlers[evt](...data);
    }
    on(evt, handler) {
        this.handlers[evt] = handler;
    }
    emit(evt, ...args) {
        const ackI = args.map((data, i) => {
            if (typeof data === "function")
                return i;
        }).filter(i => i !== undefined);
        for (let i = 0; i < ackI.length; i++) {
            const ackIndex = ackI[i];
            const ackId = this.ackIdCounter++;
            this.ackCallbacks.set(ackId, args[ackIndex]);
            args[ackIndex] = ackId;
        }
        this.ws.send(JSON.stringify({
            evt,
            data: args || undefined,
            ackI: ackI.length ? ackI : undefined
        }));
    }
    joinRoom(roomName) {
        roomUtils.joinRoom(this, roomName);
    }
    leaveRoom(roomName) {
        roomUtils.leaveRoom(this, roomName);
    }
    leaveAllRooms() {
        roomUtils.leaveAllRooms(this);
    }
}
