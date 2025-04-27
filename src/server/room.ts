import { GLSocket } from "../server";

export const rooms = new Map<string, Set<GLSocket>>();

export function joinRoom(socket: GLSocket, roomName: string) {
    if (!rooms.has(roomName)) 
        rooms.set(roomName, new Set());

    const room = rooms.get(roomName);
    room.add(socket);
}

export function leaveRoom(socket: GLSocket, roomName: string) {
    if (!rooms.has(roomName)) return;

    const room = rooms.get(roomName);
    room.delete(socket);

    if (room.size === 0) rooms.delete(roomName);
}

export function leaveAllRooms(socket: GLSocket) {
    for (const [roomName, clients] of rooms.entries()) {
        clients.delete(socket);

        if (clients.size === 0) rooms.delete(roomName);
    }
}

export function sendMessageToRoom(roomName: string, evtName: string, ...data: any) {
    if (!rooms.has(roomName)) return false;
    const room = rooms.get(roomName);

    for (const client of room) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.emit(evtName, ...data);
        }
    }

    return true;
}

export function getClientsInRoom(roomName: string) {
    return rooms.has(roomName) ? rooms.get(roomName) : null;
}

export function isClientInRoom(socket: GLSocket, roomName: string) {
    return rooms.has(roomName) && rooms.get(roomName).has(socket);
}

export function getAllRooms() {
    return Array.from(rooms.keys());
}

export function getRoomSize(roomName: string) {
    return rooms.has(roomName) ? rooms.get(roomName).size : 0;
}

export function getClientRooms(socket: GLSocket) {
    return Array.from(rooms.keys()).filter(roomName => isClientInRoom(socket, roomName));
}