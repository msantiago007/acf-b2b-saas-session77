# Browser DevTools Quick Reference for Testing

**Purpose:** Guide for using browser DevTools to test and debug
**Session:** 83
**Browsers:** Chrome, Edge, Firefox (instructions for each)

---

## Opening DevTools

### All Browsers
- **Windows/Linux:** Press `F12` or `Ctrl + Shift + I`
- **Mac:** Press `Cmd + Option + I`
- **Right-click on page:** Select "Inspect" or "Inspect Element"

---

## Console Tab - Finding JavaScript Errors

### What to Look For
✅ **Green check** or no errors = Good
❌ **Red errors** = Problems to investigate

### Common Errors

#### Error: "Failed to fetch"
```
GET http://localhost:3000/api/orgs/123/members net::ERR_FAILED
```
**Means:** API request failed (server error, network issue, or 500 error)
**Action:** Check Network tab for details

#### Error: "Unauthorized" or "403 Forbidden"
```
Error: Request failed with status code 403
```
**Means:** User doesn't have permission for this operation
**Action:** Verify user role has required permission

#### Error: "Validation Error"
```
ZodError: Invalid input
```
**Means:** Data sent to API doesn't match schema
**Action:** Check request payload in Network tab

### Filtering Console Messages

**Show only errors:**
1. Click filter dropdown (top left of Console)
2. Uncheck Info, Warnings, Verbose
3. Check only Errors

**Search console:**
- Use search box (Ctrl+F) to find specific text
- Example: Search "403" to find permission errors

---

## Network Tab - Monitoring API Requests

### Basic Usage

1. **Open Network tab**
2. **Refresh page** or perform action
3. **Look for API calls** (usually start with `/api/`)
4. **Click on request** to see details

### What to Check

#### Request Method & Status
- **Method:** GET, POST, PUT, DELETE
- **Status:** 200 (OK), 201 (Created), 400 (Bad Request), 403 (Forbidden), 500 (Server Error)

**Status Code Guide:**
- `200` ✅ - Success (read operation)
- `201` ✅ - Created (new resource)
- `204` ✅ - Success (no content)
- `400` ❌ - Bad Request (validation error)
- `401` ❌ - Unauthorized (not logged in)
- `403` ❌ - Forbidden (no permission)
- `404` ❌ - Not Found
- `429` ⚠️ - Rate Limited (too many requests)
- `500` ❌ - Server Error (bug in code)

#### Request Headers
Look for:
- `Authorization: Bearer <token>` - Auth token sent
- `Content-Type: application/json` - Sending JSON data

#### Response Headers
Look for:
- `X-Request-ID: abc123` - Request tracking ID
- `X-RateLimit-Remaining: 95` - Rate limit status
- Security headers (HSTS, X-Frame-Options, etc.)

#### Request Payload (Body)
**For POST/PUT requests:**
1. Click on request in Network tab
2. Click **"Payload"** or **"Request"** sub-tab
3. View data sent to server

**Example:**
```json
{
  "role": "admin",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Response Body
1. Click on request
2. Click **"Response"** or **"Preview"** sub-tab
3. View data returned from server

**Success Example:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "role": "admin"
  }
}
```

**Error Example:**
```json
{
  "error": "Forbidden",
  "message": "User does not have manage_members permission"
}
```

#### Timing Information
1. Click on request
2. Click **"Timing"** tab
3. View detailed breakdown:
   - **Waiting (TTFB):** Time to first byte (server processing)
   - **Content Download:** Download time
   - **Total:** End-to-end time

**For Performance Testing:**
- Note the **"Waiting"** time (server response time)
- Compare against targets:
  - GET requests: < 50ms
  - POST/PUT requests: < 100ms

### Filtering Network Requests

**Show only API calls:**
1. Click **"Fetch/XHR"** filter button
2. Only shows AJAX/API requests

**Search for specific request:**
- Use search box: Type `/api/members`
- Highlights matching requests

**Clear network log:**
- Click 🚫 (clear) button to reset
- Useful when testing specific action

### Preserve Log
**Important:** Check "Preserve log" checkbox
- Keeps network requests across page navigations
- Useful if form redirects after submit

---

## Application Tab - Checking Storage

### LocalStorage
1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Expand **Local Storage**
3. Click on your domain
4. View stored data

**Look for:**
- Auth tokens
- User preferences
- Cached data

### Session Storage
Similar to LocalStorage but cleared when browser closes

### Cookies
1. Go to **Application** → **Cookies**
2. View authentication cookies
3. Check expiration times

**Key Cookie:**
- Usually named `sb-access-token` or similar (Supabase)
- Contains authentication token

---

## Sources/Debugger Tab - Finding Code Issues

### Setting Breakpoints
1. Go to **Sources** tab (Chrome) or **Debugger** tab (Firefox)
2. Find file in file tree
3. Click line number to set breakpoint
4. Perform action (breakpoint will pause execution)

**Useful for:**
- Debugging form submission logic
- Inspecting variables before API call

### Pause on Exceptions
1. Click "⏸️" icon (pause on exceptions)
2. Code will pause when error occurs
3. Inspect variables at point of failure

---

## Performance Tab - Advanced Timing

### Recording Performance
1. Open **Performance** tab
2. Click **Record** (circle icon)
3. Perform action (load page, submit form)
4. Click **Stop**
5. View timeline of all events

**Look for:**
- Slow API calls (red bars)
- Long-running scripts
- Layout thrashing

**For Session 83:** Network tab timing is sufficient. Use Performance tab only if investigating slow page loads.

---

## Quick Testing Workflows

