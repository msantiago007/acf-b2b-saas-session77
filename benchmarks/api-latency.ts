/**
 * API Route Latency Benchmark
 *
 * Purpose: Measure production API endpoint performance
 * Tests: Response times across multiple requests
 * Targets:
 *   - Average: < 200ms
 *   - P50: < 150ms
 *   - P95: < 500ms
 *   - P99: < 1000ms
 */

const API_BASE_URL = process.env.API_URL || 'https://acf-b2b-saas-session77.vercel.app'
const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

interface LatencyStats {
  min: number
  max: number
  avg: number
  median: number
  p50: number
  p95: number
  p99: number
  stdDev: number
}

/**
 * Measure latency of multiple requests to a URL
 */
async function measureLatency(
  url: string,
  iterations: number = 50,
  options?: RequestInit
): Promise<{ latencies: number[]; stats: LatencyStats; errors: number }> {
  const latencies: number[] = []
  let errors = 0

  console.log(`Testing ${url}...`)
  console.log(`Iterations: ${iterations}`)
  console.log()

  for (let i = 0; i < iterations; i++) {
    try {
      const start = performance.now()
      const response = await fetch(url, {
        ...options,
        // Add cache-busting to ensure fresh requests
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      const end = performance.now()
      const latency = end - start

      if (response.ok) {
        latencies.push(latency)
      } else {
        errors++
        console.warn(`Request ${i + 1} failed with status ${response.status}`)
      }

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`Progress: ${i + 1}/${iterations}\r`)
      }
    } catch (error) {
      errors++
      console.warn(`Request ${i + 1} error:`, error instanceof Error ? error.message : 'Unknown error')
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\nCompleted ${latencies.length} successful requests (${errors} errors)`)
  console.log()

  const stats = calculateStats(latencies)
  return { latencies, stats, errors }
}

/**
 * Calculate latency statistics
 */
function calculateStats(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      stdDev: 0
    }
  }

  const sorted = [...latencies].sort((a, b) => a - b)
  const sum = latencies.reduce((a, b) => a + b, 0)
  const avg = sum / latencies.length

  // Standard deviation
  const squareDiffs = latencies.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
  const stdDev = Math.sqrt(avgSquareDiff)

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    median: sorted[Math.floor(sorted.length / 2)],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    stdDev
  }
}

/**
 * Print latency statistics
 */
function printStats(stats: LatencyStats, targets?: Partial<LatencyStats>) {
  console.log('Latency Statistics:')
  console.log('-'.repeat(60))

  const metrics = [
    { name: 'Min', value: stats.min, target: targets?.min },
    { name: 'Max', value: stats.max, target: targets?.max },
    { name: 'Average', value: stats.avg, target: targets?.avg },
    { name: 'Median', value: stats.median, target: targets?.median },
    { name: 'P50', value: stats.p50, target: targets?.p50 },
    { name: 'P95', value: stats.p95, target: targets?.p95 },
    { name: 'P99', value: stats.p99, target: targets?.p99 },
    { name: 'Std Dev', value: stats.stdDev, target: targets?.stdDev }
  ]

  metrics.forEach(({ name, value, target }) => {
    const formatted = `${value.toFixed(2)}ms`.padEnd(12)
    const targetStr = target ? `(target: ${target}ms)` : ''
    const status = target && value <= target ? '✅' : target && value > target ? '❌' : ''

    console.log(`${name.padEnd(12)}: ${formatted} ${targetStr} ${status}`)
  })

  console.log()
}

/**
 * Main benchmark execution
 */
async function runBenchmark() {
  console.log('='.repeat(60))
  console.log('API Route Latency Benchmark')
  console.log('='.repeat(60))
  console.log()
  console.log(`Base URL: ${API_BASE_URL}`)
  console.log()

  // Define targets
  const targets = {
    avg: 200,
    p50: 150,
    p95: 500,
    p99: 1000
  }

  // Test 1: GET /api/orgs/[orgId]/teams
  console.log('Test 1: GET /api/orgs/[orgId]/teams')
  console.log('='.repeat(60))

  const test1 = await measureLatency(
    `${API_BASE_URL}/api/orgs/${TEST_ORG_ID}/teams`,
    50
  )

  printStats(test1.stats, targets)

  // Test 2: Homepage (/)
  console.log('Test 2: Homepage (/) - SSR Performance')
  console.log('='.repeat(60))

  const test2 = await measureLatency(`${API_BASE_URL}/`, 30)
  printStats(test2.stats, { avg: 500, p95: 1000 })

  // Test 3: Static page (if exists)
  console.log('Test 3: Test Page - Client-side Performance')
  console.log('='.repeat(60))

  const test3 = await measureLatency(`${API_BASE_URL}/test/org-settings`, 30)
  printStats(test3.stats, { avg: 300, p95: 800 })

  // Summary
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log()

  const allStats = [
    { name: 'API Endpoint (/api/...)', stats: test1.stats, errors: test1.errors },
    { name: 'Homepage (/)', stats: test2.stats, errors: test2.errors },
    { name: 'Test Page', stats: test3.stats, errors: test3.errors }
  ]

  allStats.forEach(({ name, stats, errors }) => {
    console.log(`${name}:`)
    console.log(`  Average: ${stats.avg.toFixed(2)}ms`)
    console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
    console.log(`  Errors: ${errors}`)
    console.log()
  })

  // Overall assessment
  const apiPass = test1.stats.avg < targets.avg && test1.stats.p95 < targets.p95 && test1.stats.p99 < targets.p99
  console.log('API Performance Assessment:')
  console.log(`  Status: ${apiPass ? '✅ PASS' : '⚠️  NEEDS IMPROVEMENT'}`)

  if (!apiPass) {
    console.log()
    console.log('Recommendations for Improvement:')
    if (test1.stats.avg > targets.avg) {
      console.log('  - Enable database query caching')
      console.log('  - Add database indexes')
      console.log('  - Optimize Supabase RLS policies')
    }
    if (test1.stats.p95 > targets.p95) {
      console.log('  - Investigate P95 outliers (cold starts?)')
      console.log('  - Consider CDN/edge caching for static data')
    }
  }

  console.log()
}

// Run benchmark
runBenchmark().catch(console.error)
