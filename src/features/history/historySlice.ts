import { createAsyncThunk } from "@reduxjs/toolkit/react";
import { listScans, saveScan, ScanHistoryItem } from "../../services/database";
import { ScanResult } from "../scan/scanModel";

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
