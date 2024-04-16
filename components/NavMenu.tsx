"use client";
import { ListGroup } from "react-bootstrap";
import Links from "./Links";
import { useSelector } from "@/redux";

const ACTIVE_CLASSES = "tw-bg-light-gray tw-border-none";

type NavMenuProps = {
  activeKey: string;
};

const NavMenu: React.FC<NavMenuProps> = ({ activeKey }) => {
  const globalSettings = useSelector((state) => state.globalSettings);

  const isActive = (key: string) => {
    if (activeKey === "/" && key === "dashboard") return true;
    if (activeKey.startsWith("/")) activeKey = activeKey.substring(1);
    return key === activeKey;
  };

  return (
    <>
      <ListGroup className="!tw-shadow-sm tw-w-52 tw-h-fit">
        <ListGroup.Item className="tw-bg-ultra-light-gray">
          Course Analytics
        </ListGroup.Item>
        <ListGroup.Item
          active={isActive("dashboard")}
          className={isActive("dashboard") ? ACTIVE_CLASSES : ""}
          action
          href={Links.CLIENT.Dashboard}
        >
          <span className="tw-text-link-blue">
            {globalSettings.viewAs === "instructor" ? "Instructor" : "Student"}{" "}
            Dashboard
          </span>
        </ListGroup.Item>
        <ListGroup.Item
          active={isActive("early-warning")}
          className={isActive("early-warning") ? ACTIVE_CLASSES : ""}
          action
          href={Links.CLIENT.EarlyWarning}
        >
          <span className="tw-text-link-blue">Early Warning</span>
        </ListGroup.Item>
        {globalSettings.viewAs === "instructor" && (
          <ListGroup.Item
            active={isActive("raw-data")}
            className={isActive("raw-data") ? ACTIVE_CLASSES : ""}
            action
            href={Links.CLIENT.RawData}
          >
            <span className="tw-text-link-blue">Raw Data</span>
          </ListGroup.Item>
        )}
      </ListGroup>
      {process.env.NODE_ENV === "development" && (
        <p className="tw-text-center tw-mt-2">
          Course ID: {globalSettings.adaptId}
        </p>
      )}
    </>
  );
};

export default NavMenu;
