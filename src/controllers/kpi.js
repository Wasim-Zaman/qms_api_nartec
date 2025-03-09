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
      // Get today's date (end date)
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // End of current day

      // Get start date (7 days ago)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // -6 to include today
      startDate.setHours(0, 0, 0, 0); // Start of day

      // Get all patients created in the date range
      const patients = await prisma.patient.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc", // Changed to desc to match the date order
        },
      });

      // Create an array of dates from today backwards
      const dateRange = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        return date;
      }); // No need for reverse() as we're already counting backwards

      // Group patients by date
      const trend = dateRange.map((date) => {
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

  static async getEyeballToTriageTime(req, res, next) {
    try {
      // Get data for the last 30 days by default, or use query param
      const days = parseInt(req.query.days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const patients = await prisma.patient.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          vitalSigns: {
            some: {
              timeVs: {
                not: null,
              },
            },
          },
        },
        select: {
          id: true,
          createdAt: true, // eyeball time
          vitalSigns: {
            select: {
              timeVs: true,
            },
            where: {
              timeVs: {
                not: null,
              },
            },
            take: 1,
            orderBy: {
              timeVs: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Calculate time difference in minutes for each patient
      const timeData = patients
        .map((patient) => {
          const eyeballTime = new Date(patient.createdAt);
          const triageTime = new Date(patient.vitalSigns[0]?.timeVs);
          const diffInMinutes = (triageTime - eyeballTime) / (1000 * 60);

          return {
            patientId: patient.id,
            eyeballTime: eyeballTime.toISOString(),
            triageTime: triageTime.toISOString(),
            timeToTriage: Math.round(diffInMinutes),
          };
        })
        .filter((data) => !isNaN(data.timeToTriage)); // Filter out invalid calculations

      // Add statistics
      const stats = {
        totalPatients: timeData.length,
        averageTime: Math.round(
          timeData.reduce((acc, curr) => acc + curr.timeToTriage, 0) /
            timeData.length
        ),
        minTime: Math.min(...timeData.map((d) => d.timeToTriage)),
        maxTime: Math.max(...timeData.map((d) => d.timeToTriage)),
      };

      res.status(200).json(
        response(
          200,
          true,
          "Eyeball to triage time data retrieved successfully",
          {
            timeData,
            stats,
          }
        )
      );
    } catch (error) {
      console.error("Error in getEyeballToTriageTime:", error);
      next(error);
    }
  }

  static async getHourlyPatientFlow(req, res, next) {
    try {
      const date = req.query.date ? new Date(req.query.date) : new Date();
      date.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const patients = await prisma.patient.findMany({
        where: {
          createdAt: {
            gte: date,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Group by hour (0-23)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: patients.filter((p) => new Date(p.createdAt).getHours() === hour)
          .length,
      }));

      res.status(200).json(
        response(200, true, "Hourly patient flow retrieved", {
          date: date.toISOString().split("T")[0],
          data: hourlyData,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentPerformance(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const patients = await prisma.patient.findMany({
        where: {
          createdAt: { gte: startDate },
          departmentId: { not: null },
          beginTime: { not: null },
          endTime: { not: null },
        },
        select: {
          departmentId: true,
          beginTime: true,
          endTime: true,
          department: {
            select: {
              deptname: true,
            },
          },
        },
      });

      const departmentStats = patients.reduce((acc, patient) => {
        const deptId = patient.departmentId;
        if (!acc[deptId]) {
          acc[deptId] = {
            departmentName: patient.department?.deptname || "Unknown",
            totalPatients: 0,
            avgServiceTime: 0,
            totalServiceTime: 0,
          };
        }

        const serviceTime =
          (new Date(patient.endTime) - new Date(patient.beginTime)) /
          (1000 * 60); // in minutes
        acc[deptId].totalPatients++;
        acc[deptId].totalServiceTime += serviceTime;
        acc[deptId].avgServiceTime =
          acc[deptId].totalServiceTime / acc[deptId].totalPatients;

        return acc;
      }, {});

      res.status(200).json(
        response(200, true, "Department performance retrieved", {
          timeRange: `Last ${days} days`,
          departments: Object.values(departmentStats),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPatientWaitingTimes(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const patients = await prisma.patient.findMany({
        where: {
          createdAt: { gte: startDate },
          firstCallTime: { not: null },
        },
        select: {
          createdAt: true,
          firstCallTime: true,
          departmentId: true,
          department: {
            select: {
              deptname: true,
            },
          },
        },
      });

      const waitingTimesByDay = patients.reduce((acc, patient) => {
        const date = new Date(patient.createdAt).toISOString().split("T")[0];
        const waitTime =
          (new Date(patient.firstCallTime) - new Date(patient.createdAt)) /
          (1000 * 60);

        if (!acc[date]) {
          acc[date] = {
            avgWaitTime: 0,
            totalPatients: 0,
            totalWaitTime: 0,
            byDepartment: {},
          };
        }

        // Overall statistics
        acc[date].totalPatients++;
        acc[date].totalWaitTime += waitTime;
        acc[date].avgWaitTime =
          acc[date].totalWaitTime / acc[date].totalPatients;

        // Department-wise statistics
        const deptId = patient.departmentId;
        if (deptId) {
          if (!acc[date].byDepartment[deptId]) {
            acc[date].byDepartment[deptId] = {
              departmentName: patient.department?.deptname || "Unknown",
              avgWaitTime: 0,
              totalPatients: 0,
              totalWaitTime: 0,
            };
          }
          acc[date].byDepartment[deptId].totalPatients++;
          acc[date].byDepartment[deptId].totalWaitTime += waitTime;
          acc[date].byDepartment[deptId].avgWaitTime =
            acc[date].byDepartment[deptId].totalWaitTime /
            acc[date].byDepartment[deptId].totalPatients;
        }

        return acc;
      }, {});

      res.status(200).json(
        response(200, true, "Patient waiting times retrieved", {
          timeRange: `Last ${days} days`,
          data: waitingTimesByDay,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export default KPIController;
