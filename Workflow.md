# AIVOA.AI End-to-End Demo Workflow

This document demonstrates the complete AIVOA.AI deviation-management workflow and explains the code responsible for each stage.

The demo scenario is an API manufacturing batch where a process parameter exceeds its approved range.

```text
User input
   ↓
AI Assistant
   ↓
FastAPI analysis endpoint
   ↓
Document/text processing
   ↓
LangGraph extraction and assessment
   ↓
Structured AI response
   ↓
Redux state and editable Log Deviation form
   ↓
Human review and correction
   ↓
FastAPI create endpoint
   ↓
SQLAlchemy and PostgreSQL
   ↓
Dashboard, detail, and edit pages
```

## 1. Start the demo

Start PostgreSQL from the project root:

```bash
docker compose up -d postgres
```

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend requires a configured `backend/.env` file. At minimum, configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aivoa_deviation
GROQ_API_KEY=your-provider-key
GROQ_MODEL=your-configured-model
FRONTEND_URL=http://localhost:5173
```

The frontend uses `VITE_API_URL` when provided and otherwise defaults to `http://localhost:8000`.

## 2. Open the dashboard

The root route is:

```text
/
```

It renders `DeviationDashboard`.

Relevant route configuration in `frontend/src/App.tsx`:

```tsx
<Route path="/" element={<DeviationDashboard />} />
<Route path="/deviations/new" element={<DeviationPage />} />
<Route path="/deviations/:id/edit" element={<DeviationEditPage />} />
<Route path="/deviations/:id" element={<DeviationDetail />} />
<Route path="*" element={<NotFoundPage />} />
```

The dashboard loads saved records when it mounts:

```tsx
useEffect(() => {
  dispatch(fetchDeviations());
}, [dispatch]);
```

`fetchDeviations` is a Redux async thunk. It calls the Axios service:

```ts
export async function getDeviations(): Promise<DeviationResponse[]> {
  const response = await api.get("/api/deviations");
  return response.data.map(mapDeviation);
}
```

The service maps backend snake_case fields into the frontend camelCase response model before the dashboard renders them.

## 3. Navigate to Log Deviation

Click `Log Deviation` in the reusable navbar or navigate directly to:

```text
/deviations/new
```

The page is implemented in `frontend/src/pages/DeviationPage.tsx` and renders two coordinated panels:

```tsx
<div className="workspace">
  <section className="panel">
    <DeviationForm />
  </section>
  <section className="panel">
    <AIAssistant />
  </section>
</div>
```

The right-side `AIAssistant` is the primary entry point. The left-side `DeviationForm` is intended for review and correction after AI analysis.

## 4. Provide deviation input

The AI panel supports two input paths.

### Option A: Paste text or email content

The textarea is controlled by Redux:

```tsx
<textarea
  value={sourceText}
  onChange={(event) =>
    dispatch(setSourceText(event.target.value))
  }
/>
```

The placeholder supports several source types:

```text
Paste deviation details, email, investigation note, or manufacturing event...
```

Clicking `Analyze with AI` dispatches:

```tsx
dispatch(
  runDeviationAnalysis({
    text: sourceText,
  })
);
```

### Option B: Upload a document

The file input accepts the formats supported by the backend:

```tsx
<input
  type="file"
  accept=".pdf,.docx,.txt"
  hidden
  onChange={handleFile}
/>
```

Selecting a file dispatches analysis immediately:

```tsx
dispatch(
  runDeviationAnalysis({
    file,
  })
);
```

The frontend sends text and files as `multipart/form-data`:

```ts
export async function analyzeDeviation(
  text?: string,
  file?: File,
): Promise<AnalysisResult> {
  const formData = new FormData();

  if (text?.trim()) {
    formData.append("text", text.trim());
  }

  if (file) {
    formData.append("file", file);
  }

  const response = await api.post(
    "/api/deviations/analyze",
    formData,
  );

  return {
    deviation: mapAnalysisDeviation(response.data.data.deviation),
    assessment: response.data.data.assessment,
  };
}
```

## 5. Backend receives the analysis request

The FastAPI route is defined in `backend/app/api/routes/deviations.py`:

```python
@router.post("/analyze")
async def analyze_deviation(
    text: Annotated[str | None, Form()] = None,
    file: UploadFile | None = File(default=None),
):
```

The route establishes the source text:

