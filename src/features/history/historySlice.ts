import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { listScans, removeScan, saveScan, type ScanHistoryItem } from '../../services/database';
import type { ScanResult } from '../scan/scanModel';

type HistoryState = {
  items: ScanHistoryItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: HistoryState = {
  items: [],
  status: 'idle',
  error: null,
};

export const loadHistory = createAsyncThunk('history/load', () => listScans());

export const saveHistoryItem = createAsyncThunk(
  'history/save',
  async (item: { imageName: string; result: ScanResult }) => {
    const record: ScanHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    await saveScan(record);
    return record;
  },
);

export const deleteHistoryItem = createAsyncThunk(
  'history/delete',
  async (id: string) => {
    await removeScan(id);
    return id;
  },
);

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearHistoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to load scan history.';
      })
      .addCase(saveHistoryItem.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(saveHistoryItem.rejected, (state, action) => {
        state.error = action.error.message ?? 'Unable to save this scan to history.';
      })
      .addCase(deleteHistoryItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteHistoryItem.rejected, (state, action) => {
        state.error = action.error.message ?? 'Unable to delete this scan.';
      });
  },
});

export const { clearHistoryError } = historySlice.actions;
export default historySlice.reducer;
