export const rooms = new Map();
export function joinRoom(socket, roomName) {
    if (!rooms.has(roomName))
        rooms.set(roomName, new Set());
    const room = rooms.get(roomName);
    room.add(socket);
}
export function leaveRoom(socket, roomName) {
    if (!rooms.has(roomName))
        return;
    const room = rooms.get(roomName);
    room.delete(socket);
    if (room.size === 0)
        rooms.delete(roomName);
}
export function leaveAllRooms(socket) {
    for (const [roomName, clients] of rooms.entries()) {
        clients.delete(socket);
        if (clients.size === 0)
            rooms.delete(roomName);
    }
}
export function sendMessageToRoom(roomName, evtName, ...data) {
    if (!rooms.has(roomName))
        return false;
    const room = rooms.get(roomName);
    for (const client of room) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.emit(evtName, ...data);
        }
    }
    return true;
}
export function getClientsInRoom(roomName) {
    return rooms.has(roomName) ? rooms.get(roomName) : null;
}
export function isClientInRoom(socket, roomName) {
    return rooms.has(roomName) && rooms.get(roomName).has(socket);
}
export function getAllRooms() {
    return Array.from(rooms.keys());
}
export function getRoomSize(roomName) {
    return rooms.has(roomName) ? rooms.get(roomName).size : 0;
}
export function getClientRooms(socket) {
    return Array.from(rooms.keys()).filter(roomName => isClientInRoom(socket, roomName));
}
