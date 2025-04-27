import { GlovesLinkWS } from "#adapter";

export interface GLC_Opts {
    reConnect: boolean,
    reConnectInterval: number,
    logs: boolean;
    token: string;
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
            token: null,
            ...opts
        }

        this.url = GlovesLinkWS.fixUrl(url);
        if (this.opts.token) this.url += `?token=${this.opts.token}`;

        this._connect();
    }

    _connect() {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        const url = this.url.includes("?") ? `${this.url}&id=${id}` : `${this.url}?id=${id}`;
        this.ws = new GlovesLinkWS(url);

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

        this.ws.onClose((event: CloseEvent) => {
            if (this.opts.logs) console.log("[ws] Disconnected", event);
            this.handlers.disconnect?.(this.ws, event);

            if (event.code === 1006) {
                if (this.opts.logs) console.log("[ws] Connection closed by server");
                fetch("/gloves-link/status?id=" + id).then(res => res.json()).then(data => {
                    if (data.err) {
                        if (this.opts.logs) console.log("[ws] Status error", data.msg);
                        return;
                    }
                    const status = data.status as number;
                    if (this.opts.logs) console.log("[ws] Status", status);
                    if (status === 401) this.handlers.unauthorized?.(this.ws);
                    else if (status === 403) this.handlers.forbidden?.(this.ws);
                    else if (status === 500) this.handlers.serverError?.(this.ws);
                })
                return;
            }
            if (!this.opts.reConnect) return;

            setTimeout(() => {
                this._connect();
            }, this.opts.reConnectInterval);
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

export {
    GlovesLinkClient as default,
    GlovesLinkClient as GLC,
    GlovesLinkClient as client,
}