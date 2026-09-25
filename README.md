# AIVOA.AI

AIVOA.AI is an AI-assisted pharmaceutical and API manufacturing deviation-management application. It accepts a deviation document or pasted event text, extracts structured deviation information with an LLM workflow, presents the result in an editable deviation form, provides an initial impact and severity recommendation, and persists the human-reviewed record in PostgreSQL.

The project is intentionally organized as a conventional frontend/backend application:

```text
React + TypeScript + Vite
        │
        │ Axios / JSON / multipart form data
        ▼
FastAPI
        │
        ├── document parsing and input validation
        ├── LangGraph AI workflow
        ├── service/repository layer
        ▼
SQLAlchemy + PostgreSQL
```

## Core workflow

The primary user workflow is AI-first:

```text
Open Log Deviation
        ↓
Upload PDF/DOCX/TXT or paste deviation text/email
        ↓
POST /api/deviations/analyze
        ↓
Extract document text
        ↓
LangGraph extraction → impact assessment → severity assessment
        ↓
Return structured AI result
        ↓
Map backend snake_case fields to frontend camelCase fields
        ↓
Automatically populate the left Log Deviation form
        ↓
User reviews and edits the values
        ↓
POST /api/deviations
        ↓
Persist final reviewed values and AI assessment in PostgreSQL
```

The frontend requires a successful AI analysis before the deviation can be saved. The form remains editable so the human reviewer is authoritative over the final deviation fields.

## Repository structure

```text
.
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── graph.py              # LangGraph workflow and LLM calls
│   │   │   ├── prompts.py            # Extraction, impact, severity prompts
│   │   │   ├── schemas.py            # Structured AI output schemas
│   │   │   ├── state.py              # LangGraph state
│   │   │   └── retry.py              # LLM retry helper
│   │   ├── api/
│   │   │   ├── routes/deviations.py  # FastAPI deviation endpoints
│   │   │   └── schemas.py             # Request/response models
│   │   ├── db/database.py             # SQLAlchemy engine and get_db
│   │   ├── models/deviation.py        # Deviation database model
│   │   ├── repositories/              # Database operations
│   │   ├── services/
│   │   │   ├── document_parser.py     # PDF/DOCX/TXT extraction
│   │   │   └── text_normalizer.py     # Input normalization
│   │   ├── config.py                  # Environment configuration
│   │   └── main.py                    # FastAPI application
│   ├── .env.example
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/AIAssistant.tsx
│   │   │   ├── deviation/DeviationForm.tsx
│   │   │   └── navigation/Navbar.tsx
│   │   ├── features/deviation/
│   │   │   ├── deviationSlice.ts      # Redux state and async workflows
│   │   │   └── validation.ts
│   │   ├── pages/                     # Dashboard, create, detail, edit, 404
│   │   ├── services/deviationApi.ts   # Axios client and field mapping
│   │   ├── types/deviation.ts         # Form, persisted, and AI types
│   │   ├── App.tsx                    # BrowserRouter and route definitions
│   │   └── main.tsx                   # React and Redux bootstrap
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json                    # SPA refresh rewrite for Vercel
├── docker-compose.yml                 # Local PostgreSQL service
└── README.md
```

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Redux Toolkit and React Redux
- React Router
- Axios
- CSS-based existing UI system

### Backend

- FastAPI
- Pydantic v2 and pydantic-settings
- SQLAlchemy 2
- PostgreSQL via psycopg2
- LangGraph
- LangChain Groq integration
- `pypdf` for PDF text extraction
- `python-docx` for DOCX text extraction
- Uvicorn

## Prerequisites

- Node.js and npm
- Python 3.11 or later
- Docker Desktop, or a locally running PostgreSQL 16-compatible server
- A configured Groq API key and model name

## Local setup

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

The compose file exposes PostgreSQL on port `5432` with:

```text
user:     postgres
password: postgres
database: aivoa_deviation
```

The default database URL is:

```text
postgresql://postgres:postgres@localhost:5432/aivoa_deviation
```

### 2. Configure the backend

