import { Document, Schema, model, models } from "mongoose";

export interface IAdapt_Raw {
  anon_student_id: string;
  session_id: string;
  submission_time: string;
  review_time_start: string;
  review_time_end: string;
  assignment_id: string;
  assignment_name: string;
  assignment_group: string;
  assignment_scoring_type: string;
  assignment_points: string;
  number_of_attempts_allowed: string;
  question_id: string;
  question_points: string;
  library: string;
  page_id: string;
  question_url: string;
  submission_count: string;
  outcome: string;
  due: string;
  school: string;
  course_id: string;
  course_name: string;
  textbook_url: string;
  instructor_name: string;
  instructor_email: string;
  course_start_date: string;
}

export interface IAdapt extends IAdapt_Raw, Document {}

const AdaptSchema = new Schema<IAdapt>(
  {
    anon_student_id: String,
    session_id: String,
    submission_time: String,
    review_time_start: String,
    review_time_end: String,
    assignment_id: String,
    assignment_name: String,
    assignment_group: String,
    assignment_scoring_type: String,
    assignment_points: String,
    number_of_attempts_allowed: String,
    question_id: String,
    question_points: String,
    library: String,
    page_id: String,
    question_url: String,
    submission_count: String,
    outcome: String,
    due: String,
    school: String,
    course_id: String,
    course_name: String,
    textbook_url: String,
    instructor_name: String,
    instructor_email: String,
    course_start_date: String,
  },
  {
    collection: "adapt",
  }
);

export default models.Adapt || model<IAdapt>("Adapt", AdaptSchema, "adapt");
