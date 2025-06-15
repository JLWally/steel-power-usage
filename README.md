# Steel Power Usage Explorer
# Steel Power Usage 🔌⚡

Small FastAPI + React app for exploring the **Steel Industry Energy Consumption** dataset.

## Features
| REST endpoint | What it does |
|---------------|--------------|
| `/records`    | Returns raw usage records with filters for date range, day of week, weekend, and load type
| `/stats`      | Returns a single statistic (sum, mean, median, min, max) on filtered data
| `/stats/daily`| Returns a daily mean kWh time-series. They can be used to build a chart

Filters are optional & combinable, so you can answer questions like:

* What was the average active power for the full dataset? 
* MWhat was the minimum Maximum_Load kWh usage?  
* What was the daily average from March to May 2018?  
* What was the maximum consumption on Mondays in October 2018?  
* What was the weekend usage in September 2018?

## Stack
| Layer    | Tech          |
|----------|---------------|
| Frontend | React + Vite + Material-UI |
| Backend  | FastAPI (Python) |
| Data     | `Steel_industry_data.csv` (Kaggle) |
| Dev UX   | Hot-reload via Vite & uvicorn |

## Run locally

```bash
# Clone the repo
git clone <your-repo-url>
cd steel-power-usage

# ---- Backend ----
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload  # Starts backend at http://127.0.0.1:8000

# ---- Frontend ----
cd ../frontend
npm install
npm run dev                # Starts frontend at http://localhost:5173
