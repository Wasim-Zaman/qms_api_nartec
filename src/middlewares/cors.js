import cors from "cors";

import MyError from "../utils/error.js";

const whitelist = [
  process.env.DOMAIN,
  process.env.FRONTEND_URL,
  "http://localhost:3095",
  "http://gs1ksa.org:3095",
  "https://qms.groute.online",
  "https://hqms.gtrack.online",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new MyError("Origin not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

export default cors(corsOptions);
