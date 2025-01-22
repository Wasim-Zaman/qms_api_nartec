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
 *           enum: [Non-urgent, Urgent, Critical]
 *           description: Patient's urgency status
 *         state:
 *           type: integer
 *           enum: [0, 1, 2]
 *           description: Patient's state (0=Waiting, 1=In Progress, 2=Completed)
 *         callPatient:
 *           type: boolean
 *           description: Whether patient has been called
 *         ticket:
 *           type: string
 *           description: Path to patient's ticket PDF
 *         barcode:
 *           type: string
 *           description: Barcode data for the ticket
 *         userId:
 *           type: string
 *           description: ID of the user who created the patient record
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
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
 *                 enum: [Non-urgent, Urgent, Critical]
 *                 default: Non-urgent
 *               state:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 default: 0
 *               callPatient:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Patient created successfully with ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *
 *   get:
 *     summary: Get all patients with pagination and search
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
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
 *         description: Search term for filtering patients (searches across name, nationality, ID, ticket, complaint, mobile)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, name, nationality, idNumber, ticket]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
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
 *                   example: Patients retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           nationality:
 *                             type: string
 *                             example: "US"
 *                           sex:
 *                             type: string
 *                             example: "M"
 *                           idNumber:
 *                             type: string
 *                             example: "A123456"
 *                           age:
 *                             type: integer
 *                             example: 30
 *                           mobileNumber:
 *                             type: string
 *                             example: "+1234567890"
 *                           cheifComplaint:
 *                             type: string
 *                             example: "Headache"
 *                           ticket:
 *                             type: string
 *                             example: "T001"
 *                           state:
 *                             type: integer
 *                             example: 0
 *                           department:
 *                             type: object
 *                             properties:
 *                               deptcode:
 *                                 type: string
 *                                 example: "CARD"
 *                               deptname:
 *                                 type: string
 *                                 example: "Cardiology"
 *                           user:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Dr. Smith"
 *                               email:
 *                                 type: string
 *                                 example: "dr.smith@hospital.com"
 *                               deptcode:
 *                                 type: string
 *                                 example: "CARD"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid query parameters
 *                 data:
 *                   type: null
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
 *                 enum: [Non-urgent, Urgent, Critical]
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
 *
 * @swagger
 * /api/v1/patients/by-state:
 *   get:
 *     summary: Get all patients by state (waiting and in progress)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
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
 *                   example: "Patients retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     waiting:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Patient'
 *                     inProgress:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * @swagger
 * /api/v1/patients/{id}/vital-sign:
 *   post:
 *     summary: Create vital signs for a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bp:
 *                 type: string
 *                 description: Blood pressure
 *                 example: "120/80"
 *               height:
 *                 type: string
 *                 description: Height in cm
 *                 example: "175"
 *               temp:
 *                 type: string
 *                 description: Temperature in celsius
 *                 example: "37.5"
 *               spo2:
 *                 type: string
 *                 description: Oxygen saturation percentage
 *                 example: "98"
 *               weight:
 *                 type: string
 *                 description: Weight in kg
 *                 example: "75"
 *               hr:
 *                 type: string
 *                 description: Heart rate (beats per minute)
 *                 example: "72"
 *               rbs:
 *                 type: string
 *                 description: Random blood sugar
 *                 example: "110"
 *               rr:
 *                 type: string
 *                 description: Respiratory rate
 *                 example: "16"
 *               timeVs:
 *                 type: string
 *                 format: date-time
 *                 description: Time of vital signs measurement
 *                 example: "2024-03-20T10:30:00Z"
 *               allergies:
 *                 type: boolean
 *                 description: Whether patient has any allergies
 *                 example: false
 *     responses:
 *       200:
 *         description: Vital signs created successfully
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
 *                   example: "Vital sign created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     patientId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174001"
 *                     bp:
 *                       type: string
 *                       example: "120/80"
 *                     height:
 *                       type: string
 *                       example: "175"
 *                     temp:
 *                       type: string
 *                       example: "37.5"
 *                     spo2:
 *                       type: string
 *                       example: "98"
 *                     weight:
 *                       type: string
 *                       example: "75"
 *                     hr:
 *                       type: string
 *                       example: "72"
 *                     rbs:
 *                       type: string
 *                       example: "110"
 *                     rr:
 *                       type: string
 *                       example: "16"
 *                     timeVs:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T10:30:00Z"
 *                     allergies:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 *
 * @swagger
 * /api/v1/patients/{id}/toggle-call:
 *   patch:
 *     summary: Toggle patient call status
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient call status toggled successfully
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
 *                   example: "Patient call status toggled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 *
 * @swagger
 * /api/v1/patients/called:
 *   get:
 *     summary: Get all patients that have been called
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of called patients retrieved successfully
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
 *                   example: "Called patients retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       nationality:
 *                         type: string
 *                         example: "US"
 *                       sex:
 *                         type: string
 *                         enum: [M, F, O]
 *                         example: "M"
 *                       idNumber:
 *                         type: string
 *                         example: "A123456"
 *                       age:
 *                         type: integer
 *                         example: 30
 *                       mobileNumber:
 *                         type: string
 *                         example: "+1234567890"
 *                       status:
 *                         type: string
 *                         enum: [Non-urgent, Urgent, Critical]
 *                         example: "Non-urgent"
 *                       cheifComplaint:
 *                         type: string
 *                         example: "Headache"
 *                       ticket:
 *                         type: string
 *                         example: "uploads/tickets/ticket-123.pdf"
 *                       barcode:
 *                         type: string
 *                         example: "base64-encoded-barcode-data"
 *                       state:
 *                         type: integer
 *                         example: 0
 *                       callPatient:
 *                         type: boolean
 *                         example: true
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Dr. Smith"
 *                           email:
 *                             type: string
 *                             example: "dr.smith@hospital.com"
 *                           deptcode:
 *                             type: string
 *                             example: "CARD"
 *                       vitalSigns:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/VitalSign'
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 *
 * @swagger
 * components:
 *   schemas:
 *     VitalSign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated UUID of the vital sign
 *         patientId:
 *           type: string
 *           description: ID of the associated patient
 *         bp:
 *           type: string
 *           description: Blood pressure
 *           example: "120/80"
 *         height:
 *           type: string
 *           description: Height in cm
 *           example: "175"
 *         temp:
 *           type: string
 *           description: Temperature in celsius
 *           example: "37.5"
 *         spo2:
 *           type: string
 *           description: Oxygen saturation percentage
 *           example: "98"
 *         weight:
 *           type: string
 *           description: Weight in kg
 *           example: "75"
 *         hr:
 *           type: string
 *           description: Heart rate (beats per minute)
 *           example: "72"
 *         rbs:
 *           type: string
 *           description: Random blood sugar
 *           example: "110"
 *         rr:
 *           type: string
 *           description: Respiratory rate
 *           example: "16"
 *         timeVs:
 *           type: string
 *           format: date-time
 *           description: Time of vital signs measurement
 *         allergies:
 *           type: boolean
 *           description: Whether patient has any allergies
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * @swagger
 * /api/v1/patients/{id}/assign-department:
 *   patch:
 *     summary: Assign department to a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departmentId
 *             properties:
 *               departmentId:
 *                 type: number
 *                 description: ID of the department to assign
 *     responses:
 *       200:
 *         description: Department assigned successfully
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
 *                   example: "Department assigned to patient successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Patient or Department not found
 *       500:
 *         description: Server error
 */
