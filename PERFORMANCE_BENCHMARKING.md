# Performance Benchmarking Guide

**Purpose:** Measure API response times and verify performance targets
**Session:** 83
**Status:** Ready for execution

---

## Performance Targets

### Response Time Targets

| Operation Type | Target | Acceptable | Poor |
|---------------|--------|------------|------|
| **Read (GET)** | < 50ms | 50-100ms | > 100ms |
| **Write (POST/PUT)** | < 100ms | 100-200ms | > 200ms |
| **Delete** | < 50ms | 50-100ms | > 100ms |

### Why These Targets?

- **< 50ms:** Feels instant to users
- **50-100ms:** Still responsive
- **100-200ms:** Noticeable but acceptable
- **> 200ms:** Feels slow, impacts UX

**Context:**
- These are server response times (not including network latency)
- Measured as "Time to First Byte" (TTFB) or "Waiting" time in DevTools
- Production app served via Vercel Edge Network (fast CDN)

---

## Measurement Method

### Using Browser DevTools Network Tab

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Clear network log** (🚫 button)
4. **Disable cache** (check "Disable cache" checkbox)
   - This ensures we measure real server time, not cached responses
5. **Perform action** (click button, submit form)
6. **Click on API request** in Network list
7. **Click "Timing" tab**
8. **Record "Waiting (TTFB)" time**
   - This is the server processing time we're measuring
9. **Repeat 3 times** for each endpoint
10. **Calculate average**

### What NOT to Measure
❌ **Total request time** - includes network latency
❌ **Content download** - measures payload size, not server performance
❌ **Cached responses** - not representative of real performance

✅ **ONLY measure "Waiting (TTFB)"** - server processing time

---

## Test Environment Setup

### Before Testing

1. ✅ **Login as owner@acme-test.com**
   - Most operations require authentication
   - Use consistent user for all benchmarks

2. ✅ **Close unnecessary browser tabs**
   - Reduce background activity

3. ✅ **Connect to stable network**
   - Avoid wifi interference
   - Pause large downloads

4. ✅ **Disable browser extensions** (optional)
   - Some extensions may interfere with timing

5. ✅ **Clear browser cache**
   - Ensure fresh requests

---

## Endpoints to Benchmark

### 1. GET /api/orgs/:orgId/members - List Members

**Target:** < 50ms (read operation)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 50ms, ⚠️ 50-100ms, ❌ > 100ms |

**Test Steps:**
1. Go to /test/member-role
2. Open DevTools → Network tab
3. Clear network log, disable cache
4. Click "Load Members"
5. Find GET request to `/api/orgs/.../members`
6. Click request → Timing tab
7. Record "Waiting (TTFB)" time
8. Refresh page, repeat 2 more times
9. Calculate average

**SQL to check data size:**
```sql
SELECT COUNT(*) AS member_count
FROM organization_members
WHERE organization_id = '00000000-0000-0000-0000-000000000001';
```

**Expected:** ~3 members (small dataset, should be fast)

---

### 2. POST /api/orgs/:orgId/members - Invite Member

**Target:** < 100ms (write operation)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 100ms, ⚠️ 100-200ms, ❌ > 200ms |

**Test Steps:**
1. Go to /test/member-invite
2. Open DevTools → Network tab
3. Clear network log, disable cache
4. Invite perf-test-1@example.com
5. Find POST request to `/api/orgs/.../members`
6. Click request → Timing tab
7. Record "Waiting (TTFB)" time
8. Delete user (see cleanup below)
9. Repeat with perf-test-2@example.com and perf-test-3@example.com
10. Calculate average

**Cleanup between runs:**
```sql
DELETE FROM organization_members
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'perf-test-%@example.com'
)
AND organization_id = '00000000-0000-0000-0000-000000000001';

DELETE FROM users WHERE email LIKE 'perf-test-%@example.com';
```

---

### 3. PUT /api/orgs/:orgId/members/:userId - Update Role

**Target:** < 50ms (write operation, but simple)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 50ms, ⚠️ 50-100ms, ❌ > 100ms |

**Test Steps:**
1. Go to /test/member-role
2. Click "Load Members"
3. Open DevTools → Network tab
4. Clear network log, disable cache
5. Change member@acme-test.com role to "viewer"
6. Submit
7. Find PUT request to `/api/orgs/.../members/...`
8. Record "Waiting (TTFB)" time
9. Reset role back to "member" (repeat process)
10. Alternate between "member" and "viewer" 3 times

**Reset role:**
```sql
UPDATE organization_members
SET role = 'member', updated_at = NOW()
WHERE user_id IN (SELECT id FROM users WHERE email = 'member@acme-test.com');
```

---

