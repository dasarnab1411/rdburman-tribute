/**
 * Email Verification API Module
 * Enterprise-grade email verification with GDPR compliance
 * 
 * Features:
 * - Syntax validation
 * - MX record lookup
 * - SMTP handshake check (without sending)
 * - Domain trust assessment
 * - Reputation and breach analysis
 * - Risk scoring (Low/Medium/High)
 * 
 * @author R.D. Burman Tribute Project
 * @version 1.0.0
 */

const dns = require('dns').promises;
const net = require('net');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  // Disposable email domains (partial list - expand as needed)
  DISPOSABLE_DOMAINS: new Set([
    'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamail.biz','guerrillamail.de','10minutemail.com','10minutemail.net',
	'10minutemail.org','temp-mail.org','temp-mail.io','temp-mail.net','temp-mail.ru','tempmail.com','tempmailo.com','throwawaymail.com','dispostable.com','getnada.com',
	'maildrop.cc','mailnesia.com','mailcatch.com','emailondeck.com','fakeinbox.com','mintemail.com','sharklasers.com','guerrillamailblock.com','spam4.me','spamgourmet.com',
	'spamavert.com','trashmail.com','trashmail.de','trashmail.net','incognitomail.org','mailnull.com','yopmail.com','yopmail.net','yopmail.fr','yopmail.org','cool.fr.nf',
	'jetable.fr.nf','nomail.pw','mailtemp.info','mailtemp.online','mailtemp.site','mailtemp.me','example.com','example.net','example.org','test.com','testmail.com','devnullmail.com',
	'null.net','fakeemail.com','emailfake.com','mail.ru.temp','mailtemp.ru','tempmail.pl','tempmail.de','tempmail.fr','mail-temp.cz','mail-temp.eu',
	'*@*.xyz','*@*.top','*@*.icu','*@*.cf','*@*.tk','*@*.ml','*@*.ga','aol.com','comcast.net','verizon.net','att.net','sbcglobal.net','cox.net','charter.net','bellsouth.net',
	'earthlink.net','web.de','gmx.de','gmx.net','t-online.de','freenet.de','orange.fr','laposte.net','wanadoo.fr','free.fr','sfr.fr',
	'libero.it','virgilio.it','alice.it','tin.it','terra.es','telefonica.net','ya.com','ziggo.nl','kpnmail.nl','btinternet.com','sky.com',
	'sky.co.uk','virginmedia.com','talktalk.net','ntlworld.com','blueyonder.co.uk','mail.ru','yandex.ru','yandex.com','rambler.ru','bk.ru',
	'inbox.ru','list.ru','qq.com','163.com','126.com','yeah.net','sina.com','sohu.com','yahoo.co.jp','ezweb.ne.jp','docomo.ne.jp','softbank.ne.jp',
	'au.com','naver.com','daum.net','hanmail.net','kakao.com','uol.com.br','bol.com.br','terra.com.br','ig.com.br','prodigy.net.mx','telmexmail.com',
	'latinmail.com','sympatico.ca','bell.net','rogers.com','shaw.ca','fastmail.com','zoznam.sk','seznam.cz','tuta.com','posteo.de',
	]),
	
	 // Invalid domains that look like email but aren't email services
  INVALID_DOMAINS: new Set([
    // URL shorteners
    'gl.com', 'goo.gl', 'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
    // Test/example domains (RFC 2606)
    'test.com', 'example.com', 'example.org', 'example.net', 'test.org', 'test.net',
    'localhost', 'localhost.localdomain', 'invalid.com', 'invalid.org',
    // Obviously fake
    'fake.com', 'fake.org', 'fake.net', 'none.com', 'null.com', 'void.com',
    'noemail.com', 'noreply.com', 'nowhere.com',
    // Random/test patterns
    'abc.com', 'xyz.com', 'aaa.com', 'bbb.com', 'ccc.com', 'ddd.com',
    'asdf.com', 'qwerty.com', 'temp.com', 'no.com', 'na.com', 'xx.com',
    '123.com', '1234.com', 'mail.co',
    // Generic placeholders
    'domain.com', 'email.com', 'website.com', 'company.com', 'business.com',
    'yourcompany.com', 'yourdomain.com', 'yoursite.com', 'mycompany.com',
    'sample.com', 'demo.com', 'testing.com'
  ]),

  // Free email providers
  FREE_EMAIL_PROVIDERS: new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com',
    'yandex.com', 'gmx.com', 'inbox.com', 'fastmail.com', 'tutanota.com',
    'rediffmail.com'
  ]),

  // Trusted enterprise domains (example - customize for your use)
  TRUSTED_DOMAINS: new Set([
    'microsoft.com', 'google.com', 'apple.com', 'amazon.com',
    'ibm.com', 'oracle.com', 'salesforce.com', 'adobe.com'
  ]),
  
  
  // Common valid TLDs
  COMMON_VALID_TLDS: new Set([
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'co', 'io', 'ai', 'app', 'dev', 'tech', 'online', 'store', 'shop',
    'in', 'ie', 'at', 'ch', 'pl', 'se', 'no', 'dk', 'fi', 'cz', 'pt', 'gr',
    'hu', 'ro', 'bg', 'hr', 'sk', 'si', 'lt', 'lv', 'ee', 'ua', 'by',
    'info', 'biz', 'name', 'pro', 'mobi', 'tel', 'asia', 'eu'
  ]),

  // SMTP timeout in milliseconds
  SMTP_TIMEOUT: 10000,

  // Risk score thresholds
  RISK_THRESHOLDS: {
    LOW: 30,      // Score <= 30: Low risk (accept)
    MEDIUM: 60,   // Score 31-60: Medium risk (challenge)
    HIGH: 100     // Score > 60: High risk (reject)
  },

  // Score weights
  SCORE_WEIGHTS: {
    INVALID_SYNTAX: 100,
    NO_MX_RECORD: 50,
    SMTP_FAIL: 30,
    DISPOSABLE_DOMAIN: 80,
    FREE_EMAIL: 10,
    NEW_DOMAIN: 25,
    NO_SPF: 15,
    NO_DKIM: 10,
    NO_DMARC: 10,
    SUSPICIOUS_PATTERN: 20,
    ROLE_BASED: 15,
    BREACH_DETECTED: 40
  }
};

