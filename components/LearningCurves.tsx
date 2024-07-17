"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LOCData,
  LearningCurveData,
  VisualizationBaseProps,
} from "@/lib/types";
import { useGlobalContext } from "@/state/globalContext";
import LearningObjectiveLevel from "./LearningObjectiveLevel";
import LoadingComponent from "./LoadingComponent";
import LearningCurveDescriptor from "./LearningCurveDescriptor";

type LearningCurvesProps = VisualizationBaseProps & {
  getData: (course_id: string) => Promise<LearningCurveData[]>;
};

const LearningCurves: React.FC<LearningCurvesProps> = ({
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
  const [data, setData] = useState<LearningCurveData[]>([]);
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
                <LearningCurveDescriptor key={crypto.randomUUID()} data={d} />
              ))}
            </div>
          )}
        </>
      )}
      {loading && <LoadingComponent />}
    </div>
  );
};

export default LearningCurves;
