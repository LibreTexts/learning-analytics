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
  adaptId: "220",
  viewAs: "instructor",
  studentId: "07acf33097069bd3d3e51a5d31f66b57ece0fcda3c308068ba8c9e7aa3b7a310",
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
