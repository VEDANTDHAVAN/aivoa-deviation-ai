import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDeviation, updateDeviation } from "../services/deviationApi";
import type { AIAssessment, Deviation, DeviationResponse } from "../types/deviation";

const emptyForm: Deviation = {
  site: "",
  dateOfOccurrence: "",
  title: "",
  source: "",
  productMaterial: "",
  batchLotNumber: "",
  description: "",
  initialImpact: "",
  initialSeverity: "",
};

function toForm(record: DeviationResponse): Deviation {
  return {
    site: record.site,
    dateOfOccurrence: record.dateOfOccurrence,
    title: record.title,
    source: record.source,
    productMaterial: record.productMaterial,
    batchLotNumber: record.batchLotNumber,
    description: record.description,
    initialImpact: record.initialImpact,
    initialSeverity: record.initialSeverity,
  };
}

export default function DeviationEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DeviationResponse | null>(null);
  const [form, setForm] = useState<Deviation>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !Number.isInteger(Number(id))) {
      setError("Deviation could not be found.");
      setIsLoading(false);
      return;
    }
    getDeviation(Number(id))
      .then((loaded) => {
        setRecord(loaded);
        setForm(toForm(loaded));
      })
      .catch(() => setError("Deviation could not be loaded."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const updateField = (field: keyof Deviation, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!record || !id) return;
    setIsSaving(true);
    setError(null);
    const assessment: AIAssessment | null = record.aiSeverity && record.aiImpact
      ? {
          impact: record.aiImpact,
          impact_reason: record.aiImpactReason ?? "",
          severity: record.aiSeverity,
          severity_reason: record.aiSeverityReason ?? "",
        }
      : null;
    try {
      await updateDeviation(Number(id), form, assessment);
      navigate(`/deviations/${id}`);
    } catch {
      setError("Changes could not be saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <main className="content"><div className="empty-state">Loading deviation...</div></main>;
  if (error || !record) return <main className="content"><div className="error-box">{error ?? "Deviation could not be found."}</div><Link className="contextual-link" to="/">Back to Dashboard</Link></main>;

  return (
    <main className="content">
      <div className="page-header">
        <div>
          <span className="eyebrow">QUALITY MANAGEMENT</span>
          <h1>Edit Deviation #{record.id}</h1>
          <p>Update the reviewed deviation record.</p>
        </div>
        <div className="page-actions">
          <Link className="contextual-link" to={`/deviations/${record.id}`}>Back to Details</Link>
          <Link className="contextual-link" to="/">Dashboard</Link>
        </div>
      </div>
      <section className="panel edit-panel">
        {error && <div className="error-box">{error}</div>}
        <div className="two-column">
          <div className="field"><label htmlFor="edit-site">Site</label><input id="edit-site" value={form.site} onChange={(e) => updateField("site", e.target.value)} /></div>
          <div className="field"><label htmlFor="edit-date">Date of occurrence</label><input id="edit-date" type="date" value={form.dateOfOccurrence} onChange={(e) => updateField("dateOfOccurrence", e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="edit-title">Deviation title</label><input id="edit-title" value={form.title} onChange={(e) => updateField("title", e.target.value)} /></div>
        <div className="field"><label htmlFor="edit-source">Source</label><input id="edit-source" value={form.source} onChange={(e) => updateField("source", e.target.value)} /></div>
        <div className="two-column">
          <div className="field"><label htmlFor="edit-product">Product / Material</label><input id="edit-product" value={form.productMaterial} onChange={(e) => updateField("productMaterial", e.target.value)} /></div>
          <div className="field"><label htmlFor="edit-batch">Batch / Lot</label><input id="edit-batch" value={form.batchLotNumber} onChange={(e) => updateField("batchLotNumber", e.target.value)} /></div>
        </div>
        <div className="field"><label htmlFor="edit-description">Description</label><textarea id="edit-description" rows={6} value={form.description} onChange={(e) => updateField("description", e.target.value)} /></div>
        <div className="field"><label htmlFor="edit-impact">Initial impact</label><textarea id="edit-impact" rows={3} value={form.initialImpact} onChange={(e) => updateField("initialImpact", e.target.value)} /></div>
        <div className="field"><label htmlFor="edit-severity">Initial severity</label><select id="edit-severity" value={form.initialSeverity} onChange={(e) => updateField("initialSeverity", e.target.value)}><option value="">Select severity</option><option value="Critical">Critical</option><option value="Major">Major</option><option value="Minor">Minor</option></select></div>
        <div className="form-actions">
          <button className="primary-button" disabled={isSaving} onClick={handleSubmit}>{isSaving ? "Saving..." : "Save Changes"}</button>
          <Link className="secondary-button contextual-link" to={`/deviations/${record.id}`}>Cancel</Link>
        </div>
      </section>
    </main>
  );
}
