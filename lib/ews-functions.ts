"use server";

import useEWSAxios from "@/hooks/useEWSAxios";
import { EarlyWarningStatus } from "./types/ews";
import connectDB from "./database";
import EarlyWarningSystem from "./EarlyWarningSystem";

export async function getEWSHealthCheck(): Promise<boolean> {
  const res = await useEWSAxios().get("/");
  console.log(res.data);
  if (!res?.data?.status) return false;
  if (res.data.status === "ok") return true;
  return false;
}

export async function getEWSStatus(
  course_id: string
): Promise<EarlyWarningStatus> {
  console.log("course_id", course_id)
  const ews = new EarlyWarningSystem(course_id);
  return ews.getEWSStatus();
}