### 4. DELETE /api/orgs/:orgId/members/:userId - Remove Member

**Target:** < 50ms (delete operation)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 50ms, ⚠️ 50-100ms, ❌ > 100ms |

**Test Steps:**
1. Create 3 temporary members:
   - delete-test-1@example.com
   - delete-test-2@example.com
   - delete-test-3@example.com
2. Use browser console or API client to DELETE each:
   ```javascript
   // In browser console
   const userId = 'USER_ID_HERE'; // Get from Load Members
   fetch(`/api/orgs/00000000-0000-0000-0000-000000000001/members/${userId}`, {
     method: 'DELETE',
     headers: { 'Content-Type': 'application/json' }
   }).then(r => console.log(r.status, r));
   ```
3. Record timing from Network tab for each DELETE

**Note:** If DELETE form doesn't exist, this test may be skipped or require manual API calls.

---

### 5. GET /api/orgs/:orgId - Get Organization

**Target:** < 30ms (read single record, should be very fast)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 30ms, ⚠️ 30-50ms, ❌ > 50ms |

**Test Steps:**
1. Go to /test/org-settings
2. Open DevTools → Network tab
3. Clear network log, disable cache
4. Click "Load Current Data"
5. Find GET request to `/api/orgs/...`
6. Record "Waiting (TTFB)" time
7. Refresh page, repeat 2 more times

---

### 6. PUT /api/orgs/:orgId - Update Organization

**Target:** < 50ms (write operation, simple update)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 50ms, ⚠️ 50-100ms, ❌ > 100ms |

**Test Steps:**
1. Go to /test/org-settings
2. Load current data
3. Open DevTools → Network tab
4. Clear network log, disable cache
5. Change org name to "Acme Test Corp 1"
6. Submit
7. Record "Waiting (TTFB)" time
8. Repeat with "Acme Test Corp 2", "Acme Test Corp 3"

