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
 *         journeyTimes:
 *           type: object
 *           properties:
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T08:00:00Z"
 *               description: Initial registration timestamp
 *             firstCallTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T08:05:00Z"
 *               description: First call to waiting area timestamp
 *             vitalTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T08:15:00Z"
 *               description: Vital signs collection timestamp
 *             assignDeptTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T08:30:00Z"
 *               description: Department assignment timestamp
 *             secondCallTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T08:45:00Z"
 *               description: Second call to treatment area timestamp
 *             beginTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T09:00:00Z"
 *               description: Treatment start timestamp
 *             endTime:
 *               type: string
 *               format: date-time
 *               example: "2024-03-20T10:00:00Z"
 *               description: Treatment completion timestamp
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
 *                 description: Patient's full name
 *               nationality:
 *                 type: string
 *                 description: Patient's nationality
 *               sex:
 *                 type: string
 *                 enum: [M, F, O]
 *                 description: Patient's gender (M=Male, F=Female, O=Other)
 *               idNumber:
 *                 type: string
 *                 description: Patient's ID number
 *               age:
 *                 type: integer
 *                 description: Patient's age
 *               mobileNumber:
 *                 type: string
 *                 description: Patient's contact number
 *               status:
 *                 type: string
 *                 enum: [Non-urgent, Urgent, Critical]
 *                 description: Patient's urgency status
 *               cheifComplaint:
 *                 type: string
 *                 description: Patient's main medical complaint
 *               bloodGroup:
 *                 type: string
 *                 description: Patient's blood group
 *               birthDate:
 *                 type: string
 *                 format: date-time
 *                 description: Patient's date of birth
 *               mrnNumber:
 *                 type: string
 *                 description: Medical Record Number
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Patient created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Auto-generated UUID
 *                     name:
 *                       type: string
 *                     nationality:
 *                       type: string
 *                     sex:
 *                       type: string
 *                     idNumber:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     mobileNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     cheifComplaint:
 *                       type: string
 *                     ticket:
 *                       type: string
 *                     ticketNumber:
 *                       type: integer
 *                     barcode:
 *                       type: string
 *                     bloodGroup:
 *                       type: string
 *                     birthDate:
 *                       type: string
 *                       format: date-time
 *                     mrnNumber:
 *                       type: string
 *                     departmentId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     bedId:
 *                       type: string
 *                     state:
 *                       type: integer
 *                       example: 0
 *                     callPatient:
 *                       type: boolean
 *                       example: false
 *                     beginTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
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
 *       500:
 *         description: Server error
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
 *     summary: Get patients by state (waiting/in-progress) with optional department filter
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *         description: Department code to filter patients (optional)
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           state:
 *                             type: integer
 *                             example: 0
 *                           department:
 *                             type: object
 *                             properties:
 *                               tblDepartmentID:
 *                                 type: string
 *                                 example: "1"
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
 *                     inProgress:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174001"
 *                           name:
 *                             type: string
 *                             example: "Jane Doe"
 *                           state:
 *                             type: integer
 *                             example: 1
 *                           department:
 *                             type: object
 *                             properties:
 *                               tblDepartmentID:
 *                                 type: string
 *                                 example: "1"
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
 *                     counts:
 *                       type: object
 *                       properties:
 *                         waiting:
 *                           type: integer
 *                           example: 5
 *                           description: Number of waiting patients
 *                         inProgress:
 *                           type: integer
 *                           example: 3
 *                           description: Number of in-progress patients
 *                         total:
 *                           type: integer
 *                           example: 8
 *                           description: Total number of patients (waiting + in-progress)
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *                   example: "Internal server error"
 *                 data:
 *                   type: null
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
 *
 * @swagger
 * /api/v1/patients/{id}/assign-bed:
 *   patch:
 *     summary: Assign a bed to a patient
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
 *               - bedId
 *             properties:
 *               bedId:
 *                 type: string
 *                 description: ID of the bed to assign
 *     responses:
 *       200:
 *         description: Bed assigned successfully
 *       400:
 *         description: Bed is already occupied
 *       404:
 *         description: Patient or bed not found
 *
 * @swagger
 * /api/v1/patients/{id}/begin-time:
 *   patch:
 *     summary: Set patient begin time
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
 *         description: Begin time set successfully
 *       404:
 *         description: Patient not found
 *
 * @swagger
 * /api/v1/patients/{id}/end-time:
 *   patch:
 *     summary: Set patient end time and free up assigned bed
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
 *         description: End time set successfully
 *       404:
 *         description: Patient not found
 *
 * @swagger
 * /api/v1/patients/by-department:
 *   get:
 *     summary: Get patients by department
 *     tags: [Patients]
 *     description: Retrieve a paginated list of patients filtered by department ID with optional search
 *     parameters:
 *       - in: query
 *         name: deptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID to filter patients
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
 *         description: Search term to filter patients by name, ticket, chief complaint, or mobile number
 *     responses:
 *       200:
 *         description: Successfully retrieved patients
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Patient ID
 *                       name:
 *                         type: string
 *                         description: Patient name
 *                       ticket:
 *                         type: string
 *                         description: Patient ticket number
 *                       cheifComplaint:
 *                         type: string
 *                         description: Patient's chief complaint
 *                       mobileNumber:
 *                         type: string
 *                         description: Patient's mobile number
 *                       departmentId:
 *                         type: string
 *                         description: Department ID
 *                       department:
 *                         type: object
 *                         description: Department details
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request - Invalid parameters
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
 *                   example: "Validation error message"
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
 *                   example: "Internal server error"
 *
 * @swagger
 * /api/v1/patients/search:
 *   get:
 *     summary: Search for a specific patient by ID number or mobile number
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: idNumber
 *         schema:
 *           type: string
 *         description: Patient's exact ID number (optional if mobile number is provided)
 *       - in: query
 *         name: mobileNumber
 *         schema:
 *           type: string
 *         description: Patient's exact mobile number (optional if ID number is provided)
 *     responses:
 *       200:
 *         description: Patient found successfully
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
 *                   example: Patient retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     nationality:
 *                       type: string
 *                     idNumber:
 *                       type: string
 *                     mobileNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     department:
 *                       type: object
 *                     user:
 *                       type: object
 *                     bed:
 *                       type: object
 *                     vitalSigns:
 *                       type: array
 *       400:
 *         description: Bad request - Missing search parameters
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 *
 * @swagger
 * /api/v1/patients/re-register/{id}:
 *   post:
 *     summary: Re-register an existing patient with a new ticket and reset their state
 *     description: Re-registers a patient by updating their information, resetting state to waiting (0), generating new ticket and barcode, and assigning to TRIAGE department
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the existing patient to re-register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Patient's full name
 *               nationality:
 *                 type: string
 *                 description: Patient's nationality
 *               sex:
 *                 type: string
 *                 enum: [M, F, O]
 *                 description: Patient's gender
 *               idNumber:
 *                 type: string
 *                 description: Patient's ID number
 *               age:
 *                 type: integer
 *                 description: Patient's age
 *               mobileNumber:
 *                 type: string
 *                 description: Patient's contact number
 *               cheifComplaint:
 *                 type: string
 *                 description: Patient's main medical complaint
 *               status:
 *                 type: string
 *                 enum: [Non-urgent, Urgent, Critical]
 *                 description: Patient's urgency status
 *     responses:
 *       201:
 *         description: Patient re-registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Patient re-registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     nationality:
 *                       type: string
 *                     sex:
 *                       type: string
 *                     idNumber:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     mobileNumber:
 *                       type: string
 *                     cheifComplaint:
 *                       type: string
 *                     status:
 *                       type: string
 *                     state:
 *                       type: integer
 *                       example: 0
 *                     ticket:
 *                       type: string
 *                     barcode:
 *                       type: string
 *                     departmentId:
 *                       type: string
 *                     department:
 *                       type: object
 *                       properties:
 *                         tblDepartmentID:
 *                           type: string
 *                         deptname:
 *                           type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
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
 * /api/v1/patients/{id}/discharge:
 *   patch:
 *     summary: Discharge a patient and free up associated resources
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the patient to discharge
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 description: Discharge remarks/notes
 *                 example: "Patient discharged after full recovery"
 *     responses:
 *       200:
 *         description: Patient discharged successfully
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
 *                   example: Patient discharged successfully
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
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
 * /api/v1/patients/journeys:
 *   get:
 *     summary: Get paginated and filtered patient journey timelines
 *     tags: [Patients]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by patient name, MRN, ID, mobile, or complaint
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstCallTime, vitalTime, assignDeptTime, secondCallTime, beginTime, endTime]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (ISO format)
 *       - in: query
 *         name: state
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: Filter by patient state (0=Waiting, 1=Serving, 2=Served)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Non-urgent, Urgent, Critical]
 *         description: Filter by patient status
 *       - in: query
 *         name: sex
 *         schema:
 *           type: string
 *           enum: [M, F]
 *         description: Filter by patient sex
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *       - in: query
 *         name: age[min]
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Filter by minimum age
 *       - in: query
 *         name: age[max]
 *         schema:
 *           type: integer
 *         description: Filter by maximum age
 *       - in: query
 *         name: hasVitalSigns
 *         schema:
 *           type: boolean
 *         description: Filter patients with/without vital signs
 *       - in: query
 *         name: hasBed
 *         schema:
 *           type: boolean
 *         description: Filter patients with/without bed assignment
 *     responses:
 *       200:
 *         description: Patient journeys retrieved successfully
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
 *                   example: Patient journeys retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PatientJourney'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 *
 * @swagger
 * /api/v1/patients/{id}/void:
 *   patch:
 *     summary: Void a patient record and free up associated resources
 *     description: Marks a patient as voided, releases bed if assigned, and cleans up associated resources
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the patient to void
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time when the patient was voided (defaults to current time if not provided)
 *                 example: "2024-03-20T10:30:00Z"
 *     responses:
 *       200:
 *         description: Patient voided successfully
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
 *                   example: End time set successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     state:
 *                       type: integer
 *                       example: 3
 *                       description: Patient state (3 = voided)
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-20T10:30:00Z"
 *                     department:
 *                       $ref: '#/components/schemas/Department'
 *       400:
 *         description: Bad request - Invalid input data
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
 *                   example: Invalid request data
 *                 data:
 *                   type: null
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Patient not found
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
 */
