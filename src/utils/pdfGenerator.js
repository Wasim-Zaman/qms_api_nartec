import bwipjs from "bwip-js";
import ejs from "ejs";
import fs from "fs-extra";
import path, { dirname } from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { ensureDir, getRelativePath } from "./file.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add logo path configuration
const LOGO_PATH = "/assets/images/gst-logo.png";
const DOMAIN = process.env.DOMAIN || "http://localhost:3000";
const LOGO_URL = `${DOMAIN}${LOGO_PATH}`;

class PDFGenerator {
  static async generateTicket(data) {
    try {
      const templatePath = path.join(__dirname, "../view/ticket.ejs");
      const templateContent = await fs.readFile(templatePath, "utf-8");

      // Format date for barcode and display
      const now = data.issueDate;
      const formattedDateTime = now
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");

      // Generate barcode string
      const barcodeText = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(
        now.getHours()
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds()
      ).padStart(2, "0")}${data.counter}`;

      // Generate barcode using bwip-js
      const barcodeBuffer = await new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          {
            bcid: "code128", // Barcode type
            text: barcodeText, // Text to encode
            scale: 3, // 3x scaling factor
            height: 10, // Bar height, in millimeters
            includetext: false, // Don't include text below the barcode
            textxalign: "center", // Center the text
          },
          (err, png) => {
            if (err) reject(err);
            else resolve(png);
          }
        );
      });

      // Convert to base64
      const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString(
        "base64"
      )}`;

      // Prepare template data
      const templateData = {
        ...data,
        formattedDateTime,
        barcode: barcodeBase64,
        barcodeText,
      };

      // Generate HTML
      const html = await ejs.render(templateContent, templateData, {
        async: true,
      });

      // Ensure uploads directory exists
      const uploadsDir = await ensureDir("uploads/tickets");

      // Generate unique filename
      const fileName = `ticket-${data.deptcode}-${
        data.counter
      }-${Date.now()}.pdf`;
      const absolutePath = path.join(uploadsDir, fileName);
      const relativePath = getRelativePath(absolutePath);

      // Create directory if it doesn't exist
      await fs.ensureDir(path.join("uploads", "tickets"));

      // Generate PDF
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      await page.pdf({
        path: absolutePath,
        width: "80mm",
        height: "150mm",
        margin: {
          top: "10px",
          right: "10px",
          bottom: "10px",
          left: "10px",
        },
        printBackground: true,
      });

      await browser.close();

      return {
        absolutePath,
        relativePath,
        barcodeBase64,
      };
    } catch (error) {
      console.error("Error generating ticket:", error);
      throw error;
    }
  }
}

export default PDFGenerator;
