import { Icon } from '../../../components/ui/Icon'
import type { AiMatch } from '../../../services/shopApi'
import type { Garment, MatchResult } from '../types'

export function MatchInsights({ result, count, ai, alternative, onAlternative }: {
  result: MatchResult | null; count: number; ai?: AiMatch | null; alternative?: Garment; onAlternative: (garment: Garment) => void
}) {
  const metrics = [
    { title: 'Colors', value: result?.color, note: result?.colorNote },
    { title: 'Clothing', value: result?.silhouette, note: result?.silhouetteNote },
    { title: 'Occasion', value: result?.occasion, note: result?.occasionNote },
  ]
  return <aside className="insights-column" aria-label="Outfit match results">
    <div className="studio-panel-heading"><h2><Icon name="sparkles" size={19} />AI results</h2><span className="engine-badge">Style check</span></div>
    <section className="fitting-engine">
      <div className="score-panel" aria-live="polite"><div className="harmony-gauge"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" /><circle className="gauge-fill" cx="60" cy="60" r="50" strokeDasharray="314.159" strokeDashoffset={314.159 * (1 - (result?.score ?? 0) / 100)} /></svg><div><strong>{result ? `${result.score}%` : '--'}</strong><span>Match score</span></div></div>
      <p className="score-caption">{result ? 'Your outfit analysis is ready' : count < 2 ? 'Choose at least two pieces to start' : 'Ready for your style check'}</p></div>
      {!result && <p className="results-empty">See how your colors, clothing and occasion work together. Your feedback will appear here.</p>}
      {result && <><p className="result-summary">{result.note}</p><div className="diagnostic-metrics">{metrics.map((metric) => <div className="diagnostic-card" key={metric.title}><div><span>{metric.title}</span><strong>{metric.value}%</strong></div><div className="metric-track" role="meter" aria-label={metric.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metric.value}><span style={{ width: `${metric.value}%` }} /></div></div>)}</div>
      <details className="analysis-details"><summary>Detailed feedback & suggestions</summary>{metrics.map((metric) => <p key={metric.title}><strong>{metric.title}:</strong> {metric.note}</p>)}{ai && <><p><strong>Style:</strong> {ai.styles.explanation}</p><p><strong>Pattern:</strong> {ai.patterns.explanation}</p><ul>{ai.suggestions.map((text, index) => <li key={index}>{text}</li>)}</ul></>}</details></>}
      <p className="match-disclaimer"><Icon name="info" size={14} />Styling guidance, not a guarantee of fit.</p>
      {ai && <p className="profile-analysis-note">{ai.used_profile ? 'Saved profile included' : 'Profile not included'}</p>}
    </section>
    {alternative && result && <section className="harmony-alternative"><h3>Try another top</h3><button onClick={() => onAlternative(alternative)} aria-label={`Swap top for ${alternative.name}`}><img src={alternative.image} alt="" /><span><strong>{alternative.name}</strong><small>Explore this combination</small></span><Icon name="swap" size={17} /></button></section>}
  </aside>
}
