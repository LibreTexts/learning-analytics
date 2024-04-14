import demoSettingsSlice from "./slices/demoSettingsSlice";
import globalSettingsReducer from "./slices/globalSettingsSlice";

export const reducer = {
  globalSettings: globalSettingsReducer,
  demoSettings: demoSettingsSlice
};
