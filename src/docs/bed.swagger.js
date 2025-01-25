/**
 * @swagger
 * components:
 *   schemas:
 *     Bed:
 *       type: object
 *       required:
 *         - bedNumber
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the bed
 *         bedNumber:
 *           type: string
 *           description: Unique bed number
 *         bedStatus:
 *           type: string
 *           description: Current status of the bed (Available/Occupied)
 *         patient:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Patient'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /api/v1/beds:
 *   post:
 *     summary: Create a new bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bedNumber
 *             properties:
 *               bedNumber:
 *                 type: string
 *               bedStatus:
 *                 type: string
 *                 enum: [Available, Occupied]
 *     responses:
 *       201:
 *         description: Bed created successfully
 *       409:
 *         description: Bed number already exists
 *
 *   get:
 *     summary: Get all beds with pagination and filters
 *     tags: [Beds]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Occupied]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Beds retrieved successfully
 *
 * /api/v1/beds/{id}:
 *   get:
 *     summary: Get bed by ID
 *     tags: [Beds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bed retrieved successfully
 *       404:
 *         description: Bed not found
 *
 *   put:
 *     summary: Update bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bedNumber:
 *                 type: string
 *               bedStatus:
 *                 type: string
 *                 enum: [Available, Occupied]
 *     responses:
 *       200:
 *         description: Bed updated successfully
 *       404:
 *         description: Bed not found
 *       409:
 *         description: Bed number already taken
 *
 *   delete:
 *     summary: Delete bed
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bed deleted successfully
 *       404:
 *         description: Bed not found
 *
 * /api/v1/beds/all:
 *   get:
 *     summary: Get all beds without pagination
 *     tags: [Beds]
 *     description: Retrieve a list of all beds ordered by bed number
 *     responses:
 *       200:
 *         description: All beds retrieved successfully
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
 *                   example: "All beds retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The bed's ID
 *                       bedNumber:
 *                         type: string
 *                         description: The bed number
 *                       bedStatus:
 *                         type: string
 *                         description: Current status of the bed (Available/Occupied)
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       patient:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             status:
 *                               type: string
 *       500:
 *         description: Server error
 */
