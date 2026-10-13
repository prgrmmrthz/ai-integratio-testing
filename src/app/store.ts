import { configureStore } from '@reduxjs/toolkit';
import scanReducerDefault from '../features/scan/scanSlice';

export const store = configureStore({
  reducer: {
    scanReducer: scanReducerDefault,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
