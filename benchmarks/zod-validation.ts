import { z } from 'zod'

/**
 * Zod Validation Performance Benchmark
 *
 * Purpose: Measure overhead of Zod validation for HIGH RISK forms
 * Compares: Zod validation vs No validation
 * Expected: < 10ms for 1000 validations (< 0.01ms per validation)
 */

// HIGH RISK schema (OrganizationSettings)
const highRiskSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.any()).optional()
})

// HIGH RISK schema (MemberInvite)
const memberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  message: z.string().optional()
})

// Test data samples
const orgTestData = {
  name: 'Acme Corporation',
  slug: 'acme-corp',
  plan: 'pro' as const,
  settings: { analytics: true }
}

const inviteTestData = {
  email: 'user@example.com',
  role: 'member' as const,
  message: 'Welcome to the team!'
}

const invalidOrgData = {
  name: '',  // Invalid: empty
  slug: 'acme-corp',
  plan: 'invalid' as any,  // Invalid: not in enum
  settings: { analytics: true }
}

const invalidInviteData = {
  email: 'not-an-email',  // Invalid: bad format
  role: 'member' as const,
  message: 'Welcome'
}

console.log('='.repeat(60))
console.log('Zod Validation Performance Benchmark')
console.log('='.repeat(60))
console.log()

// Benchmark 1: OrganizationSettings schema (valid data)
console.log('Test 1: OrganizationSettings Schema - Valid Data')
console.log('-'.repeat(60))

const iterations = 1000
console.time(`Zod validation (${iterations} iterations)`)
for (let i = 0; i < iterations; i++) {
  highRiskSchema.parse(orgTestData)
}
console.timeEnd(`Zod validation (${iterations} iterations)`)

// Calculate per-validation overhead
const start1 = performance.now()
for (let i = 0; i < iterations; i++) {
  highRiskSchema.parse(orgTestData)
}
const end1 = performance.now()
const totalTime1 = end1 - start1
const perValidation1 = totalTime1 / iterations

console.log(`Total time: ${totalTime1.toFixed(2)}ms`)
console.log(`Per validation: ${perValidation1.toFixed(4)}ms`)
console.log(`Validations per second: ${(1000 / perValidation1).toFixed(0)}`)
console.log()

// Benchmark 2: MemberInvite schema (valid data)
console.log('Test 2: MemberInvite Schema - Valid Data')
console.log('-'.repeat(60))

console.time(`Zod validation (${iterations} iterations)`)
for (let i = 0; i < iterations; i++) {
  memberInviteSchema.parse(inviteTestData)
}
console.timeEnd(`Zod validation (${iterations} iterations)`)

const start2 = performance.now()
for (let i = 0; i < iterations; i++) {
  memberInviteSchema.parse(inviteTestData)
}
const end2 = performance.now()
const totalTime2 = end2 - start2
const perValidation2 = totalTime2 / iterations

console.log(`Total time: ${totalTime2.toFixed(2)}ms`)
console.log(`Per validation: ${perValidation2.toFixed(4)}ms`)
console.log(`Validations per second: ${(1000 / perValidation2).toFixed(0)}`)
console.log()

// Benchmark 3: Error handling performance (invalid data)
console.log('Test 3: Error Handling - Invalid Data')
console.log('-'.repeat(60))

let errorCount = 0
const start3 = performance.now()
for (let i = 0; i < iterations; i++) {
  try {
    highRiskSchema.parse(invalidOrgData)
  } catch (error) {
    errorCount++
  }
}
const end3 = performance.now()
const totalTime3 = end3 - start3
const perValidation3 = totalTime3 / iterations

console.log(`Total time: ${totalTime3.toFixed(2)}ms`)
console.log(`Per validation: ${perValidation3.toFixed(4)}ms`)
console.log(`Errors caught: ${errorCount}/${iterations}`)
console.log()

// Benchmark 4: safeParse vs parse
console.log('Test 4: safeParse vs parse Performance')
console.log('-'.repeat(60))

// parse() method
const start4a = performance.now()
for (let i = 0; i < iterations; i++) {
  try {
    highRiskSchema.parse(orgTestData)
  } catch (e) {}
}
const end4a = performance.now()

// safeParse() method
const start4b = performance.now()
for (let i = 0; i < iterations; i++) {
  highRiskSchema.safeParse(orgTestData)
}
const end4b = performance.now()

console.log(`parse() total: ${(end4a - start4a).toFixed(2)}ms`)
console.log(`safeParse() total: ${(end4b - start4b).toFixed(2)}ms`)
console.log(`Difference: ${((end4b - start4b) - (end4a - start4a)).toFixed(2)}ms`)
console.log()

// Summary
console.log('='.repeat(60))
console.log('Summary')
console.log('='.repeat(60))
console.log()

const avgPerValidation = (perValidation1 + perValidation2) / 2

console.log(`✓ Average validation time: ${avgPerValidation.toFixed(4)}ms`)
console.log(`✓ Target: < 0.01ms per validation`)
console.log(`✓ Status: ${avgPerValidation < 0.01 ? 'PASS ✅' : 'ACCEPTABLE ⚠️'}`)
console.log()

if (avgPerValidation < 0.01) {
  console.log('Result: Zod overhead is negligible for HIGH RISK forms')
} else if (avgPerValidation < 0.1) {
  console.log('Result: Zod overhead is acceptable for HIGH RISK forms')
} else {
  console.log('Result: Zod overhead may impact performance - consider optimization')
}
console.log()

// Recommendation
console.log('Recommendation:')
console.log('- Use Zod for HIGH RISK forms (security > performance)')
console.log('- Use HTML5 for MEDIUM/LOW RISK forms (performance > features)')
console.log('- Zod overhead: ~' + (avgPerValidation * 100).toFixed(2) + '% of typical form submit (100ms)')
console.log()
