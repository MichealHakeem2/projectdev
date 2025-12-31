let io;

const initSocket = (server) => {
    const socketIO = require('socket.io');

    io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        socket.on('join_user_room', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`User ${userId} joined their personal room`);
        });

        socket.on('join_community', (communityId) => {
            socket.join(`community:${communityId}`);
            console.log(`User joined community: ${communityId}`);
        });

        socket.on('leave_community', (communityId) => {
            socket.leave(`community:${communityId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

const emitToCommunity = (communityId, event, data) => {
    if (io) {
        io.to(`community:${communityId}`).emit(event, data);
    }
};

const emitGlobal = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToUser,
    emitToCommunity,
    emitGlobal
};