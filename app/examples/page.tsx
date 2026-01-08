import Link from "next/link";

export default function ExamplesPage() {
  return (
    <main className="page">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◼
          </span>
          <div>
            <p className="brand-name">Sandboxed Agent</p>
            <p className="brand-tagline">Node + Pyodide sandbox runner</p>
          </div>
        </div>
        <nav className="nav">
          <Link href="/#product">Product</Link>
          <Link href="/architecture">Architecture</Link>
          <Link href="/examples">Examples</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="button cta ghost" href="/chat">
          Open console
        </Link>
      </header>

      <section className="chat-shell">
        <div className="panel-header">
          <div>
            <p className="panel-title">Example session</p>
            <p className="panel-subtitle">File analysis with sandboxed code</p>
          </div>
          <span className="status-pill">Example</span>
        </div>

        <section className="chat-container" aria-live="polite">
          <div className="message-list">
            <div className="message user">
              <span className="message-role">YOU</span>
              <span className="message-content">
                examine health_env_ops_1000rows.csv
              </span>
            </div>
            <div className="message assistant">
              <span className="message-role">AGENT</span>
              <span className="message-content">
                {`AGENT
I examined /data/health_env_ops_1000rows.csv. Quick summary and key findings:

File shape and columns
- Rows × cols: 1000 × 24
- Columns: date, region, population, day_of_week, is_weekend, is_holiday, is_service_disruption, temperature_c, humidity_pct, rain_mm, wind_kph, pm25_ug_m3, no2_ppb, pollen_index, flu_like_cases_index, pct_elderly, pct_children, staff_on_duty, clinic_visits, visits_per_10k, avg_wait_time_min, admission_rate, severe_day_flag, next_day_clinic_visits
- date values are all present and appear unique (1000 unique dates).

Missing data
- pm25_ug_m3: 9 missing (0.9%)
- no2_ppb: 12 missing (1.2%)
- pollen_index: 2 missing (0.2%)
- avg_wait_time_min: 5 missing (0.5%)
- next_day_clinic_visits: 1 missing (0.1%)

Categorical / low-cardinality columns
- region (5 values: South 217, North 204, Central 199, East 192, West 188)
- population (5 values matching regions)
- day_of_week (7 values)
- is_weekend, is_holiday, is_service_disruption, severe_day_flag (each binary)

Counts of some categories
- severe_day_flag: 0 → 875, 1 → 125
- is_weekend: 0 → 715, 1 → 285

Selected numeric summaries (count, mean, population std, min, 25%, 50%, 75%, max)
- clinic_visits: count=1000, mean=121.070, std=20.565, min=60, 25%=106, 50%=121, 75%=135, max=191
- next_day_clinic_visits: count=999, mean=121.107, std=20.541, min=60, 25%=106.5, 50%=121, 75%=135, max=191
- avg_wait_time_min: count=995, mean=92.42, std=16.01, min=42.9, 25%=80.7, 50%=92.2, 75%=102.95, max=152.1
- pm25_ug_m3: count=991, mean=25.02, std=5.95, min=7.6, 25%=20.9, 50%=25.2, 75%=29.3, max=43.4
- no2_ppb: count=988, mean=31.07, std=5.25, min=15.8, 25%=27.3, 50%=30.9, 75%=34.9, max=46.9
- visits_per_10k: count=1000, mean=2.418, std=0.454, min=1.212, 25%=2.092, 50%=2.41, 75%=2.714, max=3.857
- admission_rate: count=1000, mean=0.139, std=0.015, min=0.1, 25%=0.129, 50%=0.139, 75%=0.149, max=0.189
- temperature_c: count=1000, mean=26.25, std=2.577, min=19.8, 25%=24.3, 50%=26.5, 75%=28.2, max=33.5

First 5 rows (sample)
- 2023-01-01 | South | population=520000 | clinic_visits=84 | next_day_clinic_visits=113 | ...
- 2023-01-02 | Central | population=610000 | clinic_visits=113 | next_day_clinic_visits=127 | ...
- 2023-01-03 | West | population=500000 | clinic_visits=127 | next_day_clinic_visits=128 | ...
- 2023-01-04 | East | population=480000 | clinic_visits=128 | next_day_clinic_visits=106 | ...
- 2023-01-05 | North | population=420000 | clinic_visits=106 | next_day_clinic_visits=111 | ...

Notes / potential issues
- A few numeric columns have small numbers of missing values (pm25, no2, avg_wait_time, pollen, next_day_clinic_visits). Decide on imputation or row-dropping depending on analysis.
- date appears suitable for time-series use but should be parsed to a date type.
- Several numeric columns (visits_per_10k, admission_rate, pct_elderly/children) are already normalized/fractional — confirm units if needed.

Would you like me to do any of the following next?
- Parse date and show a time-series plot of clinic_visits (or next_day_clinic_visits).
- Correlation matrix (numeric cols) and highlight top predictors of next_day_clinic_visits.
- Show value distributions / histograms and detect outliers.
- Impute missing values (suggest method) and return a cleaned CSV.
- Fit a quick forecast model (e.g., simple regression or time-series) to predict next_day_clinic_visits.

Tell me which action you want and I’ll run it in the sandbox.`}
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
