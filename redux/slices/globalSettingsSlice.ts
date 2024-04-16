import { createSlice } from "@reduxjs/toolkit";

export const globalSettingsSlice = createSlice({
  name: "globalSettings",
  initialState: {
    ferpaPrivacy: false,
    adaptId: "220",
    viewAs: "instructor",
    studentId: "07acf33097069bd3d3e51a5d31f66b57ece0fcda3c308068ba8c9e7aa3b7a310"
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
