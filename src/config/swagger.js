import dotenv from "dotenv";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { fileURLToPath } from "url";

dotenv.config();

const DOMAIN = process.env.DOMAIN || "http://localhost:3000";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "QMS",
    version: "1.0.0",
    description: "APIs Documentation",
    contact: {
      name: "Wasim Zaman",
      email: "wasimxaman13@gmail.com",
    },
  },
  servers: [
    {
      url: DOMAIN,
      description: "Running server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

// To get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  swaggerDefinition: swaggerDefinition,
  apis: [
    path.join(__dirname, "../docs/user.swagger.js"),
    path.join(__dirname, "../docs/patient.swagger.js"),
    path.join(__dirname, "../docs/v2/patient.swagger.js"),
    path.join(__dirname, "../docs/department.swagger.js"),
    path.join(__dirname, "../docs/kpi.swagger.js"),
    path.join(__dirname, "../docs/role.swagger.js"),
    path.join(__dirname, "../docs/bed.swagger.js"),
    path.join(__dirname, "../docs/journey.swagger.js"),
    // add more paths...
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
