import { WebSocketServer } from "ws";
import * as roomUtils from "./room.js";
import { Server_Opts } from "./types.js";
import { GLSocket } from "./socket.js";
import FalconFrame from "@wxn0brp/falcon-frame";
export declare class GlovesLinkServer {
    wss: WebSocketServer;
    private onConnectEvent;
    logs: boolean;
    opts: Server_Opts;
    initStatusTemp: {
        [key: string]: number;
    };
    clients: Set<GLSocket>;
    constructor(opts: Partial<Server_Opts>);
    private saveSocketStatus;
    onConnect(handler: (ws: GLSocket) => void): void;
    falconFrame(app: FalconFrame): void;
}
export { roomUtils };
