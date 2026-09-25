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
  data: {
    deviation: {
      site: string;
      date_of_occurrence: string;
      title: string;
      source: string;
      product_material: string;
      batch_lot_number: string;
      description: string;
      initial_impact: string;
      initial_severity: "Critical" | "Major" | "Minor" | null;
    };
    assessment: AIAssessment;
  };
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

  return {
    deviation: mapAnalysisDeviation(response.data.data.deviation),
    assessment: response.data.data.assessment,
  };
}

export async function saveDeviation(
  deviation: Deviation,
  assessment?: AIAssessment | null,
): Promise<DeviationResponse> {
  const payload = toDeviationPayload(deviation, assessment);

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
  const response = await api.put(`/api/deviations/${id}`, toDeviationPayload(deviation, assessment));
  return mapDeviation(response.data);
}

function mapAnalysisDeviation(data: AnalyzeResponse["data"]["deviation"]): Deviation {
  return {
    site: data.site ?? "",
    dateOfOccurrence: data.date_of_occurrence ?? "",
    title: data.title ?? "",
    source: data.source ?? "",
    productMaterial: data.product_material ?? "",
    batchLotNumber: data.batch_lot_number ?? "",
    description: data.description ?? "",
    initialImpact: data.initial_impact ?? "",
    initialSeverity: data.initial_severity ?? "",
  };
}

function toDeviationPayload(deviation: Deviation, assessment?: AIAssessment | null) {
  return {
    site: deviation.site,
    date_of_occurrence: deviation.dateOfOccurrence,
    title: deviation.title,
    source: deviation.source,
    product_material: deviation.productMaterial,
    batch_lot_number: deviation.batchLotNumber,
    description: deviation.description,
    initial_impact: deviation.initialImpact,
    initial_severity: deviation.initialSeverity,
    ai_impact: assessment?.impact ?? null,
    ai_impact_reason: assessment?.impact_reason ?? null,
    ai_severity: assessment?.severity ?? null,
    ai_severity_reason: assessment?.severity_reason ?? null,
  };
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
    aiImpact: data.ai_impact,
    aiImpactReason: data.ai_impact_reason,
    aiSeverity: data.ai_severity,
    aiSeverityReason: data.ai_severity_reason,
  };
}
