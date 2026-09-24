import AIAssistant
  from "../components/ai/AIAssistant";

import DeviationForm
  from "../components/deviation/DeviationForm";


export default function DeviationPage() {

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            A
          </div>
          <div>
            <strong>
              AIVOA.AI
            </strong>
            <span>
              Deviation Management
            </span>
          </div>
        </div>
      </header>
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