// ============================================================
// EMAIL SYNTAX VALIDATION
// ============================================================
class SyntaxValidator {
  // RFC 5322 compliant email regex
  static EMAIL_REGEX = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

  // Role-based email prefixes
  static ROLE_PREFIXES = [
    'admin', 'administrator', 'info', 'contact', 'support', 'sales',
    'help', 'webmaster', 'postmaster', 'hostmaster', 'abuse', 'noreply',
    'no-reply', 'marketing', 'billing', 'accounts', 'hr', 'jobs',
    'careers', 'press', 'media', 'team', 'hello', 'office'
  ];

  static validate(email) {
    const result = {
      isValid: false,
      localPart: null,
      domain: null,
      errors: [],
      warnings: [],
      isRoleBased: false,
      hasSuspiciousPattern: false
    };

 // Check if domain has valid structure
  static isValidDomainStructure(domain) {
    // Must have at least one dot
    if (!domain.includes('.')) return false;
    
    // Split into parts
    const parts = domain.split('.');
    
    // Must have at least 2 parts
    if (parts.length < 2) return false;
    
    // Each part must be non-empty and valid
    for (const part of parts) {
      if (!part || part.length === 0) return false;
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(part)) return false;
    }
    
    // TLD must be at least 2 characters
    const tld = parts[parts.length - 1];
    if (tld.length < 2) return false;
    
    // Domain name (before TLD) should be at least 2 characters
    const domainName = parts[parts.length - 2];
    if (domainName.length < 2) return false;
    
    return true;
  }

