import Joi from "joi";

export const patientStatus = ["Non-urgent", "Urgent", "Critical"];

export const createPatientSchema = Joi.object({
  name: Joi.string().required(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string().valid("M", "F", "O").allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string()
    .valid(...patientStatus)
    .default("Non-urgent"),
  state: Joi.number().integer().min(0).max(2).default(0),
  callPatient: Joi.boolean().default(false),
});

export const updatePatientSchema = Joi.object({
  name: Joi.string(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string().valid("M", "F", "O").allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string().valid(...patientStatus),
  state: Joi.number().integer().min(0).max(2).allow(null, ""),
  callPatient: Joi.boolean().allow(null, ""),
});
