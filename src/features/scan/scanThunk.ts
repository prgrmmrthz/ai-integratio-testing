import { createAsyncThunk } from "@reduxjs/toolkit";
import { AnalyzeImageArgs, ScanResult } from "./scanModel";
import { generateGeminiContent } from "../../services/geminiService";

export const analyzeImage = createAsyncThunk<
  ScanResult,
  AnalyzeImageArgs,
  { rejectValue: string }
>('scan/analyzeImage', async ({ image, apiKey }, { rejectWithValue }) => {
  try {
    const text = await generateGeminiContent({
      apiKey,
      image,
      prompt:
        'Analyze this rice plant image for visible disease. Respond only with a JSON object containing isHealthy (boolean), diseaseName (string), scientificName (string), symptoms (string array), and recommendations (string array). If healthy, set isHealthy to true and diseaseName and scientificName to empty strings.',
    });

    return parseScanResult(text);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Image analysis failed.',
    );
  }
});

function parseScanResult(text: string): ScanResult {
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const value: unknown = JSON.parse(json);

  if (typeof value !== 'object' || value === null) {
    throw new Error('The analysis response was not a JSON object.');
  }

  const result = value as Record<string, unknown>;
  if (
    typeof result.isHealthy !== 'boolean' ||
    typeof result.diseaseName !== 'string' ||
    typeof result.scientificName !== 'string' ||
    !Array.isArray(result.symptoms) ||
    !result.symptoms.every((item) => typeof item === 'string') ||
    !Array.isArray(result.recommendations) ||
    !result.recommendations.every((item) => typeof item === 'string')
  ) {
    throw new Error('The analysis response is missing required fields.');
  }

  return {
    isHealthy: result.isHealthy,
    diseaseName: result.diseaseName,
    scientificName: result.scientificName,
    symptoms: result.symptoms,
    recommendations: result.recommendations,
  };
}