  // Check if domain is likely a real email provider
  static isLikelyValidEmailDomain(domain) {
    // If it's a known valid provider, it's good
    if (CONFIG.VALID_EMAIL_PROVIDERS.has(domain)) return { valid: true, isKnown: true };
    
    // If it's a known invalid domain, reject
    if (CONFIG.INVALID_DOMAINS.has(domain)) return { valid: false, reason: 'blacklisted' };
    
    // If it's disposable, reject
    if (CONFIG.DISPOSABLE_DOMAINS.has(domain)) return { valid: false, reason: 'disposable' };
    
    // Check domain structure
    if (!this.isValidDomainStructure(domain)) return { valid: false, reason: 'invalid_structure' };
    
    // For unknown domains, check if TLD is common
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    const tldCombo = parts.length > 2 ? parts.slice(-2).join('.') : null;
    
    // Accept if TLD or TLD combo is in common list
    if (CONFIG.COMMON_VALID_TLDS.has(tld) || 
        (tldCombo && CONFIG.COMMON_VALID_TLDS.has(tldCombo))) {
      // Additional check: domain name shouldn't be too short (like a.com, b.net)
      const domainName = parts[parts.length - 2];
      if (domainName.length < 3) return { valid: false, reason: 'too_short' };
      
      return { valid: true, isKnown: false }; // Unknown but plausible domain
    }
    
    return { valid: false, reason: 'unknown_tld' }; // Unknown TLD
  }

  static validate(email) {
    const result = {
      isValid: false,
      localPart: null,
      domain: null,
      errors: [],
      warnings: [],
      isRoleBased: false,
      hasSuspiciousPattern: false,
      isKnownProvider: false,
      isInvalidDomain: false,
      isFreeEmail: false,
      isDisposable: false
    };

    // Trim and lowercase
    email = (email || '').trim().toLowerCase();

    // Basic checks
    if (!email) {
      result.errors.push('Email address is required');
      return result;
    }

    if (email.length > 254) {
      result.errors.push('Email address exceeds maximum length (254 characters)');
      return result;
    }

    // Check for @ symbol
    const atIndex = email.indexOf('@');
    if (atIndex === -1) {
      result.errors.push('Email must contain @ symbol');
      return result;
    }

    // Split into local and domain parts
    result.localPart = email.substring(0, atIndex);
    result.domain = email.substring(atIndex + 1);

    // Validate local part length
    if (result.localPart.length > 64) {
      result.errors.push('Local part exceeds maximum length (64 characters)');
      return result;
    }

    // Validate domain basic structure
    if (!result.domain || result.domain.length < 3 || !result.domain.includes('.')) {
      result.errors.push('Invalid domain');
      return result;
    }

    // RFC 5322 regex validation
    if (!this.EMAIL_REGEX.test(email)) {
      result.errors.push('Email format does not comply with RFC 5322');
      return result;
    }

    // Check domain validity
    const domainCheck = this.isLikelyValidEmailDomain(result.domain);
    if (!domainCheck.valid) {
      result.isInvalidDomain = true;
      if (domainCheck.reason === 'blacklisted') {
        result.errors.push('This domain does not accept emails');
      } else if (domainCheck.reason === 'disposable') {
        result.isDisposable = true;
        result.errors.push('Disposable email addresses are not allowed');
      } else if (domainCheck.reason === 'too_short') {
        result.errors.push('Invalid domain name (too short)');
      } else if (domainCheck.reason === 'invalid_structure') {
        result.errors.push('Invalid domain structure');
      } else {
        result.errors.push('Unrecognized or invalid email domain');
      }
      return result;
    }

    result.isKnownProvider = domainCheck.isKnown;
    result.isFreeEmail = CONFIG.FREE_EMAIL_PROVIDERS.has(result.domain);

    // Check for role-based email
    result.isRoleBased = this.ROLE_PREFIXES.some(prefix => 
      result.localPart === prefix || result.localPart.startsWith(prefix + '.')
    );
    if (result.isRoleBased) {
      result.warnings.push('Role-based email addresses are less reliable');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^[0-9]+$/,   // Only numbers
      /^test/i,     // Starts with test
      /^temp/i,     // Starts with temp
      /^fake/i,     // Starts with fake
      /^xxx/i,      // Starts with xxx
      /^aaa/i,      // Starts with aaa
      /^abc/i,      // Starts with abc
      /^asdf/i,     // Starts with asdf
      /^qwerty/i,   // Starts with qwerty
      /(.)\1{4,}/   // Repeated characters (5+)
    ];

    result.hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
      pattern.test(result.localPart)
    );
    if (result.hasSuspiciousPattern) {
      result.warnings.push('Email contains suspicious patterns');
    }

