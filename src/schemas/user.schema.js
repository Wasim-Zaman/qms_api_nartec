import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  deptcode: Joi.string().required(),
});

export const userSchema = Joi.object({
  email: Joi.string().optional(),
  password: Joi.string().optional(),
  name: Joi.string().optional(),
  deptcode: Joi.string().optional(),
});
