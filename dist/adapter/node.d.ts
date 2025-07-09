import { WebSocket } from "ws";
export declare class GlovesLinkWS {
    ws: WebSocket;
    constructor(url: string);
    onOpen(cb: any): void;
    onMessage(cb: any): void;
    onClose(cb: any): void;
    onError(cb: any): void;
    send(data: any): void;
    close(): void;
    static fixUrl(url: string): string;
}
