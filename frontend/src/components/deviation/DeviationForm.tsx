import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { saveCurrentDeviation } from "../../features/deviation/deviationSlice";
import { updateField } from "../../features/deviation/deviationSlice";

export default function DeviationForm() {
    const dispatch = useAppDispatch();

    const form = useAppSelector((state) => state.deviation.form);

    const update = (
        field: keyof typeof form, value: string
    ) => {
        dispatch(updateField({
            field, value
        }));
    };

    const isSaving = useAppSelector(
        (state) => state.deviation.isSaving
    );

    const savedDeviationId = useAppSelector(
        (state) => state.deviation.savedDeviationId
    );

    const hasAiDraft = useAppSelector(
        (state) => Boolean(state.deviation.aiDraft)
    );

    return (
        <div className="deviation-form">
            <div className="section-heading">
                <h2>Log Deviation</h2>
                <p>Review and edit the AI-generated information before saving.</p>
            </div>
            {!hasAiDraft && (
                <div className="error-box">
                    Analyze a deviation document or text with the AI assistant before saving.
                </div>
            )}
            <div className="field">
                <label>Site</label>
                <input
                    value={form.site} onChange={(event) =>
                        update("site", event.target.value)
                    } placeholder="Manufacturing site"
                />
            </div>
            <div className="field">
                <label>Date of occurrence</label>
                <input type="date" value={form.dateOfOccurrence}
                 onChange={(event) => update("dateOfOccurrence", event.target.value)}
                />
            </div>
            <div className="field">
                <label>Deviation title</label>
                <input value={form.title} onChange={(event) => update(
                    "title", event.target.value
                    )} placeholder="Deviation title"
                />
            </div>
            <div className="field">
                <label>Source</label>
                <input value={form.source} onChange={(event) => update(
                    "source", event.target.value
                )} placeholder="Manufacturing / QC / QA..."
                />
            </div>
            <div className="two-column">
                <div className="field">
                    <label>Product / Material</label>
                    <input value={form.productMaterial}
                     onChange={(event) => update(
                        "productMaterial", 
                        event.target.value
                    )}
                />
            </div>
            <div className="field">
                <label>Batch / Lot</label>
                <input value={form.batchLotNumber}
                 onChange={(event) => update("batchLotNumber", event.target.value)}
                />
            </div>
        </div>
        <div className="field">
            <label>Description</label>
            <textarea rows={6} value={form.description}
             onChange={(event) => update(
                "description", event.target.value
             )} placeholder="Deviation description..."
            />
        </div>
        <div className="field">
            <label>Initial impact</label>
            <textarea rows={3} value={form.initialImpact}
             onChange={(event) => update(
              "initialImpact",
              event.target.value
            )}
        />
        </div>
        <div className="field">
            <label>Initial severity</label>
            <select value={form.initialSeverity} 
             onChange={(event) => update(
              "initialSeverity",
              event.target.value
             )}
            >
                <option value="">Select severity</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
            </select>
         </div>
         <div className="form-actions">
            <button className="primary-button" disabled={isSaving || !hasAiDraft}
             onClick={() => dispatch(saveCurrentDeviation())}
            >
                {isSaving ? "Saving..." : "Save Deviation"}
            </button>
         </div>
         {
            savedDeviationId && (
                <div className="success-box">
                    <strong>✓ Deviation saved successfully</strong>
                    <span>Record ID: #{savedDeviationId}</span>
                </div>
            )
         }
        </div>
    )
}
