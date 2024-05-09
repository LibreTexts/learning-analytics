"use client";
import { ListGroup } from "react-bootstrap";
import Links from "./Links";
import { useAtom } from "jotai";
import { globalStateAtom } from "@/state/globalState";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const ACTIVE_CLASSES = "tw-bg-light-gray tw-border-none";

const NavMenu = () => {
  const [globalState] = useAtom(globalStateAtom);
  const pathname = usePathname();

  const isActive = useMemo(() => {
    return (key: string) => {
      if (pathname === "/" && key === "dashboard") return true;
      let _pathname;
      if (pathname.startsWith("/")) _pathname = pathname.substring(1);
      return key === _pathname;
    };
  }, [pathname]);

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
            {globalState.viewAs === "instructor" ? "Instructor" : "Student"}{" "}
            Dashboard
          </span>
        </ListGroup.Item>
        {globalState.viewAs === "instructor" && (
          <ListGroup.Item
            active={isActive("early-warning")}
            className={isActive("early-warning") ? ACTIVE_CLASSES : ""}
            action
            href={Links.CLIENT.EarlyWarning}
          >
            <span className="tw-text-link-blue">Early Warning</span>
          </ListGroup.Item>
        )}
        {globalState.viewAs === "instructor" && (
          <ListGroup.Item
            active={isActive("raw-data")}
            className={isActive("raw-data") ? ACTIVE_CLASSES : ""}
            action
            href={Links.CLIENT.RawData}
          >
            <span className="tw-text-link-blue">Raw Data</span>
          </ListGroup.Item>
        )}
        {globalState.viewAs === "instructor" && (
          <ListGroup.Item
            active={isActive("course-settings")}
            className={isActive("course-settings") ? ACTIVE_CLASSES : ""}
            action
            href={Links.CLIENT.CourseSettings}
          >
            <span className="tw-text-link-blue">Course Settings</span>
          </ListGroup.Item>
        )}
      </ListGroup>
      {process.env.NODE_ENV === "development" && (
        <p className="tw-text-center tw-mt-2">
          Course ID: {globalState.adaptId}
        </p>
      )}
    </>
  );
};

export default NavMenu;
