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
    public ws: GlovesLinkWS;
    public ackIdCounter: number;
    public ackCallbacks: Map<number, Function>;
    public handlers: { [key: string]: Function };
    public opts: GLC_Opts;
    public url: string;

    constructor(url: string, opts: Partial<GLC_Opts> = {}) {
        this.ackIdCounter = 1;
        this.ackCallbacks = new Map();
        this.handlers = {};
        this.opts = {
            logs: false,
            reConnect: true,
            reConnectInterval: 1000,
            ...opts
        }

        this.url = this.ws.fixUrl(url);

        this._connect();
    }

    _connect() {
        this.ws = new GlovesLinkWS(this.url);

        this.ws.onOpen(() => {
            if (this.opts.logs) console.log("[ws] Connected");
            this.handlers.connect?.(this.ws);
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
            if (!evt || (data && !Array.isArray(data))) return;

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
            this.handlers.disconnect?.(this.ws);

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
}