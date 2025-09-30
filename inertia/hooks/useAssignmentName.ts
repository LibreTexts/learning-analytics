import { IDWithName } from "#types/index";
import { useGlobalContext } from "~/state/globalContext";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import api from "~/api";

const useAssignments = () => {
  const [globalState] = useGlobalContext();

  const { data: assignments, status: assignmentsStatus } = useQuery<
    IDWithName[]
  >({
    queryKey: ["assignments", globalState.courseID],
    queryFn: async () => {
      const res = await api.getCourseAssignments(globalState.courseID!);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  const getName = useMemo(() => {
    return (id?: string) => {
      if (!id) return "";
      const assignment = assignments?.find((a) => a.id === id);
      return assignment?.name || "";
    };
  }, [assignments]);

  return { getName, assignments, assignmentsStatus };
};

export default useAssignments;
