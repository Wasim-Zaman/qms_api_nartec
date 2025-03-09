/**
 * @swagger
 * tags:
 *   name: Journeys
 *   description: Journey management APIs
 */

/**
 * @swagger
 * /api/v1/journeys/active:
 *   get:
 *     summary: Get active journeys created or updated today
 *     tags: [Journeys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active journeys retrieved successfully
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
 *                   example: Active journeys retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       registrationTime:
 *                         type: string
 *                         format: date-time
 *                       firstCallTime:
 *                         type: string
 *                         format: date-time
 *                       vitalSignsTime:
 *                         type: string
 *                         format: date-time
 *                       departmentAssignmentTime:
 *                         type: string
 *                         format: date-time
 *                       secondCallTime:
 *                         type: string
 *                         format: date-time
 *                       beginTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       patient:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           mrnNumber:
 *                             type: string
 *                           age:
 *                             type: integer
 *                           sex:
 *                             type: string
 *                           department:
 *                             type: object
 *                             properties:
 *                               deptname:
 *                                 type: string
 *                           bed:
 *                             type: object
 *                             properties:
 *                               bedNumber:
 *                                 type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/journeys/previous:
 *   get:
 *     summary: Get previous journeys (excluding those created or updated today)
 *     tags: [Journeys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name or MRN number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Previous journeys retrieved successfully
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
 *                   example: Previous journeys retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     journeys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           registrationTime:
 *                             type: string
 *                             format: date-time
 *                           firstCallTime:
 *                             type: string
 *                             format: date-time
 *                           vitalSignsTime:
 *                             type: string
 *                             format: date-time
 *                           departmentAssignmentTime:
 *                             type: string
 *                             format: date-time
 *                           secondCallTime:
 *                             type: string
 *                             format: date-time
 *                           beginTime:
 *                             type: string
 *                             format: date-time
 *                           endTime:
 *                             type: string
 *                             format: date-time
 *                           patient:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               mrnNumber:
 *                                 type: string
 *                               age:
 *                                 type: integer
 *                               sex:
 *                                 type: string
 *                               department:
 *                                 type: object
 *                                 properties:
 *                                   deptname:
 *                                     type: string
 *                               bed:
 *                                 type: object
 *                                 properties:
 *                                   bedNumber:
 *                                     type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/journeys/export:
 *   get:
 *     summary: Export all journeys to Excel
 *     tags: [Journeys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
