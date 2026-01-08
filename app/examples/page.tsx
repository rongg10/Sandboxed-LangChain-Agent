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

      <section className="examples-hero">
        <div>
          <p className="eyebrow">Interaction example</p>
          <h1>Structured file analysis with sandboxed code.</h1>
          <p className="subhead">
            A sample exchange showing how the agent reads a CSV uploaded into the
            session and returns a concise data summary.
          </p>
        </div>
      </section>

      <section className="example-thread">
        <div className="example-message user">
          <p className="example-role">You</p>
          <p className="example-content">examine health_env_ops_1000rows.csv</p>
        </div>
        <div className="example-message assistant">
          <p className="example-role">Agent</p>
          <div className="example-content">
            <p>
              I examined /data/health_env_ops_1000rows.csv. Quick summary and key
              findings:
            </p>
            <p className="example-section">File shape and columns</p>
            <p>
              Rows x cols: 1000 x 24
              <br />
              Columns: date, region, population, day_of_week, is_weekend, is_holiday,
              is_service_disruption, temperature_c, humidity_pct, rain_mm, wind_kph,
              pm25_ug_m3, no2_ppb, pollen_index, flu_like_cases_index, pct_elderly,
              pct_children, staff_on_duty, clinic_visits, visits_per_10k,
              avg_wait_time_min, admission_rate, severe_day_flag, next_day_clinic_visits
            </p>
            <p className="example-section">Missing data</p>
            <p>
              pm25_ug_m3: 9 (0.9%), no2_ppb: 12 (1.2%), pollen_index: 2 (0.2%),
              avg_wait_time_min: 5 (0.5%), next_day_clinic_visits: 1 (0.1%)
            </p>
            <p className="example-section">Selected numeric summaries</p>
            <p>
              clinic_visits mean=121.07 (min 60, max 191)
              <br />
              next_day_clinic_visits mean=121.11
              <br />
              avg_wait_time_min mean=92.42
              <br />
              pm25_ug_m3 mean=25.02
              <br />
              visits_per_10k mean=2.418
            </p>
            <p>
              Would you like me to plot trends, run correlations, or export a
              cleaned CSV?
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
