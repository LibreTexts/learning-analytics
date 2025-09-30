import vine from "@vinejs/vine";


export const getByCourseValidator = vine.compile(
    vine.object({
        params: vine.object({
            course_id: vine.string()
        })
    })
);

export const getByCourseAndStudentIDValidator = vine.compile(
    vine.object({
        params: vine.object({
            course_id: vine.string(),
            student_id: vine.string()
        })
    })
);

export const getByCourseAssignmentIDValidator = vine.compile(
    vine.object({
        params: vine.object({
            course_id: vine.string(),
            assignment_id: vine.string()
        })
    })
);

export const getByCourseStudentAssignmentIDValidator = vine.compile(
    vine.object({
        params: vine.object({
            course_id: vine.string(),
            student_id: vine.string(),
            assignment_id: vine.string()
        })
    })
);