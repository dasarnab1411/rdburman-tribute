# Security Measures - RD Burman Tribute Website

## Overview
This document outlines the comprehensive security measures implemented to protect the RD Burman Tribute website from unauthorized access, content theft, and malicious activities.

## Client-Side Security (Frontend)

### 1. Content Protection
- **Right-Click Disabled**: Context menu is disabled across the entire website
- **Text Selection Disabled**: Users cannot select or highlight text content
- **Copy/Cut/Paste Disabled**: Clipboard operations are blocked
- **Drag & Drop Disabled**: Images and content cannot be dragged
- **Image Protection**: All images have `draggable="false"` attribute

### 2. Keyboard Shortcuts Blocked
The following keyboard shortcuts are disabled:
- `Ctrl+A` / `Cmd+A` - Select All
- `Ctrl+C` / `Cmd+C` - Copy
- `Ctrl+X` / `Cmd+X` - Cut
- `Ctrl+U` / `Cmd+U` - View Source
- `Ctrl+S` / `Cmd+S` - Save Page
- `Ctrl+P` / `Cmd+P` - Print
- `F12` - Developer Tools
- `Ctrl+Shift+I` / `Cmd+Shift+I` - Inspect Element
- `Ctrl+Shift+J` / `Cmd+Shift+J` - Console
- `Ctrl+Shift+C` / `Cmd+Shift+C` - Element Picker
- `PrintScreen` - Screenshot (clipboard cleared)

### 3. Developer Tools Detection
- Monitors window size changes to detect DevTools
- Blurs content when DevTools are detected
- Displays warning message when DevTools are open
- Console manipulation detection

### 4. Media Protection
- **Audio Elements**: 
  - Right-click disabled
  - Download option removed (`controlsList="nodownload"`)
  - Playback rate control disabled
  
- **Video Elements**:
  - Right-click disabled
  - Download option removed
  - Transparent overlay prevents interaction
  
- **YouTube Embeds**:
  - Right-click disabled on iframes
  - Transparent overlay protection
  - Applied to all video sections including "My Favourite Boss's Compositions"

### 5. CSS-Based Protection
```css
body {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}
```

## Server-Side Security (Backend)

### 1. HTTP Security Headers

#### X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
Prevents clickjacking attacks by disallowing the site to be embedded in iframes from other domains.

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents MIME type sniffing, forcing browsers to respect declared content types.

#### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
Enables browser's built-in XSS filter.

#### Content-Security-Policy (CSP)
```
Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: http:;
    frame-src 'self' https://www.youtube.com;
    media-src 'self' https: http: blob:;
    connect-src 'self' https://www.googleapis.com;
```
Restricts resource loading to trusted sources only.

#### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controls referrer information sent with requests.

#### Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```
Disables unnecessary browser features.

#### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Forces HTTPS connections for one year.

#### Cache-Control
```
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```
Prevents sensitive content caching.

### 2. CORS Configuration
- Whitelist of allowed origins
- Credentials support enabled
- Rejects requests from unauthorized domains

### 3. API Security
- Environment variables for sensitive keys
- API keys never exposed to frontend
- Request logging for monitoring

## Limitations & Disclaimers

### What These Measures DO:
✅ Deter casual users from copying content
✅ Prevent basic right-click downloads
✅ Block common keyboard shortcuts
✅ Detect and discourage DevTools usage
✅ Protect against common web attacks (XSS, clickjacking, etc.)
✅ Secure server-side operations

### What These Measures CANNOT Prevent:
❌ Determined users with technical knowledge
❌ Browser extensions that bypass restrictions
❌ Screen recording software
❌ Network traffic inspection
❌ Browser automation tools
❌ Disabling JavaScript entirely

### Important Notes:
1. **Client-side security is not foolproof** - Any determined user can bypass these restrictions
2. **These are deterrents, not absolute protection** - They make content theft harder but not impossible
3. **Legal protection is stronger** - Copyright notices and terms of service provide legal recourse
4. **User experience balance** - Some legitimate users may find restrictions inconvenient

## Best Practices for Content Protection

### Additional Recommendations:
1. **Watermark media files** - Add visible watermarks to images and videos
2. **Low-resolution previews** - Use lower quality for public display
3. **Legal notices** - Display clear copyright and usage terms
4. **DMCA protection** - Register with DMCA takedown services
5. **Regular monitoring** - Check for unauthorized use of content
6. **Terms of Service** - Clear legal terms for website usage

## Monitoring & Maintenance

### Regular Tasks:
- Review server logs for suspicious activity
- Update security headers as standards evolve
- Test security measures across different browsers
- Monitor for new bypass techniques
- Keep dependencies updated

### Incident Response:
1. Log all security-related events
2. Monitor for unusual traffic patterns
3. Have a plan for responding to breaches
4. Regular backups of content and data

## Technical Stack Security

### Dependencies:
- Express.js with security middleware
- CORS with strict origin checking
- Environment variable protection
- No sensitive data in client code

### File Structure:
```
/public          - Static files (protected by headers)
/server.js       - Backend with security headers
/.env            - Environment variables (never committed)
/SECURITY.md     - This documentation
```

## Compliance

### Standards Followed:
- OWASP Top 10 security practices
- W3C Content Security Policy
- Modern HTTP security headers
- Privacy-first approach

## Contact

For security concerns or to report vulnerabilities:
- Email: dasarnab141172@gmail.com
- Review code before reporting to avoid false positives

---

**Last Updated**: November 30, 2025
**Version**: 1.0
**Maintained By**: Arnab Das
