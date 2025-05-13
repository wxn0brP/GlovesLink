import { WebSocket } from "ws";
export declare class GLSocket {
    ws: WebSocket;
    id: string;
    ackIdCounter: number;
    ackCallbacks: Map<number, Function>;
    logs: boolean;
    handlers: {
        [key: string]: Function;
    };
    constructor(ws: WebSocket, id?: string);
    _handle(raw: string): void;
    on(evt: string, handler: (...args: any[]) => void | any): void;
    emit(evt: string, ...args: any[]): void;
    joinRoom(roomName: string): void;
    leaveRoom(roomName: string): void;
    leaveAllRooms(): void;
}
