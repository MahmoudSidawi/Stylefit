import { Icon } from '../../../components/ui/Icon'
import { getGarment } from '../data/garments'
import type { Garment, MatchResult } from '../types'

export function MatchInsights({
  result,
  count,
  isAlternativeSelected,
  onAlternative,
}: {
  result: MatchResult | null
  count: number
  isAlternativeSelected: boolean
  onAlternative: (garment: Garment) => void
}) {
  const alternative = getGarment(
    isAlternativeSelected ? 'studio-blazer' : 'studio-duster',
  )!
  return (
    <aside className="insights-column" aria-label="Outfit match results">
      <section className="fitting-engine" aria-labelledby="engine-title">
        <div className="studio-panel-heading">
          <h2 id="engine-title">
            <Icon name="sparkles" size={20} /> Fitting Engine
          </h2>
          <span className="engine-badge">Demo rules</span>
        </div>
        <div className="score-panel" aria-live="polite">
          <div className="harmony-gauge">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="50" />
              <circle
                className="gauge-fill"
                cx="60"
                cy="60"
                r="50"
                strokeDasharray="314.159"
                strokeDashoffset={314.159 * (1 - (result?.score ?? 0) / 100)}
              />
            </svg>
            <div>
              <strong>
                {result ? (
                  <>
                    {result.score}
                    <small>%</small>
                  </>
                ) : (
                  '—'
                )}
              </strong>
              <span>Demo harmony score</span>
            </div>
          </div>
          <span className="score-caption">
            {result
              ? result.score >= 90
                ? 'A balanced composition'
                : 'Room to experiment'
              : count < 2
                ? 'Select at least two pieces'
                : 'Look changed · Check again'}
          </span>
        </div>
        <div className="diagnostic-metrics">
          <h3>Styling dimensions</h3>
          {[
            {
              title: 'Chromatic Balance',
              value: result?.color,
              note: result?.colorNote,
            },
            {
              title: 'Silhouette Equilibrium',
              value: result?.silhouette,
              note: result?.silhouetteNote,
            },
            {
              title: 'Occasion Alignment',
              value: result?.occasion,
              note: result?.occasionNote,
            },
          ].map((metric) => (
            <div className="diagnostic-card" key={metric.title}>
              <div>
                <span>{metric.title}</span>
                <strong>
                  {metric.value === undefined ? '—' : `${metric.value}%`}
                </strong>
              </div>
              <div
                className="metric-track"
                role="meter"
                aria-label={metric.title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={metric.value ?? 0}
                aria-valuetext={
                  metric.value === undefined
                    ? 'Not checked'
                    : `${metric.value}% demo score`
                }
              >
                <span style={{ width: `${metric.value ?? 0}%` }} />
              </div>
              <p>
                {metric.note ??
                  'Check your current selection to see a demo breakdown.'}
              </p>
            </div>
          ))}
        </div>
        <div className="curator-note">
          <h3>“ Curator note</h3>
          <p>
            {result?.note ??
              'Choose pieces from either archive, then check the look. Try swapping a layer or changing the occasion to explore the sample styling rules.'}
          </p>
          <span>
            <Icon name="info" size={12} /> Local styling demo · No body
            measurements
          </span>
        </div>
        <p className="match-disclaimer">
          <Icon name="info" size={14} /> Illustrative, rule-based styling
          estimates. No AI model is connected. These scores do not predict
          garment fit.
        </p>
        <details className="rules-explainer">
          <summary>How this demo is scored</summary>
          <p>
            Color (40%) compares warm, cool, and neutral tags. Silhouette (35%)
            checks top/trouser coverage and fabric variety. Occasion (25%)
            compares sample garment tags. Sizes are saved for your bag but do
            not affect these scores.
          </p>
        </details>
      </section>
      <section className="harmony-alternative">
        <div>
          <h3>Harmony alternatives</h3>
          <span>Try a new layer</span>
        </div>
        <button
          onClick={() => onAlternative(alternative)}
          aria-label={`Swap layer for ${alternative.name}`}
        >
          <img src={alternative.image} alt="" />
          <span>
            <strong>{alternative.name}</strong>
            <small>
              {isAlternativeSelected
                ? 'Return to oatmeal warmth'
                : 'Explore a deeper plum contrast'}
            </small>
          </span>
          <Icon name="swap" size={17} />
        </button>
      </section>
    </aside>
  )
}
