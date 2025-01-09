import Joi from "joi";

export const userSchema = Joi.object({
  userid: Joi.string().optional(),
  password: Joi.string().optional(),
  name: Joi.string().optional(),
  deptcode: Joi.string().optional(),
});
