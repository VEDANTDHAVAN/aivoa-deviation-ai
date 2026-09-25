import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDeviation } from "../services/deviationApi";
import type { DeviationResponse } from "../types/deviation";

export default function DeviationDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState<DeviationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (id) getDeviation(Number(id)).then(setRecord).catch(() => setError("Deviation could not be loaded.")); }, [id]);
  if (error) return <main className="content"><div className="error-box">{error}</div><Link to="/">Back to Dashboard</Link></main>;
  if (!record) return <main className="content"><div className="empty-state">Loading deviation...</div></main>;
  return <div className="page"><main className="content"><div className="page-header"><span className="eyebrow">DEVIATION #{record.id}</span><h1>{record.title}</h1><p>Human-entered record and AI recommendation.</p></div><section className="panel"><h2>User-entered information</h2><p><strong>Site:</strong> {record.site}</p><p><strong>Date:</strong> {record.dateOfOccurrence}</p><p><strong>Source:</strong> {record.source}</p><p><strong>Product / Material:</strong> {record.productMaterial}</p><p><strong>Batch / Lot:</strong> {record.batchLotNumber}</p><p><strong>Description:</strong> {record.description}</p><p><strong>Initial impact:</strong> {record.initialImpact}</p><p><strong>Initial severity:</strong> {record.initialSeverity}</p><hr/><h2>AI-generated recommendation</h2><p>AI assessment is stored separately from the human-entered record.</p><small>Created {record.createdAt} · Updated {record.updatedAt}</small><div className="form-actions"><Link className="secondary-button" to="/">Back to Dashboard</Link></div></section></main></div>;
}