```python
source_text = ""

if text and text.strip():
    source_text = text.strip()

if file:
    content = await file.read()
    source_text = parse_document(
        file.filename or "",
        content,
    )
```

If both fields are sent, the uploaded file is parsed and becomes the analysis source.

Before AI execution, the route rejects:

- Missing input
- Empty extracted documents
- Input shorter than 20 characters
- Unsupported file extensions
- Invalid PDF or DOCX files
- Oversized normalized source text

Example empty-input response:

```json
{
  "detail": {
    "code": "EMPTY_INPUT",
    "message": "Provide deviation text or upload a PDF, DOCX, or TXT file."
  }
}
```

## 6. Document parsing

The parser is implemented in `backend/app/services/document_parser.py`.

### PDF

The parser checks the PDF signature before calling `pypdf`:

```python
if not content.lstrip().startswith(b"%PDF-"):
    raise ValueError(
        "The uploaded file is not a valid PDF."
    )
```

This prevents a text file renamed to `.pdf` from producing a low-level parser error such as:

```text
PdfStreamError: Stream has ended unexpectedly
```

Valid PDF pages are extracted and joined into one source string.

### DOCX

`python-docx` reads non-empty paragraphs:

```python
paragraphs = [
    paragraph.text.strip()
    for paragraph in document.paragraphs
    if paragraph.text.strip()
]
```

Invalid or corrupted DOCX files are converted into a safe validation error.

### TXT

TXT files are decoded as UTF-8 with a safe replacement strategy:

```python
return content.decode("utf-8", errors="ignore").strip()
```

## 7. LangGraph AI workflow

After input validation, the API invokes the compiled graph:

```python
result = deviation_graph.invoke(
    {
        "source_text": source_text,
    }
)
```

The graph is built in `backend/app/ai/graph.py`:

```python
graph.add_node("extract_deviation", extract_deviation)
graph.add_node("assess_impact", assess_impact)
graph.add_node("assess_severity", assess_severity)

graph.add_edge(START, "extract_deviation")
graph.add_edge("extract_deviation", "assess_impact")
graph.add_edge("assess_impact", "assess_severity")
graph.add_edge("assess_severity", END)
```

The execution sequence is:

```text
START
  ↓
extract_deviation
  ↓
assess_impact
  ↓
assess_severity
  ↓
END
```

### 7.1 Extraction

The extraction node normalizes and validates the source:

```python
source_text = normalize_text(
    state.get("source_text") or ""
)

if not source_text:
    raise ValueError("Source material is empty.")

if len(source_text) > settings.max_source_characters:
    raise ValueError("Source material exceeds the maximum allowed length.")
```

It then calls the configured LLM with structured output:

```python
extraction_llm = llm.with_structured_output(
    DeviationExtraction
)
```

The extraction schema includes:

```python
class DeviationExtraction(BaseModel):
    site: str = ""
    date_of_occurrence: str = ""
    title: str = ""
    source: str = ""
    product_material: str = ""
    batch_lot_number: str = ""
    description: str = ""
    initial_impact: str = ""
    initial_severity: Severity | None = None
```

The prompt instructs the model to extract only facts supported by the input and not invent missing dates, products, batches, sites, impacts, or process parameters.

### 7.2 Impact assessment

The impact node receives the extracted deviation information:

```python
impact_llm = llm.with_structured_output(
    ImpactAssessment
)
```

The result contains:

```python
class ImpactAssessment(BaseModel):
    impact: str
    reason: str
```

The impact prompt requests a concise potential impact statement and a short evidence-based reason.

### 7.3 Severity assessment

The severity node receives both extracted facts and the impact assessment:

```python
severity_llm = llm.with_structured_output(
    SeverityAssessment
)
```

The severity schema restricts the recommendation to:

```python
Severity = Literal["Critical", "Major", "Minor"]
```

The result contains the recommendation and a reason:

```python
class SeverityAssessment(BaseModel):
    severity: Severity
    reason: str
```

The prompt describes the meaning of each severity and explicitly states that the result is an initial recommendation, not a final quality decision.

### 7.4 Retry behavior

Each AI operation is wrapped by `backend/app/ai/retry.py`:

```python
def retry(operation, retries=2):
    for _ in range(retries + 1):
        try:
            return operation()
        except Exception as exc:
            last_error = exc

    raise last_error
```

This provides three total attempts for provider failures or invalid structured output.

