import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  route: Joi.string().optional(),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  route: Joi.string().optional(),
});

export const assignRoleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleIds: Joi.array().items(Joi.string().uuid()).required(),
});

export const removeRoleSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  roleId: Joi.string().uuid().required(),
});
