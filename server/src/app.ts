import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { Worker } from "mediasoup/node/lib/types";



const app = express();
const server = http.createServer(app);
app.use(cors());
const usersInRoom = new Map<string, Set<string>>();
const io: Server = new Server(server, {
  cors: {
    origin: "*",
  },
});

// === mediasoup setup ===
let worker: Worker;
let mediaRouter: Router;
const transports = new Map<string, WebRtcTransport>();

async function createMediasoupWorker() {
  worker = await import("mediasoup").then(m =>
    m.createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    })
  );

  mediaRouter = await worker.createRouter({
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
}
async function startServer() {
  await createMediasoupWorker();

  io.on("connection", (socket: Socket) => {
    console.log("🔗 New client connected");
  
   socket.on("join-room", (roomId) => {
     socket.data.roomId = roomId;
      socket.join(roomId);
  
      if (!usersInRoom.has(roomId)) {
        usersInRoom.set(roomId, new Set());
      }
      usersInRoom.get(roomId)!.add(socket.id);
  
      io.to(roomId).emit("user-list", Array.from(usersInRoom.get(roomId)!));
  
      socket.on("disconnect", () => {
        usersInRoom.get(roomId)?.delete(socket.id);
        io.to(roomId).emit("user-list", Array.from(usersInRoom.get(roomId)!));
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
  
    socket.on("create-transport", async (cb) => {
      const transport = await mediaRouter.createWebRtcTransport({
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
    });
  
    socket.on("connect-transport", async ({ dtlsParameters }) => {
      const transport = transports.get(socket.id);
      if (transport) await transport.connect({ dtlsParameters });
    });
  
    socket.on("produce", async ({ kind, rtpParameters }, cb) => {
      const transport = transports.get(socket.id);
      if (!transport) return;
  
      const producer = await transport.produce({ kind, rtpParameters });
      cb({ id: producer.id });
  
      // broadcast to others
      socket.to(socket.data.roomId).emit("new-producer", {
        producerId: producer.id,
        socketId: socket.id,
      });
    });
  
    socket.on("consume", async ({ producerId, rtpCapabilities }, cb) => {
      if (!mediaRouter.canConsume({ producerId, rtpCapabilities })) {
        console.error("Can't consume");
        return;
      }
  
      const transport = transports.get(socket.id);
      const consumer = await transport!.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });
       await consumer.resume(); 
      cb({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    });
  
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
      const transport = transports.get(socket.id);
      transport?.close();
      transports.delete(socket.id);
    });
  });

  server.listen(4000, () => {
  console.log("🚀 Server running at http://localhost:4000");
});

}
startServer(); 


