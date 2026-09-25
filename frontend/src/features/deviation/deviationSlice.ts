import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Deviation, AIAssessment, AnalysisResult, DeviationResponse } from "../../types/deviation";
import type { RootState } from "../../app/store";
import { analyzeDeviation, saveDeviation, getDeviations } from "../../services/deviationApi";
import { validateDeviation } from "./validation";

interface DeviationState {
    form: Deviation,
    aiDraft: Deviation | null,
    assessment: AIAssessment | null,
    sourceText: string,
    selectedFileName: string | null,
    isAnalyzing: boolean,
    isSaving: boolean,
    error: string | null,
    savedDeviationId: number | null,
    deviations: DeviationResponse[],
    isLoadingDeviations: boolean,
}

const initialState: DeviationState = {
    form: {
        site: "", dateOfOccurrence: "", title: "",
        source: "", productMaterial: "", batchLotNumber: "",
        description: "", initialImpact: "", initialSeverity: "",
    },
    assessment: null, sourceText: "", selectedFileName: null,
    isAnalyzing: false, isSaving: false, error: null, aiDraft: null,
    savedDeviationId: null, deviations: [], isLoadingDeviations: false,
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

export const saveCurrentDeviation = createAsyncThunk<any, void, {
  state: RootState; rejectValue: string;
}>(
  "deviation/save", async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().deviation;

      const validationError = validateDeviation(state.form);

      if (validationError) {
        return rejectWithValue(validationError);
      }

      return await saveDeviation(
        state.form, state.assessment
      );
    } catch (error: any) {
      const message = error?.response?.data?.detail || 
        error?.message || "Failed to save deviation.";
      
      return rejectWithValue(String(message));
    }
  }
);

export const fetchDeviations = createAsyncThunk<DeviationResponse[], void, { rejectValue: string; }>(
  "deviation/fetchAll", async (_, { rejectWithValue }) => {
    try {
      return await getDeviations();
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.detail || "Failed to load deviations."
      );
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
      ).addCase(
        runDeviationAnalysis.rejected,
        (state, action) => {
          state.isAnalyzing = false;
          state.error = action.payload ||
            "AI analysis failed.";
        }
      ).addCase(
        saveCurrentDeviation.pending, (state) => {
          state.isSaving = true;
          state.error = null;
        }
      ).addCase(
        saveCurrentDeviation.rejected, (state, action) => {
          state.isSaving = false;
          state.error = action.payload || "Failed to save deviation.";
        }
      ).addCase(
        saveCurrentDeviation.fulfilled, (state, action) => {
          state.isSaving = false;
          state.savedDeviationId = action.payload.id;
        }
      ).addCase(
        fetchDeviations.pending, (state) => {
          state.isLoadingDeviations = true;
          state.error = null;
        }
      ).addCase(
        fetchDeviations.fulfilled, (state, action) => {
          state.isLoadingDeviations = false;
          state.deviations = action.payload;
        }
      ).addCase(
        fetchDeviations.rejected, (state, action) => {
          state.isLoadingDeviations = false;

          state.error = action.payload || "Failed to load deviations.";
        }
      );
  },
});

export const {
    updateField, setSourceText, setSelectedFileName,
    applyAIResults, clearError, resetDeviation,
} = deviationSlice.actions;

export default deviationSlice.reducer;
