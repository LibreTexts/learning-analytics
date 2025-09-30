import adaptCourses from "#mongodb/adaptCourses";
import { Types } from "mongoose";
import { CourseConnectorService } from "./course_connector_service.js";
import user, { IUser } from "#mongodb/user";
import logger from "@adonisjs/core/services/logger";

export class AuthService {
  async createExternalUser(
    id: string | number,
    role: number,
    course_id: string | number
  ): Promise<IUser | null> {
    try {
      const _id = new Types.ObjectId();
      const toCreate = new user({
        _id: _id,
        user_id: id.toString(),
        role: role === 2 ? "instructor" : "student",
        courses: [course_id.toString()],
      });

      await toCreate.save();

      return toCreate;
    } catch (err) {
      logger.error(err);
      return null;
    }
  };

  async ensureAdaptCourse(
    course_id: number
  ) {
    try {
      const found = await adaptCourses.findOne({
        course_id: course_id.toString(),
      });
      if (found) return;

      const adaptConn = new CourseConnectorService(course_id.toString());
      const courseRes = await adaptConn.getCourseMiniSummary();
      if (
        !courseRes ||
        courseRes.data.type !== "success" ||
        !courseRes.data["mini-summary"]
      ) {
        throw new Error("Failed to fetch course data");
      }

      const courseData = courseRes.data["mini-summary"];
      const _id = new Types.ObjectId();
      const toCreate = new adaptCourses({
        _id,
        course_id: course_id.toString(),
        instructor_id: courseData.user_id,
        name: courseData.name,
        start_date: courseData.start_date,
        end_date: courseData.end_date,
        textbook_url: courseData.textbook_url ?? "",
        is_in_adapt: true,
      });

      await toCreate.save();
    } catch (err) {
      logger.error(err);
    }
  };

  async addCourseToUser(user_id: string, course_id: string) {
    try {

      const existing = await user.findOne({
        user_id: user_id.toString(),
      })
      if (!existing) {
        throw new Error(`User with ID ${user_id} not found`);
      }

      // Always place the current course_id at the end of the list
      const coursesSet = new Set<string>(existing.courses);
      if (coursesSet.has(course_id.toString())) {
        coursesSet.delete(course_id.toString());
      }

      coursesSet.add(course_id.toString());

      await user.updateOne(
        { user_id: user_id.toString() },
        {
          $set: { courses: Array.from(coursesSet) },
        }
      );
    } catch (err) {
      logger.error(err);
    }
  }
}