    // Add warning for unknown providers
    if (!result.isKnownProvider) {
      result.warnings.push('Unknown email domain - requires MX verification');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
}

// ============================================================
// DNS / MX RECORD VALIDATION
// ============================================================
class DnsValidator {
  static async validateMxRecords(domain) {
    const result = {
      hasMx: false,
      mxRecords: [],
      error: null
    };

    try {
      const records = await dns.resolveMx(domain);
      if (records && records.length > 0) {
        result.hasMx = true;
        result.mxRecords = records.sort((a, b) => a.priority - b.priority);
      }
    } catch (err) {
      result.error = err.code === 'ENODATA' ? 'No MX records found' : err.message;
    }

    return result;
  }

  static async validateSpf(domain) {
    const result = {
      hasSpf: false,
      spfRecord: null,
      error: null
    };

    try {
      const records = await dns.resolveTxt(domain);
      for (const record of records) {
        const txt = record.join('');
        if (txt.startsWith('v=spf1')) {
          result.hasSpf = true;
          result.spfRecord = txt;
          break;
        }
      }
    } catch (err) {
      if (err.code !== 'ENODATA') {
        result.error = err.message;
      }
    }

    return result;
  }

  static async validateDkim(domain) {
    // DKIM records are typically at selector._domainkey.domain
    // Common selectors: default, google, selector1, selector2, k1
    const selectors = ['default', 'google', 'selector1', 'selector2', 'k1', 'mail', 'dkim'];
    const result = {
      hasDkim: false,
      selector: null,
      error: null
    };

    for (const selector of selectors) {
      try {
        const dkimDomain = `${selector}._domainkey.${domain}`;
        const records = await dns.resolveTxt(dkimDomain);
        if (records && records.length > 0) {
          const txt = records[0].join('');
          if (txt.includes('v=DKIM1') || txt.includes('p=')) {
            result.hasDkim = true;
            result.selector = selector;
            break;
          }
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    return result;
  }

  static async validateDmarc(domain) {
    const result = {
      hasDmarc: false,
      dmarcRecord: null,
      policy: null,
      error: null
    };

    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const records = await dns.resolveTxt(dmarcDomain);
      for (const record of records) {
        const txt = record.join('');
        if (txt.startsWith('v=DMARC1')) {
          result.hasDmarc = true;
          result.dmarcRecord = txt;
          
          // Extract policy
          const policyMatch = txt.match(/p=([^;]+)/);
          if (policyMatch) {
            result.policy = policyMatch[1].trim();
          }
          break;
        }
      }
    } catch (err) {
      if (err.code !== 'ENODATA') {
        result.error = err.message;
      }
    }

    return result;
  }
}

// ============================================================
// SMTP VALIDATION (WITHOUT SENDING)
// ============================================================
class SmtpValidator {
  static async validateSmtp(email, mxHost) {
    const result = {
      isValid: false,
      canConnect: false,
      acceptsRecipient: false,
      error: null,
      smtpResponse: null
    };

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let step = 0;
      let response = '';

      const timeout = setTimeout(() => {
        socket.destroy();
        result.error = 'SMTP connection timeout';
        resolve(result);
      }, CONFIG.SMTP_TIMEOUT);

      socket.on('connect', () => {
        result.canConnect = true;
      });

      socket.on('data', (data) => {
        response = data.toString();
        result.smtpResponse = response;

        if (step === 0 && response.startsWith('220')) {
          // Server ready, send EHLO
          socket.write('EHLO verification.local\r\n');
          step = 1;
        } else if (step === 1 && response.startsWith('250')) {
          // EHLO accepted, send MAIL FROM
          socket.write('MAIL FROM:<verify@verification.local>\r\n');
          step = 2;
        } else if (step === 2 && response.startsWith('250')) {
          // MAIL FROM accepted, send RCPT TO
          socket.write(`RCPT TO:<${email}>\r\n`);
          step = 3;
        } else if (step === 3) {
          // Check RCPT TO response
          if (response.startsWith('250') || response.startsWith('251')) {
            result.isValid = true;
            result.acceptsRecipient = true;
          } else if (response.startsWith('550') || response.startsWith('551') || 
                     response.startsWith('552') || response.startsWith('553')) {
            result.error = 'Recipient rejected by server';
          }
          
          // Send QUIT
          socket.write('QUIT\r\n');
          step = 4;
        } else if (step === 4) {
          clearTimeout(timeout);
          socket.destroy();
          resolve(result);
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        result.error = err.message;
        resolve(result);
      });

      socket.on('close', () => {
        clearTimeout(timeout);
        resolve(result);
      });

      // Connect to MX server on port 25
      try {
        socket.connect(25, mxHost);
      } catch (err) {
        clearTimeout(timeout);
        result.error = err.message;
        resolve(result);
      }
    });
  }
}

// ============================================================
// DOMAIN TRUST ASSESSMENT
// ============================================================
class DomainTrustAssessor {
  static async assess(domain) {
    const result = {
      isDisposable: false,
      isFreeEmail: false,
      isTrusted: false,
      domainAge: null,
      trustScore: 100, // Start with 100, deduct for issues
      issues: []
    };

    // Check if disposable
    if (CONFIG.DISPOSABLE_DOMAINS.has(domain)) {
      result.isDisposable = true;
      result.trustScore -= 80;
      result.issues.push('Disposable email domain detected');
    }

    // Check if free email
    if (CONFIG.FREE_EMAIL_PROVIDERS.has(domain)) {
      result.isFreeEmail = true;
      result.trustScore -= 10;
      result.issues.push('Free email provider');
    }

    // Check if trusted enterprise
    if (CONFIG.TRUSTED_DOMAINS.has(domain)) {
      result.isTrusted = true;
      result.trustScore += 20;
    }

    // Try to get domain age via WHOIS (simplified - would need external API in production)
    try {
      result.domainAge = await this.estimateDomainAge(domain);
      if (result.domainAge !== null && result.domainAge < 30) {
        result.trustScore -= 25;
        result.issues.push('Newly registered domain (< 30 days)');
      }
    } catch (err) {
      // Domain age check failed, skip
    }

    return result;
  }

