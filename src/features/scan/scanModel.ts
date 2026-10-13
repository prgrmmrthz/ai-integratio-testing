export type ScanStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ScanResult = {
  isHealthy: boolean;
  diseaseName: string;
  scientificName: string;
  symptoms: string[];
  recommendations: string[];
};

export type ScanState = {
  image: ScanImage | null;
  result: ScanResult | null;
  status: ScanStatus;
  error: string | null;
};

export type ScanImage = {
  dataUrl: string;
  base64: string;
  mimeType: string;
  name: string;
};

export type AnalyzeImageArgs = {
  image: ScanImage;
  apiKey: string;
};

export const initialScanState: ScanState = {
  status: 'idle',
  result: null,
  error: null,
  image: null,
};