"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { LOCData, VisualizationBaseProps } from "@/lib/types";
import { useGlobalContext } from "@/state/globalContext";
import LearningObjectiveLevel from "./LearningObjectiveLevel";
import LoadingComponent from "./LoadingComponent";
import { Button } from "react-bootstrap";

type LOCProps = VisualizationBaseProps & {
  getData: (course_id: string) => Promise<LOCData[]>;
};

const LearningObjectiveCompletion: React.FC<LOCProps> = ({
  getData,
  innerRef,
}) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }));

  const [globalState] = useGlobalContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [data, setData] = useState<LOCData[]>([]);
  const [loading, setLoading] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  const noFrameworkAlignment = useMemo(() => {
    if (data.length === 0) return true;
    return false;
  }, [data]);

  useEffect(() => {
    if (!globalState.courseID) return;
    handleGetData();
  }, [globalState.courseID]);

  async function handleGetData() {
    try {
      setLoading(true);
      if (!globalState.courseID) return;

      const _data = await getData(globalState.courseID);
      setData(_data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleAll() {
    setAllOpen(!allOpen);
  }

  return (
    <div ref={containerRef}>
      {!loading && (
        <>
          {noFrameworkAlignment && (
            <div className="tw-flex tw-flex-row tw-justify-center">
              <p>
                No questions have been aligned to frameworks in this course.
              </p>
            </div>
          )}
          {!noFrameworkAlignment && (
            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-justify-end tw-max-w-[96%]">
                <Button onClick={handleToggleAll} className="" size="sm">
                  {allOpen ? "Collapse All" : "Expand All"}
                </Button>
              </div>
              {data.map((d, index) => (
                <LearningObjectiveLevel key={crypto.randomUUID()} data={d} />
              ))}
            </div>
          )}
        </>
      )}
      {loading && <LoadingComponent />}
    </div>
  );
};

export default LearningObjectiveCompletion;
