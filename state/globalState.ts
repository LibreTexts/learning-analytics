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
  viewAs: "student",
  studentId: "65cedf714ba02470a7350d8e799c7aadff680fdbfc40f2e0e06ed6bc0323e3d5",
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