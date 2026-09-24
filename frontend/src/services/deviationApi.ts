import axios from "axios";

import type {
  AnalysisResult,
  Deviation,
} from "../types/deviation";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

interface AnalyzeResponse {
  success: boolean;
  data: AnalysisResult;
}

export async function analyzeDeviation(
  text?: string,
  file?: File
): Promise<AnalysisResult> {
  const formData = new FormData();

  if (text?.trim()) {
    formData.append("text", text.trim());
  }

  if (file) {
    formData.append("file", file);
  }

  const response =
    await api.post<AnalyzeResponse>(
      "/api/deviations/analyze",
      formData
    );

  return response.data.data;
}

export async function saveDeviation(
  deviation: Deviation
) {
  const response = await api.post(
    "/api/deviations",
    deviation
  );

  return response.data;
}