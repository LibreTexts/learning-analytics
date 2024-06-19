import {
  Context,
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { GlobalState } from "@/lib/types";

const DEFAULT_GLOBAL_STATE: GlobalState = {
  ferpaPrivacy: false,
  role: "student",
  viewAs: "student",
  student: {
    id: "",
    email: "",
    name: "",
  },
  assignmentId: "",
  courseID: "",
  shareGradeDistribution: false,
  courseLetterGradesReleased: false,
};

const GlobalContext = createContext<
  [GlobalState, Dispatch<SetStateAction<GlobalState>>]
>([DEFAULT_GLOBAL_STATE, () => {}]);

interface GlobalContextProviderProps {
  children: React.ReactNode;
}

export function GlobalContextProvider({
  children,
}: GlobalContextProviderProps) {
  const [globalState, setGlobalState] =
    useState<GlobalState>(DEFAULT_GLOBAL_STATE);

  return (
    <GlobalContext.Provider value={[globalState, setGlobalState]}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
