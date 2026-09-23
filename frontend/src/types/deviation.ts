export type Severity = "Critical" | "Major" | "Minor";

export interface Deviation {
  site: string;
  dateOfOccurrence: string;
  title: string;
  source: string;
  productMaterial: string;
  batchLotNumber: string;
  description: string;
  initialImpact: string;
  initialSeverity: Severity | "";
}

export interface AIAssessment {
  impact: string;
  severity: Severity;
  reason: string;
}

export interface AnalysisResult {
  deviation: Deviation;
  assessment: AIAssessment;
}