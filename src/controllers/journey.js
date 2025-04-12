import path from "path";
import xlsx from "xlsx";
import MyError from "../utils/error.js";
import { deleteFile, ensureDir, ensureRequiredDirs } from "../utils/file.js";
import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class JourneyController {
  static async getActiveJourneys(req, res, next) {
    try {
      // Parse query parameters with defaults
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "updatedAt",
        order = "desc",
        startDate,
        endDate,
      } = req.query;

      const skip = (page - 1) * limit;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Build where condition
      const whereCondition = {
        OR: [{ createdAt: { gte: today } }, { updatedAt: { gte: today } }],
      };

      // Add search condition if provided
      if (search) {
        whereCondition.OR = [
          {
            patient: {
              OR: [
                { id: { contains: search } },
                { name: { contains: search } },
                { mrnNumber: { contains: search } },
              ],
            },
          },
        ];
      }

      // Add date range filter if provided
      if (startDate) {
        whereCondition.createdAt = {
          ...(whereCondition.createdAt || {}),
          gte: new Date(startDate),
        };
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereCondition.createdAt = {
          ...(whereCondition.createdAt || {}),
          lte: endDateTime,
        };
      }

      // Get total count for pagination
      const total = await prisma.journey.count({ where: whereCondition });

      // Get journeys with filtering, sorting and pagination
      const journeys = await prisma.journey.findMany({
        where: whereCondition,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              mrnNumber: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: Number(limit),
      });

      const totalPages = Math.ceil(total / limit);

      // First sort journeys by updatedAt in descending order (newest first)
      // Then filter to keep only the first occurrence of each patientId
      // This ensures we keep the latest journey for each patient
      const uniqueJourneys = journeys
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .filter(
          (journey, index, self) =>
            index === self.findIndex((t) => t.patientId === journey.patientId)
        );

      // unique total
      const uniqueTotal = uniqueJourneys.length;

      // unique total pages
      const uniqueTotalPages = Math.ceil(uniqueTotal / limit);

      res.status(200).json(
        response(200, true, "Active journeys retrieved successfully", {
          data: journeys,
          pagination: {
            // total: uniqueTotal,
            total: total,
            page: Number(page),
            limit: Number(limit),
            totalPages: totalPages,
            hasMore: page < totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async exportJourneysToExcel(req, res, next) {
    try {
      // Get journeys with patient details
      const journeys = await prisma.journey.findMany({
        include: {
          patient: {
            select: {
              name: true,
              mrnNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform data for Excel
      const excelData = journeys.map((journey) => ({
        "Journey ID": journey.id,
        "Patient Name": journey.patient?.name || "N/A",
        "MRN Number": journey.patient?.mrnNumber || "N/A",
        "Registration Time": journey.createdAt
          ? new Date(journey.createdAt).toLocaleString()
          : "N/A",
        "First Call Time": journey.firstCallTime
          ? new Date(journey.firstCallTime).toLocaleString()
          : "N/A",
        "Vital Signs Time": journey.vitalTime
          ? new Date(journey.vitalTime).toLocaleString()
          : "N/A",
        "Department Assigned Time": journey.assignDeptTime
          ? new Date(journey.assignDeptTime).toLocaleString()
          : "N/A",
        "Second Call Time": journey.secondCallTime
          ? new Date(journey.secondCallTime).toLocaleString()
          : "N/A",
        "Treatment Begin Time": journey.beginTime
          ? new Date(journey.beginTime).toLocaleString()
          : "N/A",
        "Treatment End Time": journey.endTime
          ? new Date(journey.endTime).toLocaleString()
          : "N/A",
      }));

      // Create workbook and worksheet
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);

      // Add worksheet to workbook
      xlsx.utils.book_append_sheet(workbook, worksheet, "Patient Journeys");

      // Ensure dir
      await ensureDir("uploads/exports");

      // Generate Excel file
      const exportPath = path.join(process.cwd(), "uploads", "exports");
      await ensureRequiredDirs(exportPath);

      const fileName = `patient_journeys_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const filePath = path.join(exportPath, fileName);

      // Write file
      xlsx.writeFile(workbook, filePath);

      // Send file to client
      res.download(filePath, fileName, async (err) => {
        if (err) {
          throw new MyError("Error downloading file", 500);
        }
        // Optionally delete the file after sending
        await deleteFile(filePath);
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPreviousJourneys(req, res, next) {
    try {
      // Parse query parameters with defaults
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        order = "desc",
        startDate,
        endDate,
      } = req.query;

      // Get today's date at 00:00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Build search conditions
      const searchCondition = {
        AND: [
          // Exclude journeys created or updated today

          // where endTime is not null
          {
            endTime: {
              not: null,
            },
          },
          {
            NOT: {
              //   OR: [
              //     { createdAt: { gte: today } },
              //     { updatedAt: { gte: today } },
              //   ],
            },
          },
        ],
      };

      // Add date range filter if provided
      if (startDate) {
        searchCondition.AND.push({
          createdAt: { gte: new Date(startDate) },
        });
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        searchCondition.AND.push({
          createdAt: { lte: endDateTime },
        });
      }

      // Add search functionality
      if (search) {
        searchCondition.AND.push({
          OR: [
            {
              patient: {
                name: { contains: search },
              },
            },
            {
              patient: {
                mrnNumber: { contains: search },
              },
            },
          ],
        });
      }

      // Get total count
      const total = await prisma.journey.count({
        where: searchCondition,
      });

      // Get journeys with pagination
      const journeys = await prisma.journey.findMany({
        where: searchCondition,
        include: {
          patient: {
            select: {
              name: true,
              mrnNumber: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: {
          [sortBy]: order,
        },
      });

      const totalPages = Math.ceil(total / limit);

      res.status(200).json(
        response(200, true, "Previous journeys retrieved successfully", {
          journeys,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasMore: page < totalPages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getJourneysByPatientId(req, res, next) {
    try {
      const { patientId } = req.params;

      const journeys = await prisma.journey.findMany({
        where: { patientId },
        include: {
          patient: {
            select: {
              name: true,
              mrnNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res
        .status(200)
        .json(response(200, true, "Journeys retrieved successfully", journeys));
    } catch (error) {
      next(error);
    }
  }
}
export default JourneyController;
