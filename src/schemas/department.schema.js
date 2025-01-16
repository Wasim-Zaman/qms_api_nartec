import Joi from "joi";

export const createDepartmentSchema = Joi.object({
  deptcode: Joi.string().max(10).required(),
  deptname: Joi.string().max(50).required(),
});

export const updateDepartmentSchema = Joi.object({
  deptcode: Joi.string().max(10),
  deptname: Joi.string().max(50),
}).min(1);
