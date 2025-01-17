import { WebSocketServer } from "ws";

class SocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws, req) => {
      console.log("Client connected");
      this.clients.add(ws);

      // Handle client disconnection
      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });

      // Send initial connection success message
      ws.send(
        JSON.stringify({
          type: "connection",
          message: "Connected successfully",
        })
      );
    });

    // Handle server errors
    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  // Broadcast message to all connected clients
  broadcastMessage(message) {
    const messageString = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  // Emit patient call event
  emitPatientCall(patientData) {
    if (!this.wss) {
      console.error("WebSocket server not initialized");
      return;
    }
    console.log("Emitting patient call event:", patientData);
    this.broadcastMessage({
      type: "patient-call",
      data: patientData,
    });
  }

  // Close all connections
  closeAll() {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close();
      });
      this.clients.clear();
      this.wss.close();
    }
  }
}

export default new SocketService();
