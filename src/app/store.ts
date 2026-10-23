import { configureStore } from '@reduxjs/toolkit';
import historyReducer from '../features/history/historySlice';
import profileReducer from '../features/profile/profileSlice';
import scanReducerDefault from '../features/scan/scanSlice';

export const store = configureStore({
  reducer: {
    scanReducer: scanReducerDefault,
    history: historyReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
