/**
 * @swagger
 * /api/v1/kpi/patient-counts:
 *   get:
 *     summary: Get patient counts by department and state
 *     tags: [KPI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KPI data retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: number
 *                       example: 150
 *                     departmentWise:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           departmentId:
 *                             type: string
 *                             example: "1"
 *                           departmentCode:
 *                             type: string
 *                             example: "CARD"
 *                           departmentName:
 *                             type: string
 *                             example: "Cardiology"
 *                           patientCount:
 *                             type: number
 *                             example: 45
 *                     stateWise:
 *                       type: object
 *                       properties:
 *                         waiting:
 *                           type: number
 *                           example: 50
 *                         serving:
 *                           type: number
 *                           example: 30
 *                         served:
 *                           type: number
 *                           example: 70
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/kpi/registration-trend:
 *   get:
 *     summary: Get patient registration trend for the past 7 days
 *     tags: [KPI]
 *     responses:
 *       200:
 *         description: Patient registration trend retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Patient registration trend retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2024-03-20"
 *                       count:
 *                         type: integer
 *                         example: 15
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 data:
 *                   type: null
 */
