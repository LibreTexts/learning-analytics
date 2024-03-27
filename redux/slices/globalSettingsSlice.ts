import { createSlice } from "@reduxjs/toolkit";

export const globalSettingsSlice = createSlice({
  name: "globalSettings",
  initialState: {
    ferpaPrivacy: false,
  },
  reducers: {
    toggleFerpaPrivacy: (state) => {
      state.ferpaPrivacy = !state.ferpaPrivacy;
    },
  },
});

export const { toggleFerpaPrivacy } = globalSettingsSlice.actions;
export default globalSettingsSlice.reducer;