  static async estimateDomainAge(domain) {
    // In production, use a WHOIS API like:
    // - WhoisXML API
    // - DomainTools
    // - RDAP protocol
    // For now, return null (unknown)
    return null;
  }
}

// ============================================================
// REPUTATION AND BREACH ANALYSIS
// ============================================================
class ReputationAnalyzer {
  static async analyze(email, domain) {
    const result = {
      breachDetected: false,
      breachCount: 0,
      spamScore: 0,
      abuseScore: 0,
      riskFactors: [],
      reputationScore: 100
    };

    // In production, integrate with:
    // - Have I Been Pwned API (breach detection)
    // - Spamhaus
    // - AbuseIPDB
    // - EmailRep.io
    // - Kickbox
    // - ZeroBounce

    // Simulated breach check (in production, use actual API)
    result.breachDetected = await this.checkBreachDatabase(email);
    if (result.breachDetected) {
      result.reputationScore -= 40;
      result.riskFactors.push('Email found in data breach');
    }

    // Simulated spam score check
    result.spamScore = await this.getSpamScore(domain);
    if (result.spamScore > 50) {
      result.reputationScore -= 30;
      result.riskFactors.push('Domain has high spam association');
    }

    return result;
  }

  static async checkBreachDatabase(email) {
    // In production, use Have I Been Pwned API:
    // GET https://haveibeenpwned.com/api/v3/breachedaccount/{email}
    // Requires API key and k-anonymity implementation
    
    // For demo, return false (no breach)
    return false;
  }

