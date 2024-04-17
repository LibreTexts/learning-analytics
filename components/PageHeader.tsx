"use client";
import { useSelector } from "@/redux";
import FERPAPrivacySwitch from "./FERPAPrivacySwitch";

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  const globalSettings = useSelector((state) => state.globalSettings);

  return (
    <div className="tw-flex tw-flex-col tw-w-full tw-mb-2">
      <div className="tw-flex tw-flex-row tw-justify-between">
        <h1 className="tw-text-2xl tw-text-primary tw-font-light">{title}</h1>
        {globalSettings.viewAs === "instructor" && <FERPAPrivacySwitch />}
      </div>
      <hr className="tw-border-gray-300 tw-mt-0.5 tw-mb-3" />
      <p className="tw-text-sm tw-text-gray-500">{subtitle}</p>
    </div>
  );
};

export default PageHeader;
