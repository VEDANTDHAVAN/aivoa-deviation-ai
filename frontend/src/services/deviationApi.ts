import axios from "axios";

import type {
  AIAssessment,
  AnalysisResult,
  Deviation, 
  DeviationResponse,
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
): Promise<DeviationResponse> {
  const payload = {
    site: deviation.site,
    date_of_occurrence: deviation.dateOfOccurrence,
    title: deviation.title,
    source: deviation.source,
    product_material: deviation.productMaterial,
    batch_lot_number: deviation.batchLotNumber,
    description: deviation.description,
    initial_impact: deviation.initialImpact,
    initial_severity: deviation.initialSeverity,
  };

  const response = await api.post(
    "/api/deviations",
    payload
  );

  return mapDeviation(response.data);
}

export async function getDeviations(): Promise<DeviationResponse[]>{
  const response = await api.get("/api/deviations");

  return response.data.map(mapDeviation);
}

export async function getDeviation(id: number): Promise<DeviationResponse> {
  const response = await api.get(`/api/deviations/${id}`);

  return mapDeviation(response.data);
}

export async function updateDeviation(id: number, deviation: Deviation, assessment?: AIAssessment | null): Promise<DeviationResponse> {
  const response = await api.put(`/api/deviations/${id}`, { ...deviation, ai_impact: assessment?.impact ?? null, ai_impact_reason: assessment?.impact_reason ?? null, ai_severity: assessment?.severity ?? null, ai_severity_reason: assessment?.severity_reason ?? null });
  return mapDeviation(response.data);
}

function mapDeviation(
  data: any
): DeviationResponse {
  return {
    id: data.id,
    site: data.site,
    dateOfOccurrence: data.date_of_occurrence,
    title: data.title,
    source: data.source,
    productMaterial: data.product_material,
    batchLotNumber: data.batch_lot_number,
    description: data.description,
    initialImpact: data.initial_impact,
    initialSeverity: data.initial_severity,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
