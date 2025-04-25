import { WebSocket } from "ws";
import http from "http";

export interface GLS_Opts {
    server: http.Server;
    logs: boolean;
}

export interface GLS_DataEvent {
    evt: string;
    data: any[];
    ackI?: number[];
}

export interface GLS_AckEvent {
    ack: number;
    data: any[];
}

export class GlovesLinkServer {
    public handlers: { [key: string]: Function };
    public wss: any;
    public ackCallbacks: Map<number, Function> = new Map();
    public ackIdCounter = 1;
    public logs = false;

    constructor(opts: Partial<GLS_Opts>) {
        const { server } = opts;
        this.handlers = {};
        if (opts.logs) this.logs = true;

        this.wss = new WebSocket.Server({ server });

        this.wss.on("connection", (ws: WebSocket) => {
            ws.on("message", (raw: string) => this._handle(ws, raw));
        });
    }

    _handle(ws: WebSocket, raw: string) {
        let msg: GLS_DataEvent | GLS_AckEvent;

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
        if (!evt || !Array.isArray(data)) return;

        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex]) break;

                const ackId = data[ackIndex];
                data[ackIndex] = (...res: any) => {
                    ws.send(JSON.stringify({ ack: ackId, data: res }));
                }
            }
        }

        if (!this.handlers[evt]) return;

        this.handlers[evt](ws, ...data);
    }

    on(evt: string, handler: (ws: WebSocket, ...args: any[]) => void | any) {
        this.handlers[evt] = handler;
    }


    emit(evt: string, ...args: any[]) {
        const ackI = args.map((data, i) => {
            if (typeof data === "function") return i;
        }).filter(Boolean);

        for (let i = 0; i < ackI.length; i++) {
            const ackIndex = ackI[i];
            const ackId = this.ackIdCounter++;
            args[ackIndex] = ackId;
            this.ackCallbacks.set(ackId, args[ackIndex]);
        }

        this.wss.send(JSON.stringify({
            evt,
            data: args,
            ackI
        }));
    }
}