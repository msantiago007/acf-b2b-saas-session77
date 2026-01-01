# Performance Benchmarks

Performance testing scripts for the ML-generated B2B SaaS application.

## Available Benchmarks

### 1. Zod Validation (`zod-validation.ts`)

**Purpose:** Measure overhead of Zod schema validation for HIGH RISK forms

**Run:**
```bash
npx ts-node benchmarks/zod-validation.ts
```

**What it tests:**
- OrganizationSettings schema validation (1000 iterations)
- MemberInvite schema validation (1000 iterations)
- Error handling performance with invalid data
- Comparison of `parse()` vs `safeParse()`

**Success Criteria:**
- Per-validation time < 0.01ms
- Total time for 1000 validations < 10ms

**Expected Output:**
```
Zod Validation Performance Benchmark
============================================================

Test 1: OrganizationSettings Schema - Valid Data
------------------------------------------------------------
Zod validation (1000 iterations): 8.234ms
Total time: 8.23ms
Per validation: 0.0082ms
Validations per second: 121,500

Summary
============================================================
✓ Average validation time: 0.0085ms
✓ Target: < 0.01ms per validation
✓ Status: PASS ✅

Result: Zod overhead is negligible for HIGH RISK forms
```

---

### 2. API Latency (`api-latency.ts`)

**Purpose:** Measure production API endpoint response times

**Run:**
```bash
# Set environment variable for custom URL (optional)
export API_URL=https://acf-b2b-saas-session77.vercel.app

npx ts-node benchmarks/api-latency.ts
```

**What it tests:**
- GET /api/orgs/[orgId]/teams (50 requests)
- Homepage / (30 requests)
- Test pages (30 requests)
- Statistical analysis (min, max, avg, P50, P95, P99)

**Success Criteria:**
- Average < 200ms
- P50 < 150ms
- P95 < 500ms
- P99 < 1000ms

**Expected Output:**
```
API Route Latency Benchmark
============================================================
Base URL: https://acf-b2b-saas-session77.vercel.app

Test 1: GET /api/orgs/[orgId]/teams
============================================================
Testing https://acf-b2b-saas-session77.vercel.app/api/orgs/.../teams
Iterations: 50

Latency Statistics:
------------------------------------------------------------
Min         : 98.45ms
Max         : 456.23ms
Average     : 156.78ms    (target: 200ms) ✅
Median      : 142.34ms
P50         : 142.34ms    (target: 150ms) ✅
P95         : 298.12ms    (target: 500ms) ✅
P99         : 423.45ms    (target: 1000ms) ✅

Summary
============================================================
API Performance Assessment:
  Status: ✅ PASS
```

---

## Running All Benchmarks

**Quick run:**
```bash
cd generated/b2b_saas
npm run benchmark
```

**Individual benchmarks:**
```bash
# Zod validation
npx ts-node benchmarks/zod-validation.ts

# API latency
npx ts-node benchmarks/api-latency.ts
```

---

## Interpreting Results

### Zod Validation

**PASS:** < 0.01ms per validation
- Negligible overhead for HIGH RISK forms
- Zod validation recommended

**ACCEPTABLE:** 0.01ms - 0.1ms per validation
- Small overhead but acceptable
- Benefits outweigh costs for HIGH RISK forms

**FAIL:** > 0.1ms per validation
- Consider optimization or alternative validation
- May impact user experience on slower devices

### API Latency

**EXCELLENT:** Average < 100ms, P95 < 300ms
- Users perceive as instant
- No optimization needed

**GOOD:** Average < 200ms, P95 < 500ms
- Acceptable performance
- Minor optimizations beneficial

**NEEDS IMPROVEMENT:** Average > 200ms, P95 > 500ms
- Noticeable delays
- Optimization recommended:
  - Database query optimization
  - Caching
  - CDN for static assets
  - Edge functions

**POOR:** Average > 500ms, P95 > 1000ms
- Poor user experience
- Immediate optimization required

---

## Performance Targets

Based on industry standards and user experience research:

| Metric | Target | Reasoning |
|--------|--------|-----------|
| Validation | < 0.01ms | Imperceptible to users |
| API Average | < 200ms | Perceived as "fast" |
| API P95 | < 500ms | Acceptable for most users |
| API P99 | < 1000ms | Edge cases acceptable |
| FCP | < 1.8s | Core Web Vitals |
| LCP | < 2.5s | Core Web Vitals |
| TTI | < 3.8s | Time to Interactive |

---

## Troubleshooting

### Benchmark fails with "Cannot find module"

**Solution:**
```bash
npm install  # Install dependencies including zod, etc.
```

### API benchmark returns all errors

**Possible causes:**
1. Production URL is incorrect
2. API routes don't exist
3. Network connectivity issues
4. CORS blocking requests

**Solution:**
```bash
# Verify URL is correct
curl https://acf-b2b-saas-session77.vercel.app

# Check specific endpoint
curl https://acf-b2b-saas-session77.vercel.app/api/orgs/00000000-0000-0000-0000-000000000001/teams
```

### Performance worse than expected

**Possible causes:**
1. Cold start (Vercel serverless functions)
2. Network latency
3. Database not optimized
4. RLS policies complex

**Solutions:**
- Run benchmark multiple times (first run may be slow)
- Test from different locations
- Check Supabase query performance in dashboard
- Review RLS policy complexity

---

## Adding New Benchmarks

**Template:**

```typescript
// benchmarks/my-benchmark.ts

console.log('='.repeat(60))
console.log('My Benchmark Name')
console.log('='.repeat(60))
console.log()

const iterations = 1000

console.log('Test 1: Description')
console.log('-'.repeat(60))

const start = performance.now()
for (let i = 0; i < iterations; i++) {
  // Your test code here
}
const end = performance.now()

console.log(`Total time: ${(end - start).toFixed(2)}ms`)
console.log(`Per operation: ${((end - start) / iterations).toFixed(4)}ms`)
console.log()
```

**Add to package.json:**

```json
{
  "scripts": {
    "benchmark": "npx ts-node benchmarks/zod-validation.ts && npx ts-node benchmarks/api-latency.ts",
    "benchmark:zod": "npx ts-node benchmarks/zod-validation.ts",
    "benchmark:api": "npx ts-node benchmarks/api-latency.ts",
    "benchmark:my": "npx ts-node benchmarks/my-benchmark.ts"
  }
}
```

---

**Generated by ACF (Agentic Capsule Factory)**
Session 78 - Integration Testing & Form Validation
🤖 Claude Sonnet 4.5
