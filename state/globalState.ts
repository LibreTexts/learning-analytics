import { ICourseAnalyticsSettings_Raw } from "@/lib/models/courseAnalyticsSettings";
import { SetStateAction, atom } from "jotai";

export type GlobalState = {
  ferpaPrivacy: boolean;
  adaptId: string;
  viewAs: string;
  studentId: string;
  assignmentId: string;
} & ICourseAnalyticsSettings_Raw;

type GlobalStateSetAction = SetStateAction<GlobalState>;

export const initGlobalStateAtom = atom({
  ferpaPrivacy: false,
  adaptId: "",
  viewAs: "student",
  studentId: "",
  assignmentId: "",
  courseID: "",
  shareGradeDistribution: false,
});

export const globalStateAtom = atom(
  (get) => get(initGlobalStateAtom),
  (get, set, update: GlobalStateSetAction) => {
    set(initGlobalStateAtom, update);
  }
);
