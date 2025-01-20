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
}

export default KPIController;
