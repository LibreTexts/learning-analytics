"use client";
import { useGlobalContext } from "~/state/globalContext";
import FERPAPrivacySwitch from "./FERPAPrivacySwitch";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  const [globalState] = useGlobalContext();

  return (
    <div className="tw:flex tw:flex-col tw:mb-2 tw:max-w-[96%]">
      <div className="tw:flex tw:flex-row tw:justify-between">
        <h1 className="tw:text-3xl tw:text-primary tw:font-normal">{title}</h1>
        {globalState.viewAs === "instructor" && <FERPAPrivacySwitch />}
      </div>
      <hr className="tw:border-gray-300 tw:mt-0.5 tw:mb-3" />
      <p className="tw:text-sm tw:text-gray-500">
        {subtitle} Data is updated every 12 hours - current changes may not be
        reflected.
      </p>
      {children}
    </div>
  );
};

export default PageHeader;
