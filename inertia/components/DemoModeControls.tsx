"use client";
import { useGlobalContext } from "~/state/globalContext";
import { capitalizeFirstLetter } from "~/utils/text-helpers";

const DemoModeControls = () => {
  const [globalState, setGlobalState] = useGlobalContext();

  return (
    <div className="tw:w-1/3 tw:flex tw:flex-col tw:items-center tw:border tw:border-solid tw:border-white tw:rounded-md tw:py-1 tw:mb-8 tw:bg-libre-blue tw:text-white">
      <div className="tw:flex tw:flex-row tw:items-center tw:mt-0">
        <p className="tw:text-center tw:mb-0">
          <span className="tw:font-semibold">(Demo Mode) Viewing as: </span>
          {capitalizeFirstLetter(globalState.viewAs)}
          <button
            onClick={() => {
              setGlobalState((prev) => ({
                ...prev,
                viewAs: prev.viewAs === "instructor" ? "student" : "instructor",
              }));
            }}
            className="tw:ml-2 tw:bg-gray-200 tw:rounded-md tw:text-xs"
          >
            Toggle
          </button>
        </p>
        {/* <form
          onSubmit={(e) => {
            e.preventDefault();
            setGlobalState((prev) => ({
              ...prev,
              adaptId: courseId,
            }));
          }}
        >
          <p className="tw:text-center tw:ml-4 tw:mb-0">
            <span className="tw:font-semibold">Course ID:</span>
            <input
              type="text"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                setGlobalState((prev) => ({
                  ...prev,
                  adaptId: courseId,
                }));
              }}
              className="tw:ml-2 tw:bg-gray-200 tw:rounded-md tw:text-xs tw:w-16 tw:text-center"
            />
          </p>
        </form> */}
      </div>
    </div>
  );
};

export default DemoModeControls;
