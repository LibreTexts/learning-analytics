import { Schema, model, models } from "mongoose";

export interface IAssignmentRaw {
    course_id: string;
    assignment_id: string;
    name: string;
    num_questions: number;
    questions: string[];
}

export interface IAssignment extends IAssignmentRaw, Document {}

const AssignmentSchema = new Schema<IAssignment>(
    {
        course_id: { type: String, required: true },
        assignment_id: { type: String, required: true },
        name: { type: String, required: true },
        num_questions: { type: Number, required: true },
        questions: [String],
    },
    {
        collection: "assignments",
    }
);

AssignmentSchema.index({ course_id: 1, assignment_id: 1 }, { unique: true });

export default models.Assignment ||
    model<IAssignment>("Assignment", AssignmentSchema, "assignments");