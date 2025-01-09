import Joi from "joi";

export const createPatientSchema = Joi.object({
  name: Joi.string().required(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string().valid("M", "F", "O").allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string().valid("Active", "Inactive", "Pending").default("Active"),
});

export const updatePatientSchema = Joi.object({
  name: Joi.string(),
  nationality: Joi.string().allow(null, ""),
  sex: Joi.string().valid("M", "F", "O").allow(null, ""),
  idNumber: Joi.string().allow(null, ""),
  age: Joi.number().integer().min(0).allow(null),
  mobileNumber: Joi.string().allow(null, ""),
  cheifComplaint: Joi.string().allow(null, ""),
  status: Joi.string().valid("Active", "Inactive", "Pending"),
});
