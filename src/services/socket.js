import { Server } from "socket.io";
import config from "../config/config.js";

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  emitPatientCall(patientData) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }
    console.log("Emitting patient call event:", patientData);
    this.io.emit("patient-call", patientData);
  }
}

export default new SocketService();
