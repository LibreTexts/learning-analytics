"use client";
import CustomToggle from "./CustomToggle";
import { useQueryClient } from "@tanstack/react-query";
import { useGlobalContext } from "@/state/globalContext";

interface FERPAPrivacySwitchProps {}

const FERPAPrivacySwitch: React.FC<FERPAPrivacySwitchProps> = () => {
  const [globalState, setGlobalState] = useGlobalContext();
  const queryClient = useQueryClient();

  const handleToggle = () => {
    setGlobalState((prev) => ({
      ...prev,
      ferpaPrivacy: !prev.ferpaPrivacy,
    }));

    // Remove the students query to force an immediate refetch
    queryClient.removeQueries({
      queryKey: ["students"],
    });
  };

  return (
    <CustomToggle
      id="ferpa-privacy-switch"
      label="FERPA Privacy Mode"
      checked={!globalState.ferpaPrivacy}
      disabled={false}
      small={false}
      onChange={handleToggle}
    />
  );
};

export default FERPAPrivacySwitch;