  static async getSpamScore(domain) {
    // In production, use spam database APIs
    // Return 0-100 score
    return 0;
  }
}

// ============================================================
// RISK SCORING ENGINE
// ============================================================
class RiskScorer {
  static calculate(validationResults) {
    let riskScore = 0;
    const factors = [];

    // Syntax issues
    if (!validationResults.syntax.isValid) {
      riskScore += CONFIG.SCORE_WEIGHTS.INVALID_SYNTAX;
      factors.push({ factor: 'Invalid syntax', weight: CONFIG.SCORE_WEIGHTS.INVALID_SYNTAX });
    }

    // Invalid domain (blacklisted, disposable from syntax check)
    if (validationResults.syntax.isInvalidDomain) {
      riskScore += CONFIG.SCORE_WEIGHTS.INVALID_DOMAIN;
      factors.push({ factor: 'Invalid domain', weight: CONFIG.SCORE_WEIGHTS.INVALID_DOMAIN });
    }

    // Disposable domain (from syntax check)
    if (validationResults.syntax.isDisposable) {
      riskScore += CONFIG.SCORE_WEIGHTS.DISPOSABLE_DOMAIN;
      factors.push({ factor: 'Disposable domain', weight: CONFIG.SCORE_WEIGHTS.DISPOSABLE_DOMAIN });
    }

    // Unknown domain (not in whitelist)
    if (!validationResults.syntax.isKnownProvider && !validationResults.syntax.isFreeEmail && validationResults.syntax.isValid) {
      riskScore += CONFIG.SCORE_WEIGHTS.UNKNOWN_DOMAIN;
      factors.push({ factor: 'Unknown email domain', weight: CONFIG.SCORE_WEIGHTS.UNKNOWN_DOMAIN });
    }

    // Role-based email
    if (validationResults.syntax.isRoleBased) {
      riskScore += CONFIG.SCORE_WEIGHTS.ROLE_BASED;
      factors.push({ factor: 'Role-based email', weight: CONFIG.SCORE_WEIGHTS.ROLE_BASED });
    }

    // Suspicious pattern
    if (validationResults.syntax.hasSuspiciousPattern) {
      riskScore += CONFIG.SCORE_WEIGHTS.SUSPICIOUS_PATTERN;
      factors.push({ factor: 'Suspicious pattern', weight: CONFIG.SCORE_WEIGHTS.SUSPICIOUS_PATTERN });
    }

    // MX record issues
    if (validationResults.mx && !validationResults.mx.hasMx) {
      riskScore += CONFIG.SCORE_WEIGHTS.NO_MX_RECORD;
      factors.push({ factor: 'No MX records', weight: CONFIG.SCORE_WEIGHTS.NO_MX_RECORD });
    }

    // SMTP validation issues
    if (validationResults.smtp && !validationResults.smtp.skipped && !validationResults.smtp.isValid) {
      riskScore += CONFIG.SCORE_WEIGHTS.SMTP_FAIL;
      factors.push({ factor: 'SMTP validation failed', weight: CONFIG.SCORE_WEIGHTS.SMTP_FAIL });
    }

    // Domain trust issues (from DomainTrustAssessor)
    if (validationResults.domainTrust) {
      if (validationResults.domainTrust.isDisposable) {
        // Only add if not already counted from syntax
        if (!validationResults.syntax.isDisposable) {
          riskScore += CONFIG.SCORE_WEIGHTS.DISPOSABLE_DOMAIN;
          factors.push({ factor: 'Disposable domain', weight: CONFIG.SCORE_WEIGHTS.DISPOSABLE_DOMAIN });
        }
      }

      if (validationResults.domainTrust.isFreeEmail) {
        riskScore += CONFIG.SCORE_WEIGHTS.FREE_EMAIL;
        factors.push({ factor: 'Free email provider', weight: CONFIG.SCORE_WEIGHTS.FREE_EMAIL });
      }
    }

    // DNS security issues
    if (validationResults.spf && !validationResults.spf.hasSpf) {
      riskScore += CONFIG.SCORE_WEIGHTS.NO_SPF;
      factors.push({ factor: 'No SPF record', weight: CONFIG.SCORE_WEIGHTS.NO_SPF });
    }

    if (validationResults.dkim && !validationResults.dkim.hasDkim) {
      riskScore += CONFIG.SCORE_WEIGHTS.NO_DKIM;
      factors.push({ factor: 'No DKIM record', weight: CONFIG.SCORE_WEIGHTS.NO_DKIM });
    }

    if (validationResults.dmarc && !validationResults.dmarc.hasDmarc) {
      riskScore += CONFIG.SCORE_WEIGHTS.NO_DMARC;
      factors.push({ factor: 'No DMARC record', weight: CONFIG.SCORE_WEIGHTS.NO_DMARC });
    }

    // Reputation issues
    if (validationResults.reputation && validationResults.reputation.breachDetected) {
      riskScore += CONFIG.SCORE_WEIGHTS.BREACH_DETECTED;
      factors.push({ factor: 'Found in breach database', weight: CONFIG.SCORE_WEIGHTS.BREACH_DETECTED });
    }

    // Determine risk level
    let riskLevel, outcome;
    if (riskScore <= CONFIG.RISK_THRESHOLDS.LOW) {
      riskLevel = 'LOW';
      outcome = 'ACCEPT';
    } else if (riskScore <= CONFIG.RISK_THRESHOLDS.MEDIUM) {
      riskLevel = 'MEDIUM';
      outcome = 'CHALLENGE';
    } else {
      riskLevel = 'HIGH';
      outcome = 'REJECT';
    }

    return {
      score: Math.min(riskScore, 100),
      level: riskLevel,
      outcome,
      factors,
      recommendation: this.getRecommendation(riskLevel, outcome)
    };
  }

