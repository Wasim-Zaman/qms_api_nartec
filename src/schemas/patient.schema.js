import Joi from "joi";

export const patientStatus = ["Non-urgent", "Urgent", "Critical"];
export const patientState = [0, 1, 2]; // --> 0: Waiting, 1: Serving, 2: Served
export const patientSex = ["M", "F"]; // --> M: Male, F: Female
export const patientCall = ["first", "second"]; // --> first: First Call, second: Second Call
export const createPatientSchema = Joi.object({
  name: Joi.string().required(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string()
    .valid(...patientSex)
    .allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string()
    .valid(...patientStatus)
    .default("Non-urgent"),
  state: Joi.number()
    .integer()
    .valid(...patientState)
    .default(0),
  callPatient: Joi.boolean().default(false),
  bloodGroup: Joi.string().allow(null, ""),
  birthDate: Joi.date().allow(null, ""),
  mrnNumber: Joi.string().allow(null, ""),
});

export const updatePatientSchema = Joi.object({
  name: Joi.string(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string()
    .valid(...patientSex)
    .allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string().valid(...patientStatus),
  state: Joi.number()
    .integer()
    .valid(...patientState)
    .allow(null, ""),
  callPatient: Joi.boolean().allow(null, ""),
  bloodGroup: Joi.string().allow(null, ""),
  birthDate: Joi.date().allow(null, ""),
  mrnNumber: Joi.string().allow(null, ""),
});

// VitalSign

export const createVitalSignSchema = Joi.object({
  bp: Joi.string().allow(null, ""),
  height: Joi.string().allow(null, ""),
  temp: Joi.string().allow(null, ""),
  spo2: Joi.string().allow(null, ""),
  weight: Joi.string().allow(null, ""),
  hr: Joi.string().allow(null, ""),
  rbs: Joi.string().allow(null, ""),
  rr: Joi.string().allow(null, ""),
  timeVs: Joi.date().allow(null, ""),
  allergies: Joi.boolean().allow(null, ""),
});

export const assignDepartmentSchema = Joi.object({
  departmentId: Joi.number().required(),
});

export const assignBedSchema = Joi.object({
  bedId: Joi.string().required(),
});

export const beginTimeSchema = Joi.object({
  beginTime: Joi.date().allow(null, ""),
});

export const endTimeSchema = Joi.object({
  endTime: Joi.date().allow(null, ""),
});

export const getPatientsByDepartmentSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10),
  deptId: Joi.number().required(),
});

export const dischargePatientSchema = Joi.object({
  remarks: Joi.string().required(),
});

export const callPatientSchema = Joi.object({
  call: Joi.string()
    .valid(...patientCall)
    .optional(),
});

export const searchPatientSchema = Joi.object({
  searchKey: Joi.string().required().messages({
    "any.required":
      "Please provide a search key (MRN, mobile number, or Iqama/Resident number)",
    "string.empty": "Search key cannot be empty",
  }),
});

export const getPatientJourneysSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).default(10),
  search: Joi.string().allow("", null),
  sortBy: Joi.string()
    .valid(
      "createdAt",
      "name",
      "age",
      "firstCallTime",
      "vitalTime",
      "assignDeptTime",
      "secondCallTime",
      "beginTime",
      "endTime"
    )
    .default("createdAt"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  // Add filters
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")),
  state: Joi.number().valid(0, 1, 2), // Waiting, Serving, Served
  status: Joi.string().valid("Non-urgent", "Urgent", "Critical"),
  sex: Joi.string().valid("M", "F"),
  departmentId: Joi.number(),
  age: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(Joi.ref("min")),
  }),
  hasVitalSigns: Joi.boolean(),
  hasBed: Joi.boolean(),
});
