"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)());
const usersInRoom = new Map();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
// === mediasoup setup ===
let worker;
let mediaRouter;
const transports = new Map();
function createMediasoupWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        worker = yield Promise.resolve().then(() => __importStar(require("mediasoup"))).then(m => m.createWorker({
            rtcMinPort: 40000,
            rtcMaxPort: 49999,
        }));
        mediaRouter = yield worker.createRouter({
            mediaCodecs: [
                {
                    kind: "audio",
                    mimeType: "audio/opus",
                    clockRate: 48000,
                    channels: 2,
                },
            ],
        });
        console.log("Mediasoup worker and router initialized");
    });
}
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield createMediasoupWorker();
        io.on("connection", (socket) => {
            console.log("🔗 New client connected");
            socket.on("join-room", (roomId) => {
                socket.data.roomId = roomId;
                socket.join(roomId);
                if (!usersInRoom.has(roomId)) {
                    usersInRoom.set(roomId, new Set());
                }
                usersInRoom.get(roomId).add(socket.id);
                io.to(roomId).emit("user-list", Array.from(usersInRoom.get(roomId)));
                socket.on("disconnect", () => {
                    var _a;
                    (_a = usersInRoom.get(roomId)) === null || _a === void 0 ? void 0 : _a.delete(socket.id);
                    io.to(roomId).emit("user-list", Array.from(usersInRoom.get(roomId)));
                });
            });
            // === Basic code collaboration ===
            socket.on("code-update", ({ roomId, code }) => {
                socket.to(roomId).emit("code-update", code);
            });
            // === WebRTC signaling ===
            socket.on("get-rtp-capabilities", (cb) => {
                cb(mediaRouter.rtpCapabilities);
            });
            socket.on("create-transport", (cb) => __awaiter(this, void 0, void 0, function* () {
                const transport = yield mediaRouter.createWebRtcTransport({
                    listenIps: ['127.0.0.1'],
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                });
                transports.set(socket.id, transport);
                cb({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                });
            }));
            socket.on("connect-transport", (_a) => __awaiter(this, [_a], void 0, function* ({ dtlsParameters }) {
                const transport = transports.get(socket.id);
                if (transport)
                    yield transport.connect({ dtlsParameters });
            }));
            socket.on("produce", (_a, cb_1) => __awaiter(this, [_a, cb_1], void 0, function* ({ kind, rtpParameters }, cb) {
                const transport = transports.get(socket.id);
                if (!transport)
                    return;
                const producer = yield transport.produce({ kind, rtpParameters });
                cb({ id: producer.id });
                // broadcast to others
                socket.to(socket.data.roomId).emit("new-producer", {
                    producerId: producer.id,
                    socketId: socket.id,
                });
            }));
            socket.on("consume", (_a, cb_1) => __awaiter(this, [_a, cb_1], void 0, function* ({ producerId, rtpCapabilities }, cb) {
                if (!mediaRouter.canConsume({ producerId, rtpCapabilities })) {
                    console.error("Can't consume");
                    return;
                }
                const transport = transports.get(socket.id);
                const consumer = yield transport.consume({
                    producerId,
                    rtpCapabilities,
                    paused: false,
                });
                yield consumer.resume();
                cb({
                    id: consumer.id,
                    producerId,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                });
            }));
            socket.on("disconnect", () => {
                console.log("❌ Disconnected:", socket.id);
                const transport = transports.get(socket.id);
                transport === null || transport === void 0 ? void 0 : transport.close();
                transports.delete(socket.id);
            });
        });
        server.listen(4000, () => {
            console.log("🚀 Server running at http://localhost:4000");
        });
    });
}
startServer();
