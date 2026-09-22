import { Icon } from '../../../components/ui/Icon'
import type { AiMatch } from '../../../services/shopApi'
import type { Garment, MatchResult } from '../types'

export function MatchInsights({
  result,
  count,
  ai,
  alternative,
  onAlternative,
}: {
  result: MatchResult | null
  count: number
  ai?: AiMatch | null
  alternative?: Garment
  onAlternative: (garment: Garment) => void
}) {
  return (
    <aside className="insights-column" aria-label="Outfit match results">
      <section className="fitting-engine" aria-labelledby="engine-title">
        <div className="studio-panel-heading">
          <h2 id="engine-title">
            <Icon name="sparkles" size={20} /> Fitting Engine
          </h2>
          <span className="engine-badge">Groq AI</span>
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
              <span>Harmony score</span>
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
              title: 'Clothing Compatibility',
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
                    : `${metric.value}% AI score`
                }
              >
                <span style={{ width: `${metric.value ?? 0}%` }} />
              </div>
              <p>
                {metric.note ??
                  'Check your current selection to see an AI breakdown.'}
              </p>
            </div>
          ))}
        </div>
        <div className="curator-note">
          <h3>“ Curator note</h3>
          <p>
            {result?.note ??
              'Choose pieces from either archive, then check the look. Try swapping a layer or changing the occasion to get new styling suggestions.'}
          </p>
          <span>
            <Icon name="info" size={12} /> {ai?.used_profile ? 'Saved profile included' : 'Profile not included'}
          </span>
        </div>
        {ai && <div className="curator-note"><h3>Suggestions</h3><ul>{ai.suggestions.map((text, index) => <li key={index}>{text}</li>)}</ul><p>Style: {ai.styles.score}% / {ai.styles.explanation}</p><p>Pattern: {ai.patterns.score}% / {ai.patterns.explanation}</p></div>}
        <p className="match-disclaimer"><Icon name="info" size={14} />{ai?.disclaimer ?? 'AI styling suggestions are subjective and do not guarantee garment fit.'}</p>
      </section>
      {alternative && <section className="harmony-alternative">
        <div>
          <h3>Harmony alternatives</h3>
          <span>Try another top</span>
        </div>
        <button
          onClick={() => onAlternative(alternative)}
          aria-label={`Swap top for ${alternative.name}`}
        >
          <img src={alternative.image} alt="" />
          <span>
            <strong>{alternative.name}</strong>
            <small>
              Explore another combination
            </small>
          </span>
          <Icon name="swap" size={17} />
        </button>
      </section>}
    </aside>
  )
}
