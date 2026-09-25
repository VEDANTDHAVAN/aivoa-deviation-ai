import {
  type ChangeEvent,
  useRef,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../../app/hooks";

import {
  runDeviationAnalysis,
  setSelectedFileName,
  setSourceText,
} from "../../features/deviation/deviationSlice";


export default function AIAssistant() {

  const dispatch =
    useAppDispatch();

  const fileInputRef =
    useRef<HTMLInputElement>(null);


  const {
    sourceText,
    selectedFileName,
    assessment,
    isAnalyzing,
    error,
  } =
    useAppSelector(
      (state) =>
        state.deviation
    );


  const handleFile =
    (event: ChangeEvent<HTMLInputElement>) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      dispatch(
        setSelectedFileName(
          file.name
        )
      );

      dispatch(
        runDeviationAnalysis({
          file,
        })
      );
    };


  const analyzeText = () => {

    if (!sourceText.trim()) {
      return;
    }

    dispatch(
      runDeviationAnalysis({
        text: sourceText,
      })
    );
  };


  return (
    <div className="ai-assistant">

      <div className="section-heading">

        <div>
          <h2>
            AI Deviation Assistant
          </h2>

          <p>
            Upload a deviation document
            or paste the event details.
          </p>
        </div>

        <span className="ai-badge">
          AI
        </span>

      </div>


      <div
        className="upload-zone"
        onClick={() =>
          fileInputRef.current?.click()
        }
      >

        <div className="upload-icon">
          ↑
        </div>

        <strong>
          Drop your document here
        </strong>

        <span>
          PDF, DOCX or TXT
        </span>

        {selectedFileName && (
          <small>
            Selected: {selectedFileName}
          </small>
        )}

      </div>


      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        hidden
        onChange={handleFile}
      />


      <div className="or-divider">
        <span>OR</span>
      </div>


      <textarea
        className="source-input"
        rows={8}
        value={sourceText}
        onChange={(event) =>
          dispatch(
            setSourceText(
              event.target.value
            )
          )
        }
        placeholder={
          "Paste deviation details, email, " +
          "investigation note, or manufacturing event..."
        }
      />


      <button
        className="primary-button"
        disabled={
          isAnalyzing ||
          !sourceText.trim()
        }
        onClick={analyzeText}
      >

        {isAnalyzing
          ? "Analyzing..."
          : "Analyze with AI"}

      </button>


      {isAnalyzing && (
        <div className="analysis-status">

          <div className="spinner" />

          <div>
            <strong>
              AI is analyzing the deviation
            </strong>

            <span>
              Extracting information and
              assessing potential impact...
            </span>
          </div>

        </div>
      )}


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {assessment && !isAnalyzing && (
        <div className="assessment">

          <div className="assessment-header">

            <div>
              <span>
                AI ANALYSIS
              </span>

              <h3>
                Assessment complete
              </h3>
            </div>

            <span className="success">
              ✓
            </span>

          </div>


          <div className="assessment-section">

            <span className="label">
              Potential impact
            </span>

            <p>
              {assessment.impact}
            </p>

            <small>
              {assessment.impact_reason}
            </small>

          </div>


          <div className="assessment-section">

            <span className="label">
              Recommended severity
            </span>

            <div
              className={`severity severity-${assessment.severity.toLowerCase()}`}
            >
              {assessment.severity}
            </div>

          </div>


          <div className="assessment-section">

            <span className="label">
              Reason
            </span>

            <p>
              {assessment.severity_reason}
            </p>

          </div>


          <p className="ai-review-note">
            AI-generated values have been populated in the Log Deviation form. Review and edit them before saving.
          </p>

        </div>
      )}

    </div>
  );
}
