import ejs from "ejs";
import fs from "fs-extra";
import path, { dirname } from "path";
import puppeteer from "puppeteer";
import QRCode from "qrcode";
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

      // Generate QR code for the ticket
      const qrCodeData = `${data.deptcode}-${
        data.counter
      }-${data.issueDate.toISOString()}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);

      // Prepare data for template
      const templateData = {
        ...data,
        qrCode: qrCodeDataUrl,
        formattedDate: data.issueDate.toLocaleDateString(),
        formattedTime: data.issueDate.toLocaleTimeString(),
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
        format: "A4",
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
        printBackground: true,
      });

      await browser.close();

      return {
        absolutePath,
        relativePath: `uploads/tickets/${fileName}`, // Ensure consistent format for database storage
      };
    } catch (error) {
      console.error("Error generating ticket:", error);
      throw error;
    }
  }
}

export default PDFGenerator;