### Workflow 1: Testing Form Submission

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Check "Preserve log"**
4. **Clear existing requests** (🚫 button)
5. **Fill out form and submit**
6. **Find API request** in Network list
7. **Check status code** (200, 201, 400, 403?)
8. **Click on request** → View Response
9. **Switch to Console tab** → Check for errors
10. **Document result** in TEST_RESULTS_SESSION81.md

---

### Workflow 2: Testing Permissions

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Clear network log**
4. **Attempt restricted operation**
5. **Find API request**
6. **Verify status code:**
   - Owner/Admin: Should be 200/201
   - Member/Viewer: Should be 403
7. **Click on request** → View Response
8. **Check error message**: Should mention "permission"
9. **Document in permission matrix**

---

### Workflow 3: Performance Benchmarking

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Clear network log**
4. **Disable cache:** Check "Disable cache" checkbox
5. **Perform action** (click Load Members, etc.)
6. **Click on API request**
7. **Click "Timing" tab**
8. **Note "Waiting (TTFB)" time** - This is server response time
9. **Repeat 3 times**, calculate average
10. **Document in performance table**

**Example:**
```
GET /api/orgs/123/members
Run 1: 42ms
Run 2: 38ms
Run 3: 45ms
Average: 41.7ms ✅ (Target: <50ms)
```

---

### Workflow 4: Debugging Failed Requests

1. **Open DevTools** (F12)
2. **Reproduce the error**
3. **Go to Console tab** → Copy error message
4. **Go to Network tab** → Find failed request (red)
5. **Click on request:**
   - Check **Status** (400? 403? 500?)
   - Check **Response** for error details
   - Check **Request Payload** to see what was sent
   - Check **Headers** for auth token
6. **Take screenshot** of error
7. **Document in Issues section** of test results

---

## Browser-Specific Tips

### Chrome/Edge
- **Network throttling:** Simulate slow connection (Network tab → Throttling dropdown)
- **Device mode:** Test mobile view (Ctrl+Shift+M)
- **Copy as cURL:** Right-click request → Copy → Copy as cURL (share exact request)

### Firefox
- **Network monitor** is more detailed by default
- **Storage** tab shows all storage types in one place
- **Responsive Design Mode:** Ctrl+Shift+M

---

## Screenshot Guide

### What to Capture

#### For Successful Tests:
- Network tab showing 200/201 status
- Response body with success message
- (Optional) Console with no errors

#### For Failed Tests:
- Network tab showing error status (400, 403, 500)
- Response body with error message
- Console showing any JavaScript errors
- Request payload (to show what was sent)

### How to Take Screenshots

**Windows:**
- `Win + Shift + S` → Select area
- OR use **Snipping Tool**

**Mac:**
- `Cmd + Shift + 4` → Select area

**Browser Built-in (Chrome/Edge):**
1. Right-click on page
2. **Inspect**
3. Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
4. Type "screenshot"
5. Choose:
   - "Capture full size screenshot" (whole page)
   - "Capture area screenshot" (select area)
   - "Capture screenshot" (visible area)

---

## Keyboard Shortcuts Cheat Sheet

### Essential Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Open DevTools | F12 or Ctrl+Shift+I | Cmd+Option+I |
| Open Console | Ctrl+Shift+J | Cmd+Option+J |
| Inspect Element | Ctrl+Shift+C | Cmd+Option+C |
| Search in DevTools | Ctrl+F | Cmd+F |
| Toggle Device Mode | Ctrl+Shift+M | Cmd+Shift+M |
| Hard Refresh (clear cache) | Ctrl+Shift+R | Cmd+Shift+R |
| Clear Console | Ctrl+L | Cmd+K |

---

## Common Issues & Solutions

### Issue: "Not seeing API requests in Network tab"
**Solutions:**
- Make sure **Fetch/XHR** filter is selected
- Check **"Preserve log"** is enabled
- Clear network log and try again
- Verify action actually triggered (check Console for errors)

### Issue: "Can't see response body"
**Solutions:**
- Click on the request in Network tab
- Switch to **"Response"** or **"Preview"** sub-tab
- If empty, might be 204 No Content (expected)

### Issue: "Timing tab shows 0ms or blank"
**Solutions:**
- Request might be cached (disable cache)
- Request might have failed before timing
- Try again with cache disabled

### Issue: "Too many requests, can't find the right one"
**Solutions:**
- Clear network log before testing
- Use Fetch/XHR filter
- Use search box to filter by URL
- Look at "Type" column (should be "fetch" or "xhr")

---

## Test Result Documentation Template

When documenting test results, include:

```markdown
##### TC1.1: Load Members
- **Status:** ✅ PASSED
- **Result:**
  - HTTP Status: 200 OK
  - Response Time: 42ms
  - Members Loaded: 3 (owner, admin, member)
  - X-Request-ID: abc123-def456
- **Notes:**
  - No console errors
  - Response body matched expected schema
  - Screenshot: TC1.1_success.png
```

---

## Additional Resources

### Learn More
- [Chrome DevTools Docs](https://developer.chrome.com/docs/devtools/)
- [Firefox DevTools Docs](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Network Panel Reference](https://developer.chrome.com/docs/devtools/network/)

### Video Tutorials
- Search YouTube for "Chrome DevTools tutorial"
- Session-specific: "Testing API with DevTools"

---

**Created:** Session 83
**Last Updated:** 2025-12-13

**Quick Reference Card:**
```
┌────────────────────────────────────────┐
│    DEVTOOLS TESTING CHEAT SHEET        │
├────────────────────────────────────────┤
│ 1. F12 - Open DevTools                 │
│ 2. Network Tab - See API calls         │
│ 3. Console Tab - See errors            │
│ 4. Check Status Code (200, 403, etc.)  │
│ 5. View Response - See server message  │
│ 6. Timing Tab - Measure performance    │
│ 7. Screenshot errors                   │
│ 8. Document results                    │
└────────────────────────────────────────┘
```
