"use client";
import { useDispatch, useSelector } from "@/redux/store";
import { toggleFerpaPrivacy } from "@/redux/slices/globalSettingsSlice";
import CustomToggle from "./CustomToggle";

interface FERPAPrivacySwitchProps {}

const FERPAPrivacySwitch: React.FC<FERPAPrivacySwitchProps> = () => {
  const ferpaPrivacyState = useSelector(
    (state) => state.globalSettings.ferpaPrivacy
  );
  const dispatch = useDispatch();

  return (
    <CustomToggle
      id="ferpa-privacy-switch"
      label="FERPA Privacy Mode"
      checked={!ferpaPrivacyState}
      disabled={false}
      small={false}
      onChange={() => dispatch(toggleFerpaPrivacy())}
    />
  );
};

export default FERPAPrivacySwitch;
