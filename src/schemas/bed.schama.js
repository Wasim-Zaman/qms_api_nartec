import Joi from "joi";

export const createBedSchema = Joi.object({
  bedNumber: Joi.string().required(),
  bedStatus: Joi.string().valid("Available", "Occupied", "Under Maintenance").default("Available"),
});