  static getRecommendation(level, outcome) {
    const recommendations = {
      ACCEPT: 'Email appears legitimate. Proceed with standard verification.',
      CHALLENGE: 'Email has some risk factors. Consider additional verification (e.g., phone verification, CAPTCHA).',
      REJECT: 'Email has high risk indicators. Block or require manual review.'
    };
    return recommendations[outcome];
  }
}

// ============================================================
// MAIN VERIFICATION ENGINE
// ============================================================
class EmailVerificationEngine {
  /**
   * Perform comprehensive email verification
   * @param {string} email - Email address to verify
   * @param {object} options - Verification options
   * @returns {Promise<object>} - Verification result
   */
  static async verify(email, options = {}) {
    const startTime = Date.now();
    const result = {
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      verificationId: this.generateVerificationId(),
      steps: {},
      riskAssessment: null,
      summary: null,
      processingTime: null
    };

    try {
      // Step 1: Syntax validation
      console.log('[EmailVerify] Step 1: Syntax validation');
      result.steps.syntax = SyntaxValidator.validate(email);
      
      if (!result.steps.syntax.isValid) {
        result.summary = {
          isValid: false,
          riskLevel: 'HIGH',
          outcome: 'REJECT',
          reason: result.steps.syntax.errors.join('; ')
        };
        result.processingTime = Date.now() - startTime;
        return result;
      }

      const domain = result.steps.syntax.domain;

      // Step 2: MX record validation
      console.log('[EmailVerify] Step 2: MX record lookup');
      result.steps.mx = await DnsValidator.validateMxRecords(domain);

      // Step 3: SPF validation
      console.log('[EmailVerify] Step 3: SPF validation');
      result.steps.spf = await DnsValidator.validateSpf(domain);

      // Step 4: DKIM validation
      console.log('[EmailVerify] Step 4: DKIM validation');
      result.steps.dkim = await DnsValidator.validateDkim(domain);

      // Step 5: DMARC validation
      console.log('[EmailVerify] Step 5: DMARC validation');
      result.steps.dmarc = await DnsValidator.validateDmarc(domain);

      // Step 6: Domain trust assessment
      console.log('[EmailVerify] Step 6: Domain trust assessment');
      result.steps.domainTrust = await DomainTrustAssessor.assess(domain);

      // Step 7: SMTP validation (optional, can be slow)
      if (options.performSmtpCheck && result.steps.mx.hasMx) {
        console.log('[EmailVerify] Step 7: SMTP handshake check');
        const primaryMx = result.steps.mx.mxRecords[0].exchange;
        result.steps.smtp = await SmtpValidator.validateSmtp(email, primaryMx);
      } else {
        result.steps.smtp = { skipped: true, reason: 'SMTP check disabled or no MX records' };
      }

      // Step 8: Reputation analysis
      console.log('[EmailVerify] Step 8: Reputation analysis');
      result.steps.reputation = await ReputationAnalyzer.analyze(email, domain);

      // Step 9: Calculate risk score
      console.log('[EmailVerify] Step 9: Risk scoring');
      result.riskAssessment = RiskScorer.calculate(result.steps);

      // Generate summary
      result.summary = {
        isValid: result.riskAssessment.outcome !== 'REJECT',
        riskLevel: result.riskAssessment.level,
        riskScore: result.riskAssessment.score,
        outcome: result.riskAssessment.outcome,
        recommendation: result.riskAssessment.recommendation,
        topRiskFactors: result.riskAssessment.factors.slice(0, 3).map(f => f.factor)
      };

    } catch (err) {
      console.error('[EmailVerify] Error:', err);
      result.error = err.message;
      result.summary = {
        isValid: false,
        riskLevel: 'UNKNOWN',
        outcome: 'ERROR',
        reason: 'Verification process encountered an error'
      };
    }

    result.processingTime = Date.now() - startTime;
    
    // GDPR compliance: Don't store the email, only return results
    console.log(`[EmailVerify] Completed in ${result.processingTime}ms`);
    
    return result;
  }

