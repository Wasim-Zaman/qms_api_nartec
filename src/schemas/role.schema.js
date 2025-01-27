import Joi from "joi";

export const assignRoleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleIds: Joi.array().items(Joi.string().uuid()).required(),
});

export const removeRoleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleId: Joi.string().uuid().required(),
});
