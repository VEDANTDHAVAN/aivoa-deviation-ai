import AIAssistant
  from "../components/ai/AIAssistant";

import DeviationForm
  from "../components/deviation/DeviationForm";
import { Link } from "react-router-dom";


export default function DeviationPage() {

  return (
    <div className="page">
      <main className="content">
        <div className="page-header">
          <div>
            <span className="eyebrow">
              QUALITY MANAGEMENT
            </span>
            <h1>
              Log Deviation
            </h1>
            <p>
              Capture, assess and review
              manufacturing deviations.
            </p>
          </div>
          <div className="page-actions">
            <Link className="contextual-link" to="/">Back to Dashboard</Link>
          </div>
        </div>

        <div className="workspace">
          <section className="panel">
            <DeviationForm />
          </section>
          <section className="panel">
            <AIAssistant />
          </section>
        </div>
      </main>
    </div>
  );
}