```bash
cd backend
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Set `GROQ_API_KEY` in `backend/.env`. Keep the key private and do not commit `.env`.

Important backend variables:

| Variable | Purpose | Example |
|---|---|---|
| `APP_ENV` | Runtime environment label | `development` |
| `DATABASE_URL` | SQLAlchemy PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/aivoa_deviation` |
| `GROQ_API_KEY` | LLM provider credential | secret value |
| `GROQ_MODEL` | Configured Groq model name | `openai/gpt-oss-120b` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `MAX_SOURCE_CHARACTERS` | Maximum normalized AI input length | `30000` |

Install backend dependencies with either approach:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1       # Windows PowerShell
# source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
```

Or, when using uv:

```bash
uv sync
```

### 3. Start FastAPI

The application entry point is `app.main:app`:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify the service:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "aivoa-deviation-api"
}
```

### 4. Configure and start the frontend

In a second terminal:

```bash
cd frontend
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for the API. Set `VITE_API_URL` when the backend is hosted elsewhere:

```env
VITE_API_URL=http://localhost:8000
```

Open [http://localhost:5173](http://localhost:5173).

## Frontend routes

Routing is defined in `frontend/src/App.tsx`. The reusable navigation is in `frontend/src/components/navigation/Navbar.tsx`.

| Route | Page | Purpose |
|---|---|---|
| `/` | `DeviationDashboard` | List, search, and filter saved deviations |
| `/deviations/new` | `DeviationPage` | AI-assisted deviation creation |
| `/deviations/:id` | `DeviationDetail` | Review one saved deviation and its AI assessment |
| `/deviations/:id/edit` | `DeviationEditPage` | Edit and persist an existing deviation |
| `*` | `NotFoundPage` | Invalid route with a return-home action |

React Router `Link` and `NavLink` components provide client-side navigation without full-page reloads. `Navbar` highlights the dashboard context and Log Deviation route. `frontend/vercel.json` rewrites unknown document requests to `index.html` so browser refreshes work for client-side routes on Vercel.

## Frontend data flow

### Application bootstrap

`frontend/src/main.tsx` creates the React root, wraps the application in Redux `Provider`, imports global CSS, and renders `App`.

`frontend/src/app/store.ts` registers the `deviation` reducer. Components use typed hooks from `frontend/src/app/hooks.ts`.

### Creation page

`DeviationPage` renders two coordinated panels:

1. `DeviationForm` on the left
2. `AIAssistant` on the right

The AI panel accepts either:

- A PDF, DOCX, or TXT file selected through the file input
- Pasted deviation text, email content, investigation notes, or manufacturing event details

Selecting a file immediately dispatches `runDeviationAnalysis({ file })`. Pasted text is submitted by the `Analyze with AI` button through `runDeviationAnalysis({ text })`.

### Redux state

The deviation slice separates editable form state from persisted records:

```ts
form: Deviation;
aiDraft: Deviation | null;
assessment: AIAssessment | null;
deviations: DeviationResponse[];
```

`runDeviationAnalysis.fulfilled` stores the mapped AI draft in both `aiDraft` and `form`. This automatically populates the left form while keeping the AI result available as provenance. The form inputs continue dispatching `updateField`, allowing the reviewer to correct any AI-generated value.

The save thunk validates the editable form and requires `aiDraft` to exist before calling the API. This prevents an empty/manual-only form from bypassing the AI-assisted workflow.

### API field mapping

The backend uses snake_case field names, while the frontend uses camelCase form names. `frontend/src/services/deviationApi.ts` contains the explicit mappings.

Example:

```text
date_of_occurrence  → dateOfOccurrence
product_material    → productMaterial
batch_lot_number    → batchLotNumber
created_at          → createdAt
updated_at          → updatedAt
```

The same service converts edited frontend state back into the backend request shape before create and update requests.

## Backend API

The FastAPI router in `backend/app/api/routes/deviations.py` is mounted under `/api/deviations`.

### Analyze input

```http
POST /api/deviations/analyze
Content-Type: multipart/form-data
```

Accepted form fields:

```text
text: optional pasted text/email content
file: optional PDF, DOCX, or TXT upload
```

The backend accepts either source. When both are supplied, the uploaded file is parsed into `source_text` and takes precedence over the text field.

Successful response shape:

```json
{
  "success": true,
  "data": {
    "deviation": {
      "site": "API Plant 1",
      "date_of_occurrence": "2026-09-25",
      "title": "Process parameter outside approved range",
      "source": "Manufacturing",
      "product_material": "Example API",
      "batch_lot_number": "B-2026-001",
      "description": "The process temperature exceeded the approved range.",
      "initial_impact": "Potential product quality impact.",
      "initial_severity": null
    },
    "assessment": {
      "impact": "Potential impact to product quality and process control.",
      "impact_reason": "The approved process parameter was exceeded during batch manufacture.",
      "severity": "Major",
      "severity_reason": "The event may affect process control, but available facts do not establish a critical impact."
    }
  }
}
```

### Create a deviation

```http
POST /api/deviations
Content-Type: application/json
```

The frontend sends the final reviewed form values plus the original AI assessment:

```json
{
  "site": "API Plant 1",
  "date_of_occurrence": "2026-09-25",
  "title": "Process parameter outside approved range",
  "source": "Manufacturing",
  "product_material": "Example API",
  "batch_lot_number": "B-2026-001",
  "description": "Human-reviewed description",
  "initial_impact": "Human-reviewed initial impact",
  "initial_severity": "Major",
  "ai_impact": "Potential impact to product quality and process control.",
  "ai_impact_reason": "The approved process parameter was exceeded during batch manufacture.",
  "ai_severity": "Major",
  "ai_severity_reason": "The event may affect process control."
}
```

The primary key and timestamps are generated by the backend/database and are not accepted as editable form fields.

### List deviations

```http
GET /api/deviations?limit=50&offset=0&search=&severity=&site=
```

The repository orders records by newest `created_at` first. Search currently checks title, batch/lot number, and site. The current dashboard fetches the collection and applies its visible search/severity filtering in the browser.

### Get one deviation

```http
GET /api/deviations/{deviation_id}
```

Returns the persisted record, including human-reviewed fields, AI assessment fields, and timestamps. A missing ID returns `404 Deviation not found.`

### Update one deviation

```http
PUT /api/deviations/{deviation_id}
Content-Type: application/json
```

The edit page loads the existing record, lets the user change editable fields, and sends the updated values through the existing update endpoint. The `id` is taken from the URL and is never included as an editable field. SQLAlchemy updates `updated_at` through the model’s `onupdate` configuration.

### Dashboard statistics

```http
GET /api/deviations/stats
```

Returns counts derived from stored PostgreSQL records:

```json
{
  "total": 42,
  "critical": 5,
  "major": 21,
  "minor": 16
}
```

## Document processing

`backend/app/services/document_parser.py` supports:

- `.pdf`: text extraction with `pypdf`
- `.docx`: paragraph extraction with `python-docx`
- `.txt`: UTF-8 text decoding

The parser validates the PDF signature before calling `pypdf`. This prevents a text file renamed with a `.pdf` extension from producing a low-level error such as `PdfStreamError: Stream has ended unexpectedly`. Invalid or corrupted files return a safe validation message through the API.

After extraction, the API rejects empty input and input shorter than 20 characters. The AI graph also normalizes whitespace and rejects input longer than `MAX_SOURCE_CHARACTERS`.

## AI/LangGraph workflow

The workflow is built once in `backend/app/ai/graph.py`:

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

### 1. Extraction node

`extract_deviation`:

1. Normalizes the source text.
2. Rejects empty or oversized input.
3. Sends the extraction prompt and source material to the configured Groq model.
4. Uses `with_structured_output(DeviationExtraction)`.
5. Validates the returned object with Pydantic.
6. Stores the serialized result in LangGraph state as `extracted_data`.

The extraction schema covers:

- Site
- Date of occurrence
- Deviation title
- Source/department
- Product or material
- Batch or lot number
- Description
- Initial impact
- Initial severity when supported by the source

The extraction prompt instructs the model not to invent missing facts. Missing values are empty strings, and unsupported initial severity is `null`.

### 2. Impact node

`assess_impact` sends the structured extraction to the impact prompt and validates an `ImpactAssessment` containing:

- `impact`
- `reason`

The prompt requires evidence-based reasoning, uncertainty acknowledgement, and no invented information.

### 3. Severity node

`assess_severity` receives the structured extraction and impact assessment. It validates a `SeverityAssessment` containing:

- `severity`: `Critical`, `Major`, or `Minor`
- `reason`

The prompt explicitly describes the three classifications and identifies the result as an initial recommendation rather than a final quality decision.

### Retry behavior

Each AI node uses the shared retry helper. The operation is attempted up to three times total: the initial attempt plus two retries. Invalid structured output and provider errors are retried, then surfaced as a safe analysis failure by the API route.

### Model configuration

The model is read from `GROQ_MODEL` through `backend/app/config.py`:

```python
groq_model: str
```

Do not hardcode an obsolete provider model in application code. Set the currently available model in the backend environment.

## Database and persistence

`backend/app/db/database.py` creates the SQLAlchemy engine and `SessionLocal`. FastAPI injects a session through `get_db`.

The `deviations` table includes:

### Human-reviewed fields

- `site`
- `date_of_occurrence`
- `title`
- `source`
- `product_material`
- `batch_lot_number`
- `description`
- `initial_impact`
- `initial_severity`

### AI provenance fields

- `ai_impact`
- `ai_impact_reason`
- `ai_severity`
- `ai_severity_reason`

### System fields

- `id`
- `created_at`
- `updated_at`

The repository layer owns create, read, list, and update operations. The saved human-reviewed values are sent from the frontend form, while AI recommendation fields are stored separately so they remain distinguishable from the final human-reviewed decision.

## Validation and error handling

Frontend validation is in `frontend/src/features/deviation/validation.ts`. It checks required deviation fields before save.

The API returns structured errors for common analysis failures:

```json
{
  "detail": {
    "code": "EMPTY_INPUT",
    "message": "Provide deviation text or upload a PDF, DOCX, or TXT file."
  }
}
```

Typical statuses:

| Status | Meaning |
|---:|---|
| `400` | Empty, too-short, invalid, or unsupported input |
| `404` | Deviation record does not exist |
| `502` | AI/provider failure after safe error handling |
| `201` | Deviation created successfully |
| `200` | Successful read, update, or analysis |

The frontend converts API failures into visible loading, error, and saving states. Raw AI/provider stack traces are not returned to the browser.

## Development commands

### Frontend

```bash
cd frontend
npm run dev       # Vite development server
npm run build     # TypeScript build plus Vite production build
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

### Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
python -m compileall -q app
```

The backend currently does not define a pytest script in `pyproject.toml`. Add and run a test suite before treating the project as production complete.

## Production checklist

Before deployment:

- Set a production `DATABASE_URL`.
- Set `GROQ_API_KEY` through the hosting provider’s secret manager.
- Set a currently available `GROQ_MODEL`.
- Set `FRONTEND_URL` to the deployed frontend origin.
- Set `VITE_API_URL` to the deployed backend origin before building the frontend.
- Run the database schema/migration process for the target PostgreSQL instance.
- Run `npm run build` in `frontend`.
- Serve the generated `frontend/dist` directory through the configured host.
- Confirm SPA rewrites are enabled so direct refreshes of `/deviations/:id` and `/deviations/:id/edit` load the frontend.
- Inspect response headers for the deployed CSP. Do not add `unsafe-eval` merely to suppress a browser or extension error.
- Confirm no `.env` files or API keys are committed.
- Confirm invalid file uploads produce safe client-facing messages.

## Current implementation notes

- `backend/app/main.py` is the FastAPI entry point. The root-level `backend/main.py` is only a small placeholder script and is not used to serve the API.
- Alembic is listed as a backend dependency, but migration scripts are not currently present in the repository. Production database schema management should be added or connected to the deployment process before relying on automatic migrations.
- Authentication and audit-event persistence are not currently part of the implemented request path.
- The frontend has a development fallback API URL of `http://localhost:8000`; production builds must provide `VITE_API_URL` explicitly.
- The AI output is an initial recommendation. Human-reviewed form values are the authoritative values saved as the deviation record.
