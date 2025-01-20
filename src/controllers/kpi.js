import prisma from "../utils/prismaClient.js";
import response from "../utils/response.js";

class KPIController {
  static async getPatientCounts(req, res, next) {
    try {
      // Get counts for each department
      const departmentCounts = await prisma.patient.groupBy({
        by: ["departmentId"],
        _count: {
          id: true,
        },
        where: {
          departmentId: {
            not: null,
          },
        },
      });

      // Get department details
      const departments = await prisma.tblDepartment.findMany({
        where: {
          tblDepartmentID: {
            in: departmentCounts.map((dc) => dc.departmentId),
          },
        },
      });

      // Combine counts with department names
      const result = departmentCounts.map((dc) => {
        const dept = departments.find(
          (d) => parseInt(d.tblDepartmentID) === parseInt(dc.departmentId)
        );
        return {
          departmentId: dc.departmentId,
          departmentCode: dept?.deptcode || "Unknown",
          departmentName: dept?.deptname || "Unknown",
          patientCount: dc._count.id,
        };
      });

      // Get total patients count
      const totalPatients = await prisma.patient.count();

      // Get counts by state
      const stateWiseCounts = await prisma.patient.groupBy({
        by: ["state"],
        _count: {
          id: true,
        },
      });

      const kpiData = {
        totalPatients,
        departmentWise: result,
        stateWise: {
          waiting: stateWiseCounts.find((s) => s.state === 0)?._count.id || 0,
          serving: stateWiseCounts.find((s) => s.state === 1)?._count.id || 0,
          served: stateWiseCounts.find((s) => s.state === 2)?._count.id || 0,
        },
      };

      res
        .status(200)
        .json(response(200, true, "KPI data retrieved successfully", kpiData));
    } catch (error) {
      next(error);
    }
  }

  static async getPatientRegistrationTrend(req, res, next) {
    try {
      // Get the date 7 days ago from now
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today
      sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day

      // Get all patients created in the last 7 days
      const patients = await prisma.patient.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Create an array of the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        return date;
      }).reverse();

      // Group patients by date
      const trend = last7Days.map((date) => {
        // Count patients for this date
        const dayCount = patients.filter((patient) => {
          const patientDate = new Date(patient.createdAt);
          return (
            patientDate.getDate() === date.getDate() &&
            patientDate.getMonth() === date.getMonth() &&
            patientDate.getFullYear() === date.getFullYear()
          );
        }).length;

        return {
          date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
          count: dayCount,
          formattedDate: date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
          }), // Format as MM/DD
        };
      });

      res.status(200).json(
        response(
          200,
          true,
          "Patient registration trend retrieved successfully",
          {
            trend,
            totalPatients: patients.length,
            averageDaily: Math.round(patients.length / 7),
          }
        )
      );
    } catch (error) {
      console.error("Error in getPatientRegistrationTrend:", error);
      next(error);
    }
  }
}

export default KPIController;
