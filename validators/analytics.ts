import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(100),
});

export const _CourseIDSchema = z.object({
  courseID: z.string(),
});

export const GetAssignmentsSchema = z.object({
  query: _CourseIDSchema,
});

export const GetStudentsSchema = z.object({
  query: _CourseIDSchema.merge(PaginationSchema),
});
