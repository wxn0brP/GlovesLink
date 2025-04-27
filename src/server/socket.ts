import { WebSocket } from "ws";
import * as roomUtils from "./room";
import { Server_AckEvent, Server_DataEvent } from "./types";

export class GLSocket {
    id: string;
    ackIdCounter = 1;
    ackCallbacks: Map<number, Function> = new Map();
    logs = false;
    handlers: { [key: string]: Function };

    constructor(public ws: WebSocket, id?: string) {
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.handlers = {};
        this.ws.on("message", (raw: string) => this._handle(raw));
    }

    _handle(raw: string) {
        let msg: Server_DataEvent | Server_AckEvent;

        try {
            msg = JSON.parse(raw);
        } catch {
            if (this.logs) console.warn("[ws] Invalid JSON:", raw);
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
        if (!evt || (data && !Array.isArray(data))) return;

        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex]) break;

                const ackId = data[ackIndex];
                data[ackIndex] = (...res: any) => {
                    this.ws.send(JSON.stringify({ ack: ackId, data: res }));
                }
            }
        }

        if (!this.handlers[evt]) return;

        this.handlers[evt](...data);
    }

    on(evt: string, handler: (...args: any[]) => void | any) {
        this.handlers[evt] = handler;
    }

    emit(evt: string, ...args: any[]) {
        const ackI = args.map((data, i) => {
            if (typeof data === "function") return i;
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

    joinRoom(roomName: string) {
        roomUtils.joinRoom(this, roomName);
    }

    leaveRoom(roomName: string) {
        roomUtils.leaveRoom(this, roomName);
    }

    leaveAllRooms() {
        roomUtils.leaveAllRooms(this);
    }
}