## 8. API returns the structured result

The route converts graph state into the frontend-facing response:

```python
return {
    "success": True,
    "data": {
        "deviation": result["extracted_data"],
        "assessment": {
            "impact": result.get("impact", ""),
            "impact_reason": result.get("impact_reason", ""),
            "severity": result.get("severity", ""),
            "severity_reason": result.get("severity_reason", ""),
        },
    },
}
```

The frontend service maps the nested AI extraction into its form model:

```ts
function mapAnalysisDeviation(data): Deviation {
  return {
    site: data.site ?? "",
    dateOfOccurrence: data.date_of_occurrence ?? "",
    title: data.title ?? "",
    source: data.source ?? "",
    productMaterial: data.product_material ?? "",
    batchLotNumber: data.batch_lot_number ?? "",
    description: data.description ?? "",
    initialImpact: data.initial_impact ?? "",
    initialSeverity: data.initial_severity ?? "",
  };
}
```

This mapping is important because the API uses snake_case while React form state uses camelCase.

## 9. Redux updates the form

The `runDeviationAnalysis` thunk calls the API and exposes loading/error states:

```ts
export const runDeviationAnalysis = createAsyncThunk<
  AnalysisResult,
  { text?: string; file?: File },
  { rejectValue: string }
>("deviation/runAnalysis", async ({ text, file }, { rejectWithValue }) => {
  try {
    return await analyzeDeviation(text, file);
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.detail?.message ||
      error?.message ||
      "AI analysis failed."
    );
  }
});
```

When analysis succeeds, the reducer updates both the AI draft and the editable form:

```ts
runDeviationAnalysis.fulfilled,
(state, action) => {
  state.isAnalyzing = false;
  state.aiDraft = action.payload.deviation;
  state.form = action.payload.deviation;
  state.assessment = action.payload.assessment;
  state.error = null;
}
```

This is the key AI-first transition:

```text
AI response
   ↓
mapAnalysisDeviation
   ↓
Redux aiDraft + form
   ↓
React controlled inputs render extracted values
```

## 10. User reviews and edits

`DeviationForm` reads the Redux form state:

```tsx
const form = useAppSelector(
  (state) => state.deviation.form
);
```

Every input is controlled and dispatches a field update:

```tsx
<input
  value={form.site}
  onChange={(event) =>
    update("site", event.target.value)
  }
/>
```

The reducer changes only the selected editable field:

```ts
updateField(state, action) {
  state.form[action.payload.field] = action.payload.value as never;
}
```

The AI panel displays the recommendation separately:

```tsx
<p>{assessment.impact}</p>
<small>{assessment.impact_reason}</small>

<div className={`severity severity-${assessment.severity.toLowerCase()}`}>
  {assessment.severity}
</div>

<p>{assessment.severity_reason}</p>
```

The UI tells the user that AI-generated values have been placed in the form and must be reviewed before saving.

## 11. Save the final reviewed deviation

The form save button is disabled until AI analysis has produced an `aiDraft`:

```tsx
const hasAiDraft = useAppSelector(
  (state) => Boolean(state.deviation.aiDraft)
);

<button
  disabled={isSaving || !hasAiDraft}
>
  {isSaving ? "Saving..." : "Save Deviation"}
</button>
```

The save thunk validates the edited form and sends both the final form values and the separate AI assessment:

```ts
const validationError = validateDeviation(state.form);

if (validationError) {
  return rejectWithValue(validationError);
}

if (!state.aiDraft) {
  return rejectWithValue(
    "Analyze the deviation with AI before saving."
  );
}

return await saveDeviation(
  state.form,
  state.assessment,
);
```

The request payload maps the fields back into backend format:

```ts
{
  site: deviation.site,
  date_of_occurrence: deviation.dateOfOccurrence,
  title: deviation.title,
  source: deviation.source,
  product_material: deviation.productMaterial,
  batch_lot_number: deviation.batchLotNumber,
  description: deviation.description,
  initial_impact: deviation.initialImpact,
  initial_severity: deviation.initialSeverity,
  ai_impact: assessment?.impact ?? null,
  ai_impact_reason: assessment?.impact_reason ?? null,
  ai_severity: assessment?.severity ?? null,
  ai_severity_reason: assessment?.severity_reason ?? null,
}
```

## 12. Backend persistence