  static generateVerificationId() {
    return 'ev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

// ============================================================
// EXPRESS.JS ROUTE HANDLER
// ============================================================
/**
 * Express.js route handler for email verification
 * Add this to your server.js or routes file
 */
function createEmailVerificationRoutes(app) {
  
  // POST /api/verify-email
  app.post('/api/verify-email', async (req, res) => {
    try {
      const { email, options } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await EmailVerificationEngine.verify(email, options || {});

      // Return sanitized result (GDPR compliant - no PII storage)
      res.json({
        success: true,
        verification: {
          id: result.verificationId,
          timestamp: result.timestamp,
          summary: result.summary,
          riskAssessment: result.riskAssessment,
          processingTime: result.processingTime
        }
      });

    } catch (err) {
      console.error('Email verification error:', err);
      res.status(500).json({
        success: false,
        error: 'Verification service temporarily unavailable'
      });
    }
  });

  // GET /api/verify-email/quick - Quick syntax-only check
  app.get('/api/verify-email/quick', (req, res) => {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    const syntaxResult = SyntaxValidator.validate(email);

    res.json({
      success: true,
      isValid: syntaxResult.isValid,
      errors: syntaxResult.errors,
      warnings: syntaxResult.warnings
    });
  });
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  EmailVerificationEngine,
  SyntaxValidator,
  DnsValidator,
  SmtpValidator,
  DomainTrustAssessor,
  ReputationAnalyzer,
  RiskScorer,
  createEmailVerificationRoutes,
  CONFIG
};












