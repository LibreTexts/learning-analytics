import { createSlice } from "@reduxjs/toolkit";

export const globalSettingsSlice = createSlice({
  name: "globalSettings",
  initialState: {
    ferpaPrivacy: false,
    adaptId: "220",
    viewAs: "instructor",
  },
  reducers: {
    toggleFerpaPrivacy: (state) => {
      state.ferpaPrivacy = !state.ferpaPrivacy;
    },
    setAdaptId: (state, action) => {
      state.adaptId = action.payload;
    },
    toggleViewAs: (state) => {
      state.viewAs = state.viewAs === "instructor" ? "student" : "instructor";
    },
  },
});

export const { toggleFerpaPrivacy, setAdaptId, toggleViewAs } =
  globalSettingsSlice.actions;
export default globalSettingsSlice.reducer;
