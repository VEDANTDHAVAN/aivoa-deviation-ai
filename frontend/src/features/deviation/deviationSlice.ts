import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Deviation, AIAssessment } from "../../types/deviation";

interface DeviationState {
    form: Deviation,
    assessment: AIAssessment | null,
    sourceText: string,
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
    assessment: null, sourceText: "", isAnalyzing: false,
    isSaving: false, error: null,
};

const deviationSlice = createSlice({
    name: "deviation", initialState, reducers: {
        setForm(state, action: PayloadAction<Deviation>) {
            state.form = action.payload;
        },

        updateField(state, action: PayloadAction<{
            field: keyof Deviation, value: string,
        }>) {
            state.form[action.payload.field] = action.payload.value as never;
        },

        setAssessment(state, action: PayloadAction<AIAssessment>) {
            state.assessment = action.payload;
        },

        setSourceText(state, action: PayloadAction<string>) {
            state.sourceText = action.payload;
        },

        setAnalyzing(state, action: PayloadAction<boolean>) {
            state.isAnalyzing = action.payload;
        },

        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },

        resetDeviation() {
            return initialState;
        },
    },
});

export const {
    setForm, updateField, setAssessment, setSourceText,
    setAnalyzing, setError, resetDeviation,
} = deviationSlice.actions;

export default deviationSlice.reducer;