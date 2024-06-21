"use client";
import { ListGroup } from "react-bootstrap";
import Links from "./Links";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useGlobalContext } from "@/state/globalContext";
import InstructorDashboardControls from "./InstructorDashboardControls";

const ACTIVE_CLASSES = "tw-bg-light-gray tw-border-none";

const NavMenu = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [globalState] = useGlobalContext();

  const isActive = useMemo(() => {
    return (key: string) => {
      if (pathname === "/" && key === "dashboard") return true;
      let _pathname;
      if (pathname.startsWith("/")) _pathname = pathname.substring(1);
      return key === _pathname;
    };
  }, [pathname]);

  return (
    <div className="tw-w-52">
      <div className="tw-sticky tw-top-4 tw-z-50">
        <ListGroup className="!tw-shadow-sm tw-h-fit">
          <ListGroup.Item className="tw-bg-ultra-light-gray">
            Course Analytics
          </ListGroup.Item>
          <ListGroup.Item
            active={isActive("dashboard")}
            className={isActive("dashboard") ? ACTIVE_CLASSES : ""}
            action
            onClick={() => router.push(Links.CLIENT.Dashboard)}
          >
            <span className="tw-text-link-blue">
              {globalState.viewAs === "instructor"
                ? "Performance & Activity"
                : "Student Dashboard"}
            </span>
          </ListGroup.Item>
          {globalState.viewAs === "instructor" && (
            <ListGroup.Item
              active={isActive("learning-curves")}
              className={isActive("learning-curves") ? ACTIVE_CLASSES : ""}
              action
              onClick={() => router.push(Links.CLIENT.LearningCurves)}
            >
              <span className="tw-text-link-blue">Learning Curves</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === "instructor" && (
            <ListGroup.Item
              active={isActive("learning-objectives")}
              className={isActive("learning-objectives") ? ACTIVE_CLASSES : ""}
              action
              onClick={() => router.push(Links.CLIENT.LearningObjectives)}
            >
              <span className="tw-text-link-blue">Learning Objectives</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === "instructor" && (
            <ListGroup.Item
              active={isActive("early-warning")}
              className={isActive("early-warning") ? ACTIVE_CLASSES : ""}
              action
              onClick={() => router.push(Links.CLIENT.EarlyWarning)}
            >
              <span className="tw-text-link-blue">Early Warning</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === "instructor" && (
            <ListGroup.Item
              active={isActive("raw-data")}
              className={isActive("raw-data") ? ACTIVE_CLASSES : ""}
              action
              onClick={() => router.push(Links.CLIENT.RawData)}
            >
              <span className="tw-text-link-blue">Raw Data</span>
            </ListGroup.Item>
          )}
          {globalState.viewAs === "instructor" && (
            <ListGroup.Item
              active={isActive("course-settings")}
              className={isActive("course-settings") ? ACTIVE_CLASSES : ""}
              action
              onClick={() => router.push(Links.CLIENT.CourseSettings)}
            >
              <span className="tw-text-link-blue">Course Settings</span>
            </ListGroup.Item>
          )}
        </ListGroup>
        {globalState.viewAs === "instructor" && isActive("dashboard") && (
          <InstructorDashboardControls />
        )}
      </div>
    </div>
  );
};

export default NavMenu;