The create route validates the request with Pydantic and delegates to the repository:

```python
@router.post("", response_model=DeviationResponse, status_code=201)
def create_single_deviation(
    data: DeviationCreate,
    db: Session = Depends(get_db),
):
    return create_deviation(db, data)
```

The repository creates the SQLAlchemy model, commits, and refreshes it:

```python
def create_deviation(db: Session, data: DeviationCreate) -> Deviation:
    deviation = Deviation(**data.model_dump())
    db.add(deviation)
    db.commit()
    db.refresh(deviation)
    return deviation
```

The database stores the final human-reviewed fields separately from AI provenance fields:

```text
Human-reviewed: initial_impact, initial_severity, description, ...
AI provenance:  ai_impact, ai_impact_reason, ai_severity, ai_severity_reason
System:         id, created_at, updated_at
```

## 13. Saved record and dashboard result

After a successful create response, Redux stores the generated ID:

```ts
saveCurrentDeviation.fulfilled,
(state, action) => {
  state.isSaving = false;
  state.savedDeviationId = action.payload.id;
}
```

The form displays a confirmation:

```text
Deviation saved successfully
Record ID: #42
```

Returning to `/` loads the saved record through:

```http
GET /api/deviations
```

The dashboard displays:

- ID
- Title
- Site
- Batch/lot number
- Severity
- Date

Clicking a title navigates client-side to:

```text
/deviations/:id
```

## 14. Detail and edit demo

### Detail page

The detail page calls:

```ts
getDeviation(Number(id))
```

which maps the persisted backend record into `DeviationResponse`.

The page separates:

```text
User-entered information
AI-generated recommendation
Created/updated timestamps
```

The `Edit Deviation` action navigates to:

```text
/deviations/:id/edit
```

### Edit page

The edit page loads the existing record, copies editable fields into local form state, and sends updates through:

```http
PUT /api/deviations/{id}
```

The primary key is never included as an editable field. The backend repository updates the model fields and refreshes the record so the updated timestamp is returned.

After a successful save, the edit page navigates back to the detail page.

## 15. Error and loading states in the demo

The expected UI states include:

```text
Loading deviations...
Loading deviation...
AI is analyzing the deviation
Saving...
AI analysis failed
Deviation could not be loaded
Invalid or corrupted document message
No deviations found
```

The API uses safe error messages rather than returning raw stack traces to the browser. For example, an invalid PDF is reported as a client-readable validation error instead of exposing `pypdf` internals.

## 16. Manual demo script

Use this script for a complete walkthrough:

1. Start PostgreSQL, FastAPI, and Vite.
2. Open `http://localhost:5173`.
3. Confirm the dashboard loads.
4. Click `Log Deviation` in the navbar.
5. Paste the following text into the AI panel:

   ```text
   On 2026-09-25 at API Plant 1, Manufacturing reported that the mixing temperature for Example API batch B-2026-001 exceeded the approved range. The event was detected during in-process monitoring. The batch is on hold pending investigation. No final product impact has been confirmed.
   ```

6. Click `Analyze with AI`.
7. Confirm that the left-side form is automatically populated.
8. Confirm that the right-side panel shows potential impact, impact reason, severity recommendation, and severity reason.
9. Edit one or more extracted fields, such as the description or initial severity.
10. Click `Save Deviation`.
11. Confirm the save message and record ID.
12. Return to the dashboard.
13. Confirm the new record appears in the table.
14. Click the record title.
15. Confirm the detail page separates human-reviewed information from the AI recommendation.
16. Click `Edit Deviation`.
17. Change a field and click `Save Changes`.
18. Confirm the detail page shows the updated value and timestamp.
19. Navigate to an unknown path such as `/does-not-exist`.
20. Confirm the 404 page provides a working `Back to Dashboard` action.

## 17. Production verification

Build and preview the frontend:

```bash
cd frontend
npm run build
npm run preview
```

Compile-check the backend:

```bash
cd backend
python -m compileall -q app
```

Verify the following manually in the deployed environment:

- Direct refresh of `/`
- Direct refresh of `/deviations/new`
- Direct refresh of `/deviations/{id}`
- Direct refresh of `/deviations/{id}/edit`
- Invalid route fallback
- Correct `VITE_API_URL`
- Correct backend CORS origin
- PostgreSQL connectivity
- Configured Groq model
- No secrets committed
- Safe invalid-document errors
