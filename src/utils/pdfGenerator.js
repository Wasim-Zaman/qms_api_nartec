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
  // Utility function to format date time
  static formatDateTime(date) {
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  // Utility function to generate barcode text
  static generateBarcodeText(date, counter) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(date.getDate()).padStart(2, "0")}${String(
      date.getHours()
    ).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(
      date.getSeconds()
    ).padStart(2, "0")}${counter}`;
  }

  // Utility function to generate barcode buffer
  static async generateBarcodeBuffer(text) {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: "code128", // Barcode type
          text: text, // Text to encode
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
  }

  static async generateTicket(data) {
    try {
      const templatePath = path.join(__dirname, "../view/ticket.ejs");
      const templateContent = await fs.readFile(templatePath, "utf-8");

      // Format date for barcode and display
      const now = data.issueDate;
      const formattedDateTime = this.formatDateTime(now);
      const barcodeText = this.generateBarcodeText(now, data.counter);

      // Generate barcode using bwip-js
      const barcodeBuffer = await this.generateBarcodeBuffer(barcodeText);

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

  static async generateDepartmentTicket(data) {
    try {
      const templatePath = path.join(__dirname, "../view/departmentTicket.ejs");
      const templateContent = await fs.readFile(templatePath, "utf-8");

      // Format date for display
      const timeVs = data.vitalSigns?.timeVs
        ? this.formatDateTime(new Date(data.vitalSigns.timeVs))
        : "";

      const formattedDateTime = this.formatDateTime(new Date());

      // Generate barcode
      const barcodeText = this.generateBarcodeText(new Date(), data.counter);
      const barcodeBuffer = await this.generateBarcodeBuffer(barcodeText);
      const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString(
        "base64"
      )}`;

      // Generate ticket number format: {counter}+{first letter of department}
      const ticketNumber = `${data.ticketNumber}${
        data.department?.deptname?.[0]?.toUpperCase() || ""
      }${data.department?.deptname?.[1]?.toUpperCase() || ""}`;

      // Prepare template data
      const templateData = {
        deptname: data.department?.deptname || "",
        counter: data.ticketNumber,
        ticketNumber,
        name: data.name || "",
        age: data.age || "",
        gender: data.sex || "",
        nationality: data.nationality || "",
        timeVs,
        bp: data.vitalSigns?.bp || "",
        temp: data.vitalSigns?.temp || "",
        hr: data.vitalSigns?.hr || "",
        rr: data.vitalSigns?.rr || "",
        spo2: data.vitalSigns?.spo2 || "",
        rbs: data.vitalSigns?.rbs || "",
        height: data.vitalSigns?.height || "",
        weight: data.vitalSigns?.weight || "",
        allergies: data.vitalSigns?.allergies || false,
        complain: data.cheifComplaint || "",
        waiting: data.state || 0,
        barcode: barcodeBase64,
        barcodeText,
        formattedDateTime,
        waitingCount: data.waitingCount || 0,
      };

      const html = await ejs.render(templateContent, templateData, {
        async: true,
      });

      // Ensure uploads directory exists
      const uploadsDir = await ensureDir("uploads/tickets");

      // Generate unique filename
      const fileName = `department-ticket-${data.id}-${Date.now()}.pdf`;
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
        ticketNumber,
        barcodeText,
      };
    } catch (error) {
      console.error("Error generating department ticket:", error);
      throw error;
    }
  }
}

export default PDFGenerator;
