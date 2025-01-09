/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated UUID of the patient
 *         name:
 *           type: string
 *           description: Patient's full name
 *         nationality:
 *           type: string
 *           description: Patient's nationality
 *         sex:
 *           type: string
 *           enum: [M, F, O]
 *           description: Patient's gender (M=Male, F=Female, O=Other)
 *         idNumber:
 *           type: string
 *           description: Patient's ID number
 *         age:
 *           type: integer
 *           description: Patient's age
 *         mobileNumber:
 *           type: string
 *           description: Patient's contact number
 *         cheifComplaint:
 *           type: string
 *           description: Patient's main medical complaint
 *         status:
 *           type: string
 *           enum: [Active, Inactive, Pending]
 *           description: Patient's current status
 *         userId:
 *           type: string
 *           description: ID of the user who created the patient record
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the record was last updated
 *
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               nationality:
 *                 type: string
 *               sex:
 *                 type: string
 *                 enum: [M, F, O]
 *               idNumber:
 *                 type: string
 *               age:
 *                 type: integer
 *               mobileNumber:
 *                 type: string
 *               cheifComplaint:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending]
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 *
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get a patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nationality:
 *                 type: string
 *               sex:
 *                 type: string
 *                 enum: [M, F, O]
 *               idNumber:
 *                 type: string
 *               age:
 *                 type: integer
 *               mobileNumber:
 *                 type: string
 *               cheifComplaint:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive, Pending]
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
