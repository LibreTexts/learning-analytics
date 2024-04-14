import { createSlice } from "@reduxjs/toolkit";

export const demoSettingsSlice = createSlice({
  name: "demoSettings",
  initialState: {
    adaptId: '220',
    viewAs: 'instructor',
  },
  reducers: {
    setAdaptId: (state, action) => {
      state.adaptId = action.payload;
    },
    toggleViewAs: (state) => {
        state.viewAs = state.viewAs === 'instructor' ? 'student' : 'instructor';
    },
  },
});

export const { setAdaptId, toggleViewAs } = demoSettingsSlice.actions;
export default demoSettingsSlice.reducer;
