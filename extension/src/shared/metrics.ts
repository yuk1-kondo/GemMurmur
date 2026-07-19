import type { TUNING_CHECKLIST } from './tuning'

type MetricName = (typeof TUNING_CHECKLIST)[number]

const samples = new Map<MetricName, number[]>()

export function recordMetric(name: MetricName, value: number): void {
  const list = samples.get(name) ?? []
  list.push(value)
  if (list.length > 200) list.shift()
  samples.set(name, list)
}

export function metricSummary(): Record<string, { count: number; avg: number; last: number }> {
  const out: Record<string, { count: number; avg: number; last: number }> = {}
  for (const [name, list] of samples) {
    if (list.length === 0) continue
    const sum = list.reduce((a, b) => a + b, 0)
    out[name] = {
      count: list.length,
      avg: sum / list.length,
      last: list[list.length - 1],
    }
  }
  return out
}
