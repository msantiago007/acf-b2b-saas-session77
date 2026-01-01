# Production Deployment Checklist

**Application:** B2B SaaS Platform (ACF Generated)
**Version:** Session 81 Infrastructure
**Date:** 2025-12-13
**Deployment Target:** Vercel (Production)

---

## Pre-Deployment Verification

### Code Quality & Testing

- [ ] All test cases passing (see TEST_RESULTS_SESSION81.md)
- [ ] Permission matrix validated across all roles
- [ ] No TypeScript compilation errors
- [ ] ESLint warnings reviewed and addressed
- [ ] Performance targets met (< 50ms for GETs, < 100ms for POSTs)
- [ ] Security audit completed (headers, rate limiting, auth checks)

### Database Readiness

- [ ] Database scripts executed successfully
  - [ ] Users sync trigger deployed (05_users_sync_trigger.sql)
  - [ ] Foreign key constraints restored (06_restore_foreign_keys.sql)
- [ ] Schema integrity verified (all FKs with CASCADE)
- [ ] No orphaned records in database
- [ ] Database backups configured

### Environment Configuration

- [ ] Environment variables configured in Vercel:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (secret)
  - [ ] `NODE_ENV` set to "production"
- [ ] All environment variables validated at build time (lib/env.ts)
- [ ] No secrets committed to git repository
- [ ] API keys rotated (if needed)

### Security Hardening

- [ ] Security headers verified:
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
  - [ ] Permissions-Policy configured
  - [ ] X-DNS-Prefetch-Control: off
  - [ ] X-XSS-Protection: 1; mode=block
- [ ] Rate limiting active (100 req/min default)
- [ ] CORS policies reviewed
- [ ] Authentication flow tested
- [ ] RLS policies active in Supabase

---

## Deployment Process

### Version Control

- [ ] All changes committed to git
- [ ] Commit message follows convention
- [ ] Code pushed to main branch
- [ ] Git tag created for release (optional)

### Vercel Deployment

- [ ] Code pushed to GitHub (auto-triggers deployment)
- [ ] Vercel deployment started
- [ ] Build logs reviewed - no errors
- [ ] Deployment successful notification received
- [ ] Production URL accessible

### Build Verification

- [ ] Next.js build completed successfully
- [ ] No build warnings for production issues
- [ ] Static pages generated correctly
- [ ] API routes deployed (check Vercel Functions tab)
- [ ] Middleware deployed and active

---

## Post-Deployment Validation

### Smoke Tests

- [ ] Homepage loads successfully
- [ ] Authentication flow works:
  - [ ] Login with test user (owner@acme-test.com)
  - [ ] Session persists across page reloads
  - [ ] Logout works correctly
- [ ] Critical API endpoints respond:
  - [ ] GET /api/orgs/:orgId
  - [ ] GET /api/orgs/:orgId/members
  - [ ] GET /api/orgs/:orgId/teams
- [ ] Test pages accessible:
  - [ ] /test/auth-check
  - [ ] /test/member-role
  - [ ] /test/org-settings
  - [ ] /test/member-invite
  - [ ] /test/team-create

### Security Validation

- [ ] Security headers present in browser DevTools (Network tab)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Request logging active (check Vercel logs)
- [ ] Rate limiting functional (test with rapid requests)
- [ ] Unauthorized access blocked (403 responses)

### Database Connectivity

- [ ] API can connect to Supabase
- [ ] Service role key working
- [ ] RLS policies not blocking server-side queries
- [ ] Data reads/writes successful

### Monitoring Setup

- [ ] Error tracking configured (lib/logger.ts active)
- [ ] Request logging producing logs
- [ ] Vercel Analytics enabled
- [ ] Error rates monitored (target: < 1%)
- [ ] Response times tracked (P95 < 100ms)

---

## Rollback Plan

### Rollback Triggers

Rollback if any of the following occur:
- Critical bug preventing core functionality
- Security vulnerability discovered
- Database corruption or data loss
- Error rate > 5%
- P95 response time > 500ms
- Unable to authenticate users

