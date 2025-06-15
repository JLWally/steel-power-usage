from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(title="Steel Power API")

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CSV once at startup
df = pd.read_csv("Steel_industry_data.csv")
df["date"] = pd.to_datetime(df["date"], errors="coerce")


# ---------- helpers ----------
def apply_filters(
    data: pd.DataFrame,
    start: str | None = None,
    end: str | None = None,
    load_type: str | None = None,
    dow: str | None = None,
    weekend: str | bool | None = None,
) -> pd.DataFrame:
    """
    Return a filtered copy of the dataframe based on query params.
    """
    # ---- date range ---------------------------------------------------------
    if start:
        data = data[data["date"] >= pd.to_datetime(start, errors="coerce")]
    if end:
        data = data[data["date"] <= pd.to_datetime(end, errors="coerce")]

    # ---- load type ----------------------------------------------------------
    if load_type and load_type != "load_type":
        allowed = [x.strip() for x in load_type.split(",") if x.strip()]
        if allowed:
            data = data[data["Load_Type"].isin(allowed)]

    # ---- day-of-week (only when weekend toggle is OFF) ----------------------
    if dow and not (str(weekend).lower() in ("true", "1")):
        allowed_days = [d.strip() for d in dow.split(",") if d.strip()]
        if allowed_days:
            data = data[data["Day_of_week"].isin(allowed_days)]

    # ---- weekend filter -----------------------------------------------------
    if weekend is not None and str(weekend).strip() != "":
        is_weekend = str(weekend).lower() in ("true", "1")
        data = data[data["WeekStatus"] == ("Weekend" if is_weekend else "Weekday")]

    return data.copy()  # always return a DataFrame
# ---------------------------------------------------------------------------

# quick sanity-check on startup
print(df[df["WeekStatus"] == "Weekend"]["Day_of_week"].value_counts())


@app.get("/records")
def get_records(
    start: str | None = None, end: str | None = None,
    load_type: str | None = None, dow: str | None = None,
    weekend: str | None = None, limit: int = 100
):
    filtered = apply_filters(df, start, end, load_type, dow, weekend)

    if filtered.empty:
        return []

    # One row per day, get earliest timestamp per date
    daily_rows = (
        filtered
        .sort_values(by="date")  # Sort full data by datetime ascending
        .groupby(filtered["date"].dt.date, as_index=False)  # group by calendar day
        .first()  # get the first entry per day (e.g., 00:00)
        .sort_values(by="date")  # ensure output is still sorted by datetime
    )

    return daily_rows.head(limit).to_dict(orient="records")



@app.get("/stats")
def get_stats(
    metric: str = "mean",
    start: str | None = None, end: str | None = None,
    load_type: str | None = None, dow: str | None = None,
    weekend: str | None = None,
):
    filtered = apply_filters(df, start, end, load_type, dow, weekend)

    if filtered.empty:
        return {"error": "No data after filtering."}

    series = filtered["Usage_kWh"]

    match metric:
        case "sum":    result = series.sum()
        case "mean":   result = series.mean()
        case "median": result = series.median()
        case "min":    result = series.min()
        case "max":    result = series.max()
        case _:        return {"error": "Invalid metric"}

    return {"metric": metric, "value": round(result, 3)}


@app.get("/stats/daily")
def get_daily_avg(
    start: str | None = None, end: str | None = None,
    load_type: str | None = None, dow: str | None = None,
    weekend: str | None = None,
):
    filtered = apply_filters(df, start, end, load_type, dow, weekend)

    if filtered.empty:
        return []

    daily = (
        filtered
        .resample("D", on="date")["Usage_kWh"]
        .mean()
        .dropna()
    )
    return [{"date": d.strftime("%Y-%m-%d"), "value": round(v, 2)}
            for d, v in daily.items()]

