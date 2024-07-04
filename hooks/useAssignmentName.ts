import Links from "@/components/Links";
import { IDWithName } from "@/lib/types";
import { useGlobalContext } from "@/state/globalContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";

const useAssignments = () => {
  const [globalState] = useGlobalContext();

  const { data: assignments, status: assignmentsStatus } = useQuery<
    IDWithName[]
  >({
    queryKey: ["assignments", globalState.courseID],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });

  async function fetchAssignments(): Promise<IDWithName[]> {
    try {
      if (!globalState.courseID) return [];
      const res = await axios.get(Links.API.Assignments, {
        params: {
          courseID: globalState.courseID,
        },
      });

      if (!res.data?.data) return [];

      const data = res.data.data;
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

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
