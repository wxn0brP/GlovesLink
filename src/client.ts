import { GlovesLinkWS } from "#adapter";

export interface GLC_Opts {
    reConnect: boolean,
    reConnectInterval: number,
    logs: boolean;
}

export interface GLC_DataEvent {
    evt: string;
    data: any[];
    ackI?: number[];
}

export interface GLC_AckEvent {
    ack: number;
    data: any[];
}

export class GlovesLinkClient {
    ws: GlovesLinkWS;
    ackIdCounter: number;
    ackCallbacks: Map<number, Function>;
    handlers: { [key: string]: Function };
    opts: GLC_Opts;

    constructor(public url: string, opts: Partial<GLC_Opts> = {}) {
        this.ackIdCounter = 1;
        this.ackCallbacks = new Map();
        this.handlers = {};
        this.opts = {
            logs: false,
            reConnect: true,
            reConnectInterval: 1000,
            ...opts
        }

        this._connect();
    }

    _connect() {
        this.ws = new GlovesLinkWS(this.url);

        this.ws.onOpen(() => {
            if (this.opts.logs) console.log("[ws] Connected ");
        });

        this.ws.onMessage((raw: string) => {
            let msg: GLC_DataEvent | GLC_AckEvent;

            try {
                msg = JSON.parse(raw);
            } catch {
                if (this.opts.logs) console.warn("[ws] Invalid JSON:", raw);
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
                        this.ws.send(JSON.stringify({
                            ack: ackId,
                            data: res
                        }));
                    };
                }
            }

            const handler = this.handlers[evt];
            if (!handler) return;

            handler(...data);
        });

        this.ws.onClose(() => {
            if (this.opts.logs) console.log("[ws] Disconnected");

            if (this.opts.reConnect) {
                setTimeout(() => {
                    this._connect();
                }, this.opts.reConnectInterval);
            }
        });
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

        this.ws.send(JSON.stringify({
            evt,
            data: args,
            ackI
        }));
    }
}