### Rollback Steps

1. **Immediate Actions:**
   - [ ] Notify team of rollback decision
   - [ ] Document rollback reason and timestamp

2. **Vercel Rollback:**
   - [ ] Navigate to Vercel Dashboard > Deployments
   - [ ] Find previous stable deployment
   - [ ] Click "..." menu → "Promote to Production"
   - [ ] Confirm rollback

3. **Database Rollback (if needed):**
   - [ ] Restore database from backup
   - [ ] Or execute rollback scripts:
     ```sql
     -- Remove trigger (if needed)
     DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
     DROP FUNCTION IF EXISTS public.sync_auth_user();

     -- Remove FK constraint (if needed)
     ALTER TABLE organization_members
       DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
     ```

4. **Verification:**
   - [ ] Previous version deployed successfully
   - [ ] Core functionality restored
   - [ ] Users can access system
   - [ ] Error rates normalized

5. **Post-Rollback:**
   - [ ] Incident report created
   - [ ] Root cause analysis scheduled
   - [ ] Fix planned for next deployment

---

## Post-Deployment Tasks

### Team Communication

- [ ] Team notified of successful deployment
- [ ] Deployment notes shared (what changed, what to test)
- [ ] Known issues documented (if any)
- [ ] Support team briefed on new features

### Documentation

- [ ] Deployment logged in SESSION_82_SUMMARY.md
- [ ] Test results finalized in TEST_RESULTS_SESSION81.md
- [ ] API documentation updated (if endpoints changed)
- [ ] User documentation updated (if UI changed)

### Monitoring

- [ ] Monitor error rates for 24 hours post-deployment
- [ ] Review Vercel logs for anomalies
- [ ] Check performance metrics
- [ ] Verify no increase in failed requests

---

## Ongoing Maintenance

### Daily

- [ ] Check error logs in Vercel dashboard
- [ ] Monitor authentication failures
- [ ] Review rate limit hits

### Weekly

- [ ] Review security headers (automated check)
- [ ] Check database query performance
- [ ] Analyze API response times
- [ ] Review Supabase RLS logs

### Monthly

- [ ] Update npm dependencies
- [ ] Review and rotate API keys
- [ ] Audit user permissions
- [ ] Check for new Supabase features
- [ ] Database backup verification

### Quarterly

- [ ] Security audit (penetration testing)
- [ ] Performance benchmarking
- [ ] Database cleanup (remove old logs/data)
- [ ] Review and update RLS policies

---

## Emergency Contacts

### Team Contacts

- **Lead Developer:** [Name/Email]
- **DevOps:** [Name/Email]
- **Database Admin:** [Name/Email]

### External Services

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/dashboard/support

### Escalation Path

1. Check Vercel logs and deployment status
2. Review Supabase dashboard for database issues
3. Consult deployment documentation
4. Contact team lead
5. Consider rollback if critical issue
6. Engage vendor support if service-level issue

---

## Deployment Sign-Off

### Pre-Deployment

- **Tested By:** _______________
- **Date:** _______________
- **Approved By:** _______________
- **Date:** _______________

### Post-Deployment

- **Verified By:** _______________
- **Date:** _______________
- **Production Stable:** [ ] Yes [ ] No
- **Issues Found:** _______________

---

## Session 81 Specific Checklist

### Infrastructure Additions

- [ ] Error logger (lib/logger.ts) active in production
- [ ] Request logging middleware processing all API calls
- [ ] Environment validation runs at build time
- [ ] Rate limiting protecting all API routes
- [ ] Security headers visible in all responses

### Critical Fixes Validated

- [ ] Member role form loads data (was blocked in Session 79)
- [ ] Organization settings form loads data (was blocked in Session 79)
- [ ] Server-side API bypasses RLS correctly
- [ ] All RBAC permissions enforced

---

**Checklist Version:** 1.0
**Last Updated:** 2025-12-13
**Next Review:** After Session 83
