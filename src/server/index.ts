import { WebSocketServer } from "ws";
import * as roomUtils from "./room";
import { Server_Opts } from "./types";
import { GLSocket } from "./socket";
import FalconFrame from "@wxn0brp/falcon-frame";

export class GlovesLinkServer {
    public wss: WebSocketServer;
    private onConnectEvent: (ws: GLSocket) => void;
    public logs = false;
    public opts: Server_Opts;
    public initStatusTemp: { [key: string]: number } = {}

    constructor(opts: Partial<Server_Opts>) {
        this.opts = {
            server: null,
            logs: false,
            authFn: () => true,
            ...opts
        }

        if (!this.opts.server) {
            throw new Error("Server is not provided");
        }

        const { server } = opts;

        this.wss = new WebSocketServer({ noServer: true });

        server.on("upgrade", async (request, socket, head) => {
            const headers = request.headers;

            let socketSelfId: string;
            try {
                const url = new URL(request.url!, `http://${request.headers.host}`);
                const token = url.searchParams.get("token");
                socketSelfId = url.searchParams.get("id");
                const isAuthenticated = await this.opts.authFn({ headers, url, token });

                if (!isAuthenticated) {
                    this.saveSocketStatus(socketSelfId, 401);
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const glSocket = new GLSocket(ws);
                    glSocket.logs = this.logs;

                    this.onConnectEvent(glSocket);
                });
            } catch (err) {
                if (process.env.NODE_ENV === "development") console.error("[GlovesLinkServer]", err);
                if (this.logs) console.warn("[auth] Error during authentication:", err);
                this.saveSocketStatus(socketSelfId, 500);
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            }
        });
    }

    private saveSocketStatus(socketSelfId: string, status: number) {
        if (!socketSelfId) return;
        this.initStatusTemp[socketSelfId] = status;
        setTimeout(() => {
            delete this.initStatusTemp[socketSelfId];
        }, 10_000);
    }

    onConnect(handler: (ws: GLSocket) => void) {
        this.onConnectEvent = handler;
    }

    falconFrame(app: FalconFrame) {
        const __dirname = import.meta.dirname;
        app.get("/gloves-link/client.js", (req, res) => {
            res.sendFile(__dirname + "/../GlovesLinkClient.js");
        });
        app.get("/gloves-link/client.js.map", (req, res) => {
            res.sendFile(__dirname + "/../GlovesLinkClient.js.map");
        });
        app.get("/gloves-link/status", (req, res) => {
            const id = req.query.id as string;
            if (!id) {
                res.status(400).json({ err: true, msg: "No id provided" });
                return;
            }
            const status = this.initStatusTemp[id];
            if (status === undefined) {
                res.status(404).json({ err: true, msg: "Socket not found" });
                return;
            }
            res.json({ status });
            delete this.initStatusTemp[id];
        });
    }
}

export {
    roomUtils
}