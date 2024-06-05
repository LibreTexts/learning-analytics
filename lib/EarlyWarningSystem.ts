import connectDB from "./database";
import ewsCourseSummary from "./models/ewsCourseSummary";
import { EarlyWarningStatus } from "./types/ews";

class EarlyWarningSystem {
  private adaptID: number;
  constructor(_adaptID?: string) {
    if (!_adaptID) {
      throw new Error("ADAPT ID is required");
    }
    const parsed = parseInt(_adaptID.toString().trim());
    if (isNaN(parsed)) {
      throw new Error("Invalid ADAPT ID");
    }
    this.adaptID = parsed;
    //    this.initDatabase();
  }

  public async getEWSStatus(): Promise<EarlyWarningStatus> {
    try {
      await connectDB();

      if (!this.adaptID) return "error";

      const doc = await ewsCourseSummary
        .findOne({
          course_id: this.adaptID,
        })
        .orFail();

      if (!doc.status) return "error";

      return doc.status;
    } catch (err) {
      console.error(err);
      return "error";
    }
  }
}

export default EarlyWarningSystem;
