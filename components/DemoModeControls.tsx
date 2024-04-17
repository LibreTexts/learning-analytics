import { useSelector } from "@/redux";
import { toggleViewAs, setAdaptId } from "@/redux/slices/globalSettingsSlice";
import { capitalizeFirstLetter } from "@/utils/text-helpers";
import { useState } from "react";
import { useDispatch } from "react-redux";

const DemoModeControls = () => {
  const globalSettings = useSelector((state) => state.globalSettings);
  const dispatch = useDispatch();

  const [courseId, setCourseId] = useState(globalSettings.adaptId);

  return (
    <div className="tw-w-1/3 tw-flex tw-flex-col tw-items-center tw-border tw-border-solid tw-border-white tw-rounded-md tw-py-1 tw-mb-8 tw-bg-libre-blue tw-text-white">
      <div className="tw-flex tw-flex-row tw-items-center tw-mt-0">
        <p className="tw-text-center tw-mb-0">
          <span className="tw-font-semibold">Viewing as: </span>
          {capitalizeFirstLetter(globalSettings.viewAs)}
          <button
            onClick={() => {
              dispatch(toggleViewAs());
            }}
            className="tw-ml-2 tw-bg-gray-200 tw-rounded-md tw-text-xs"
          >
            Toggle
          </button>
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(setAdaptId(courseId));
          }}
        >
          <p className="tw-text-center tw-ml-4 tw-mb-0">
            <span className="tw-font-semibold">Course ID:</span>
            <input
              type="text"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                dispatch(setAdaptId(courseId));
              }}
              className="tw-ml-2 tw-bg-gray-200 tw-rounded-md tw-text-xs tw-w-16 tw-text-center"
            />
          </p>
        </form>
      </div>
    </div>
  );
};

export default DemoModeControls;
