export const ewsStatusMessage = (status: string) => {
  switch (status) {
    case "success":
      return "No students were identified as 'at-risk'. Keep up the good work!";
    case "danger":
      return "We have identified a number of students in need of intervention.";
    case "warning":
      return "We have identified a few students as 'at-risk'. Intervention may be needed soon.";
    case "insufficient-data":
      return "Sorry, we don't have enough data to make performance predictions. Performance predictions improve with more student enrollments and assignment data.";
    default:
      return "Unknown";
  }
};

export const ewsStatusHeader = (status: string) => {
  switch (status) {
    case "success":
      return "Looks Good";
    case "danger":
      return "Attention Needed";
    case "warning":
      return "Warning";
    case "insufficient-data":
      return "Insufficient Data";
    default:
      return "Unknown";
  }
};
