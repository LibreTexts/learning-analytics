"use server";

import useEWSAxios from "@/hooks/useEWSAxios";
import { EWSResult, EarlyWarningStatus } from "./types/ews";
import EarlyWarningSystem from "./EarlyWarningSystem";

export async function getEWSHealthCheck(): Promise<boolean> {
  const ewsAxios = await useEWSAxios();
  if (!ewsAxios) return false;

  const res = await ewsAxios.get("/");

  if (!res?.data?.status) return false;
  if (res.data.status === "ok") return true;
  return false;
}

export async function getEWSStatus(
  course_id: string
): Promise<EarlyWarningStatus> {
  const ews = new EarlyWarningSystem();
  return ews.getEWSStatus(course_id);
}

export async function getEWSResults(course_id: string, privacy = false): Promise<EWSResult[]> {
  const ews = new EarlyWarningSystem();
  return ews.getEWSResults(course_id, privacy);
}
