import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Deviation, AIAssessment, AnalysisResult } from "../../types/deviation";

import { analyzeDeviation } from "../../services/deviationApi";

interface DeviationState {
    form: Deviation,
    aiDraft: Deviation | null,
    assessment: AIAssessment | null,
    sourceText: string,
    selectedFileName: string | null,
    isAnalyzing: boolean,
    isSaving: boolean,
    error: string | null,
}

const initialState: DeviationState = {
    form: {
        site: "", dateOfOccurrence: "", title: "",
        source: "", productMaterial: "", batchLotNumber: "",
        description: "", initialImpact: "", initialSeverity: "",
    },
    assessment: null, sourceText: "", selectedFileName: null,
    isAnalyzing: false, isSaving: false, error: null, aiDraft: null,
};

export const runDeviationAnalysis = createAsyncThunk<AnalysisResult, {
    text?: string, file?: File,
}, { rejectValue: string, }>("deviation/runAnalysis", 
    async (
        { text, file }, {rejectWithValue }
    ) => {
        try {
            return await analyzeDeviation(text, file);
        } catch (error: any) {
            const message = error?.response?.data?.detail?.message || error?.response?.data?.detail ||
              error?.message || "AI analysis failed.";
              
            return rejectWithValue(String(message));
        }
    }
);

const deviationSlice = createSlice({
  name: "deviation",
  initialState,
  reducers: {
    updateField(
      state, action: PayloadAction<{
        field: keyof Deviation;
        value: string;
      }>
    ) {
      state.form[
        action.payload.field
      ] = action.payload.value as never;
    },

    setSourceText(
      state, action: PayloadAction<string>
    ) {
      state.sourceText = action.payload;
    },

    setSelectedFileName(
      state, action: PayloadAction<string | null>
    ) {
      state.selectedFileName = action.payload;
    },

    applyAIResults(state) {
      if (!state.aiDraft) {
        return;
      }

      state.form = state.aiDraft;

      if (state.assessment) {
        state.form.initialImpact = state.assessment.impact;
        state.form.initialSeverity = state.assessment.severity;
      }
    },

    clearError(state) {
      state.error = null;
    },

    resetDeviation() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
        runDeviationAnalysis.pending,
        (state) => {
          state.isAnalyzing = true;
          state.error = null;
        }
      ).addCase(
        runDeviationAnalysis.fulfilled,
        (state, action) => {
          state.isAnalyzing = false;
          state.aiDraft = action.payload.deviation;
          state.assessment = action.payload.assessment;
          state.error = null;
        }
      )

      .addCase(
        runDeviationAnalysis.rejected,
        (state, action) => {
          state.isAnalyzing = false;
          state.error = action.payload ||
            "AI analysis failed.";
        }
      );
  },
});

export const {
    updateField, setSourceText, setSelectedFileName,
    applyAIResults, clearError, resetDeviation,
} = deviationSlice.actions;

export default deviationSlice.reducer;