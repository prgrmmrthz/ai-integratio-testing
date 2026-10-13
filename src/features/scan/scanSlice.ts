import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialScanState, ScanImage, ScanResult } from './scanModel';
import { analyzeImage } from './scanThunk';

const scanSlice = createSlice({
  name: 'scan',
  initialState: initialScanState,
  reducers: {
    scanStarted: (state) => {
      state.status = 'loading';
      state.result = null;
      state.error = null;
    },
    scanSucceeded: (state, action: PayloadAction<ScanResult>) => {
      state.status = 'succeeded';
      state.result = action.payload;
    },
    scanFailed: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    scanImageSet: (state, action: PayloadAction<ScanImage>) => {
      state.image = action.payload;
    },
    scanReset: () => initialScanState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeImage.pending, (state) => {
        state.status = 'loading';
        state.result = null;
        state.error = null;
      })
      .addCase(analyzeImage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.result = action.payload;
      })
      .addCase(analyzeImage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Analysis failed.';
      });
  },
});

export const { scanStarted, scanSucceeded, scanFailed, scanImageSet, scanReset } =
  scanSlice.actions;

export default scanSlice.reducer;