import { z } from "zod";

export const _CourseIDSchema = z.object({
  courseID: z.string(),
});

export const GetAssignmentsSchema = z.object({
  query: _CourseIDSchema,
});
