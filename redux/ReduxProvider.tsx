"use client";

/* Core */
import { Provider } from "react-redux";

/* Instruments */
import { reduxStore } from "@/redux";

export const ReduxProvider = (props: React.PropsWithChildren) => {
  return <Provider store={reduxStore}>{props.children}</Provider>;
};
