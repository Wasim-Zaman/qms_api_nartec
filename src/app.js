import dotenv from "dotenv";
import express from "express";
import path, { dirname } from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

import config from "./config/config.js";
import swaggerSpec from "./config/swagger.js";
import cors from "./middlewares/cors.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";
import routes from "./routes.js";

const PORT = config.PORT;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statically serverd routes
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));

// API Routes
app.use("/api/v1", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error Routes
app.use(notFoundHandler);
app.use(errorHandler);


app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});
