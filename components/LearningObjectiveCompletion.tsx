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
  const chartsRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef(null);
  const [data, setData] = useState<LOCData[]>([]);
  const [loading, setLoading] = useState(false);

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
      console.log("Loading data for course", globalState.courseID);
      setLoading(true);
      if (!globalState.courseID) return;

      const _data = await getData(globalState.courseID);
      console.log("Data loaded:", _data);
      setData(_data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              {data.map((d, index) => (
                <LearningObjectiveLevel key={crypto.randomUUID()} data={d} />
              ))}
            </div>
          )}
        </>
      )}
      {
        loading && (
          <div className="tw-flex tw-flex-row tw-justify-center tw-items-center">
            <div className="spinner-border tw-mb-1" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default LearningObjectiveCompletion;