**Reset org name:**
```sql
UPDATE organizations
SET name = 'Acme Test Corp', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

### 7. GET /api/orgs/:orgId/teams - List Teams

**Target:** < 50ms (read operation)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 50ms, ⚠️ 50-100ms, ❌ > 100ms |

**Test Steps:**
1. Go to /test/team-create
2. Open DevTools → Network tab
3. Clear network log, disable cache
4. Load teams list
5. Find GET request to `/api/orgs/.../teams`
6. Record "Waiting (TTFB)" time
7. Refresh page, repeat 2 more times

---

### 8. POST /api/orgs/:orgId/teams - Create Team

**Target:** < 100ms (write operation)

| Run | Response Time | Notes |
|-----|---------------|-------|
| 1 | ⏸️ PENDING | |
| 2 | ⏸️ PENDING | |
| 3 | ⏸️ PENDING | |
| **Average** | ⏸️ PENDING | |
| **Status** | ⏸️ PENDING | ✅ < 100ms, ⚠️ 100-200ms, ❌ > 200ms |

**Test Steps:**
1. Go to /test/team-create
2. Open DevTools → Network tab
3. Clear network log, disable cache
4. Create team "Perf Test Team 1"
5. Find POST request to `/api/orgs/.../teams`
6. Record "Waiting (TTFB)" time
7. Repeat with "Perf Test Team 2" and "Perf Test Team 3"

**Cleanup:**
```sql
DELETE FROM teams
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND name LIKE 'Perf Test Team%';
```

---

## Performance Summary

### Results Table

| Endpoint | Target | Average | Status | Notes |
|----------|--------|---------|--------|-------|
| GET /members | < 50ms | ⏸️ | ⏸️ | |
| POST /members | < 100ms | ⏸️ | ⏸️ | |
| PUT /members/:id | < 50ms | ⏸️ | ⏸️ | |
| DELETE /members/:id | < 50ms | ⏸️ | ⏸️ | |
| GET /orgs/:id | < 30ms | ⏸️ | ⏸️ | |
| PUT /orgs/:id | < 50ms | ⏸️ | ⏸️ | |
| GET /teams | < 50ms | ⏸️ | ⏸️ | |
| POST /teams | < 100ms | ⏸️ | ⏸️ | |

**Overall Performance Rating:** ⏸️ PENDING

**Performance Score Calculation:**
- ✅ Pass: Response time within target
- ⚠️ Acceptable: Response time within 2x target
- ❌ Fail: Response time > 2x target

**Target:** 100% of endpoints pass (all ✅)
**Acceptable:** 80%+ pass, 20% acceptable (⚠️)
**Poor:** Any ❌ or < 80% pass rate

---

## Factors Affecting Performance

### Server-Side Factors
1. **Database Query Performance**
   - Simple queries (by ID): Very fast (< 10ms)
   - Joins (members with users): Moderate (10-30ms)
   - Complex aggregations: Slower (30-100ms)

2. **Supabase Service Role Client**
   - Bypasses RLS (faster than client-side queries)
   - Direct database connection

3. **Vercel Edge Functions**
   - Deployed globally (low latency)
   - Cold starts can add 50-200ms (first request after idle)

4. **Middleware Overhead**
   - Request logging: ~1-5ms
   - Rate limiting: ~1-5ms
   - Auth verification: ~5-15ms

### Client-Side Factors
1. **Network Latency** (NOT measured in TTFB)
   - Local network: 1-10ms
   - ISP routing: 10-50ms
   - Geographic distance: 50-200ms

2. **Browser Processing**
   - JSON parsing: ~1ms
   - React re-rendering: ~5-20ms

---

## Performance Optimization Notes

### If Performance is Poor (> targets)

**Diagnose:**
1. Check if cold start (first request after idle)
   - Solution: Accept cold starts, or implement warming
2. Check database query logs in Supabase
   - Look for slow queries (> 50ms)
3. Check Vercel function logs
   - Look for timeout errors

**Quick Wins:**
1. Add database indexes on frequently queried columns
2. Reduce payload size (only return needed fields)
3. Implement caching for read operations
4. Optimize database queries (avoid N+1)

**Advanced:**
1. Implement edge caching (Vercel Edge Config)
2. Use database connection pooling
3. Optimize JSON serialization
4. Implement pagination for large lists

---

## Cold Start Testing (Optional)

### What is a Cold Start?
- Vercel Edge Functions sleep after inactivity
- First request after sleep takes longer (50-200ms extra)
- Subsequent requests are fast

### Testing Cold Starts
1. Wait 5 minutes without making any requests
2. Make first request, record time
3. Immediately make second request, record time
4. Compare: Second request should be much faster

**Expected:**
- Cold start: 50-200ms extra
- Warm requests: Normal performance

**Note:** Cold starts are normal and acceptable for development. Production can use warming strategies.

---

## Rate Limiting Impact on Performance

### Testing with Rate Limiting

**Rate Limit:** 100 requests per minute

**If you hit rate limit:**
- You'll receive 429 Too Many Requests
- Wait 60 seconds before continuing
- This validates rate limiting works!

**To avoid rate limiting:**
- Space out test runs (wait 5-10 seconds between runs)
- Use different test users to spread load
- Don't rapid-fire requests

---

## Documentation Checklist

After completing performance benchmarking:

- [ ] All 8 endpoints tested (3 runs each = 24 total requests)
- [ ] Average response times calculated
- [ ] Status assigned (✅/⚠️/❌) for each endpoint
- [ ] Results copied to TEST_RESULTS_SESSION81.md
- [ ] Any slow endpoints documented with investigation notes
- [ ] Overall performance rating assigned
- [ ] Cleanup SQL run to remove test data

---

## Troubleshooting

### Issue: Times are inconsistent (vary widely)
**Causes:**
- Network latency fluctuations
- Browser background activity
- Server cold starts
**Solution:**
- Run more samples (5 runs instead of 3)
- Discard outliers (remove highest/lowest)
- Test at different times of day

### Issue: All times are very slow (> 500ms)
**Causes:**
- Slow network connection
- Vercel service degradation
- Database performance issue
**Solution:**
- Check internet speed (speedtest.net)
- Check Vercel status page
- Check Supabase status page
- Document as environmental issue

### Issue: First request slow, subsequent fast
**Cause:** Cold start (expected)
**Solution:** Document cold start time separately

---

## Success Criteria

Performance benchmarking is successful when:

1. ✅ All 8 endpoints tested with 3 runs each
2. ✅ 80%+ of endpoints meet or beat target times
3. ✅ No endpoints > 2x target time
4. ✅ Results documented in TEST_RESULTS_SESSION81.md
5. ✅ Any performance issues investigated and documented

---

**Created:** Session 83
**Last Updated:** 2025-12-13

**Quick Reference:**
```
┌─────────────────────────────────────────────┐
│      PERFORMANCE TESTING CHECKLIST          │
├─────────────────────────────────────────────┤
│ 1. Login as owner@acme-test.com             │
│ 2. Open DevTools → Network tab              │
│ 3. Disable cache                            │
│ 4. Perform action                           │
│ 5. Click API request → Timing tab           │
│ 6. Record "Waiting (TTFB)" time             │
│ 7. Repeat 3 times per endpoint              │
│ 8. Calculate average                        │
│ 9. Compare to target                        │
│ 10. Document results                        │
├─────────────────────────────────────────────┤
│ Targets: GET < 50ms, POST/PUT < 100ms       │
└─────────────────────────────────────────────┘
```
