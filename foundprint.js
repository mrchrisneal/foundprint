/**
 * FOUNDprint - Fingerprint Output Using Non-IP Detection
 * ========================================================
 * Repository: https://github.com/mrchrisneal/foundprint
 *
 * An educational browser fingerprinting demo that reveals how identifiable
 * your browser is online - without looking at your IP address. All processing
 * happens client-side; nothing is stored or transmitted.
 *
 * ACADEMIC SOURCES
 * - Panopticlick (Eckersley, 2010): https://coveryourtracks.eff.org/static/browser-uniqueness.pdf
 * - AmIUnique (Laperdrix et al., 2016): https://hal.inria.fr/hal-01285470/document
 * - Hiding in the Crowd (Gomez-Boix et al., 2018): https://hal.inria.fr/hal-01718234v2/document
 *
 * Author: Chris Neal (chris@neal.media) | https://neal.media/
 * License: AGPL-3.0
 * MD5 function based on blueimp/JavaScript-MD5 (MIT License)
 */

// IIFE pattern for private scope; 'use strict' catches common mistakes
(function() {
  'use strict';

  // ==========================================================================
  // SECTION 1: CONFIGURATION
  // ==========================================================================

  const CONFIG = {
    version: '1.1.0',
    revealDelay: 400,        // ms between revealing each result
    typewriterSpeed: 15,     // ms per character (0 = instant)
    dramaticPause: 1200,     // ms before final results
    githubUrl: 'https://github.com/mrchrisneal/foundprint',
    authorUrl: 'https://neal.media/'
  };

  // Upper bound for uniqueness calculations (can't be more unique than 1 in everyone)
  const WORLD_POPULATION = 8.3e9;

  // ==========================================================================
  // SECTION 2: MARKET SHARE DATA
  // ==========================================================================
  // Real-world statistics about browser characteristics. Used to calculate
  // how "rare" each trait is. Formula: "1 in X" = 100 / market_share_percent

  const SCREEN_RESOLUTION_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.screenResolutions',
    data: {
      '1920x1080': 23, '1366x768': 19, '1536x864': 8, '1440x900': 5,
      '1280x720': 4, '2560x1440': 4, '1600x900': 3, '1280x800': 3, '3840x2160': 2
    },
    defaultPercent: 1.0
  };

  const BROWSER_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.browsers',
    data: { 'Chrome': 65, 'Safari': 18, 'Edge': 5, 'Firefox': 3, 'Opera': 2 },
    defaultPercent: 1.0
  };

  // GPU data from Steam Hardware Survey (gamer-skewed); entropy baseline from AmIUnique 2016
  const GPU_DATA = {
    source: 'https://store.steampowered.com/hwsurvey/directx/',
    sourceLabel: 'Steam Hardware Survey (fallback)',
    note: 'Panopticlick lacks GPU data; Steam data is gamer-skewed',
    baselineEntropy: 3.41,
    baselineSource: 'https://hal.inria.fr/hal-01285470/document',
    data: {
      'NVIDIA GeForce RTX 3060': 8.32, 'NVIDIA GeForce RTX 4060': 7.92,
      'NVIDIA GeForce RTX 3050': 5.92, 'NVIDIA GeForce GTX 1650': 5.60,
      'NVIDIA GeForce RTX 4060 Ti': 5.26, 'NVIDIA GeForce RTX 3060 Ti': 4.78,
      'NVIDIA GeForce RTX 3070': 4.48, 'AMD Radeon Graphics': 4.24,
      'NVIDIA GeForce RTX 4070': 4.14, 'NVIDIA GeForce RTX 2060': 3.92,
      'NVIDIA GeForce GTX 1060': 3.60, 'Intel Iris Xe': 3.52,
      'Intel UHD Graphics': 2.0, 'AMD Radeon RX': 2.0,
      'Apple M1': 1.5, 'Apple M2': 1.0, 'Apple M3': 0.8
    },
    defaultPercent: 0.5
  };

  const PIXEL_RATIO_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.pixelRatios',
    data: { '1': 45, '2': 30, '1.25': 10, '1.5': 8, '3': 3, '2.5': 2 },
    defaultPercent: 2.0
  };

  // DNT paradox: enabling "Do Not Track" makes you MORE trackable (only ~20% enable it)
  const DNT_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.privacyTools',
    data: { '1': 20, '0': 3, 'null': 77 },
    defaultPercent: 77
  };

  const CPU_CORES_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.cpuCores',
    data: { '1': 1, '2': 15, '4': 35, '6': 15, '8': 20, '12': 5, '16': 5 },
    defaultPercent: 4.0
  };

  const DEVICE_MEMORY_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.deviceMemory',
    data: { '2': 5, '4': 25, '8': 45, '16': 15, '32': 5 },
    defaultPercent: 5.0
  };

  const AD_BLOCKER_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.privacyTools',
    data: { 'true': 42, 'false': 58 }
  };

  const TIMEZONE_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.timezones',
    data: {
      'America/New_York': 12, 'America/Los_Angeles': 10, 'America/Chicago': 8,
      'Asia/Shanghai': 6, 'Europe/London': 5, 'Asia/Tokyo': 4,
      'Europe/Paris': 3, 'Europe/Berlin': 3
    },
    defaultPercent: 1.0
  };

  const LANGUAGE_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.languages',
    data: { 'en-US': 35, 'zh-CN': 10, 'en-GB': 5, 'es': 5, 'de': 3, 'fr': 3, 'ja': 3 },
    defaultPercent: 1.0
  };

  const PLATFORM_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.platforms',
    data: { 'Win32': 70, 'MacIntel': 15, 'iPhone': 5, 'Android': 4, 'Linux x86_64': 3, 'iPad': 2 },
    defaultPercent: 1.0
  };

  // ==========================================================================
  // SECTION 3: BASELINE ENTROPY VALUES
  // ==========================================================================
  // Entropy measures identifying information in bits. Each bit doubles the
  // uniqueness: 10 bits = 1 in 1,024; 20 bits = 1 in ~1 million; 33 bits = unique on Earth.
  // Values below are the LOWEST (most conservative) from academic research.

  const BASELINE_ENTROPY = {
    canvas: {
      bits: 8.04,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 8.28 bits'
    },
    audio: {
      bits: 10,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick entropy.ts (code comment)',
      note: 'Based on Panopticlick implementation; no academic baseline available'
    },
    webglRenderer: {
      bits: 3.41,
      source: 'https://hal.inria.fr/hal-01285470/document',
      sourceLabel: 'AmIUnique 2016 (Table 2)',
      note: 'Conservative estimate; HitC 2018 found 5.28 bits'
    },
    webglVendor: {
      bits: 1.82,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 2.14 bits'
    },
    fonts: {
      bits: 6.97,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; Panopticlick found 13.9 bits'
    },
    userAgent: {
      bits: 6.32,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; Panopticlick found 10.0 bits'
    },
    timezone: {
      bits: 3.04,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'HitC 2018 (0.10 bits) excluded due to French geographic bias'
    },
    language: {
      bits: 2.56,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 5.92 bits'
    },
    touchSupport: {
      bits: 1,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick entropy.ts (calculateTouchPointsEntropy)',
      note: 'Desktop (0 touch) = 1 bit; touch devices = 2-3 bits'
    },
    connectionType: {
      bits: 1.5,
      source: null,
      sourceLabel: 'No public dataset',
      note: 'Estimated; no academic baseline available'
    },
    plugins: {
      bits: 0.21,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 Mobile (Table 3)',
      note: 'Plugins largely deprecated; desktop was 10.28 bits'
    },
    doNotTrack: {
      bits: 0.94,
      source: 'https://hal.inria.fr/hal-01285470/document',
      sourceLabel: 'AmIUnique 2016 (Table 2)',
      note: 'Conservative estimate; HitC 2018 found 1.92 bits'
    },
    cookiesEnabled: {
      bits: 0.00,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Nearly universal; provides no distinguishing information'
    },
    localStorage: {
      bits: 0.04,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Nearly universal; provides minimal distinguishing information'
    },
    screenResolution: {
      bits: 4.83,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'Used when resolution not in Panopticlick POPULATION_STATS lookup table'
    },
    pixelRatio: {
      bits: 2.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For pixel ratios not in the lookup table'
    },
    platform: {
      bits: 0.56,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'Used when platform not in Panopticlick POPULATION_STATS lookup table'
    },
    cpuCores: {
      bits: 3.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For core counts not in the lookup table'
    },
    deviceMemory: {
      bits: 3.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For memory sizes not in the lookup table'
    }
  };

  // ==========================================================================
  // SECTION 4: DATA LOOKUP UTILITIES
  // ==========================================================================

  /**
   * Look up market share percentage for a value. Tries exact match, then
   * partial match, then returns defaultPercent.
   */
  function lookupMarketShare(dataSource, value) {
    const normalizedValue = String(value).trim();

    // Exact match
    if (dataSource.data[normalizedValue] !== undefined) {
      return {
        percent: dataSource.data[normalizedValue],
        source: dataSource.source,
        estimated: dataSource.estimated || false
      };
    }

    // Partial match (e.g., "Chrome 120" matches "Chrome")
    for (const key of Object.keys(dataSource.data)) {
      if (normalizedValue.includes(key) || key.includes(normalizedValue)) {
        return {
          percent: dataSource.data[key],
          source: dataSource.source,
          estimated: dataSource.estimated || false
        };
      }
    }

    // No match - use conservative default
    return {
      percent: dataSource.defaultPercent || 1.0,
      source: dataSource.source,
      estimated: true
    };
  }

  // Convert market share percentage to entropy bits: log2(100 / percent)
  function percentToEntropy(percent) {
    if (percent <= 0) return 10;
    return Math.log2(100 / percent);
  }

  // Convert percentage to "1 in X people" format
  function percentToOneInX(percent) {
    if (percent <= 0) return 1000;
    return 100 / percent;
  }

  // Fonts to test during font fingerprinting
  const TEST_FONTS = [
    'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
    'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
    'Lucida Console', 'Monaco', 'Palatino Linotype', 'Segoe UI',
    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Menlo',
    'SF Pro', 'Roboto', 'Open Sans', 'Helvetica Neue', 'Ubuntu',
    'Droid Sans', 'Noto Sans', 'Liberation Sans', 'DejaVu Sans'
  ];

  // ==========================================================================
  // SECTION 5: GENERAL UTILITY FUNCTIONS
  // ==========================================================================

  /** Format large numbers for readability (e.g., 8300000000 -> "8.3 billion") */
  function formatNumber(num) {
    let text;
    if (num >= 1e12) text = (num / 1e12).toFixed(1) + ' trillion';
    else if (num >= 1e9) text = (num / 1e9).toFixed(1) + ' billion';
    else if (num >= 1e6) text = (num / 1e6).toFixed(1) + ' million';
    else if (num >= 1e3) text = Math.round(num).toLocaleString();
    else text = Math.round(num).toString();

    return {
      text: text,
      isUnique: num >= WORLD_POPULATION,
      raw: num
    };
  }

  /** Convert entropy bits to anonymity set size: 2^bits */
  function entropyToUniqueness(bits) {
    return Math.pow(2, bits);
  }

  /**
   * MD5 hash function - creates a 32-character fingerprint of any input.
   * Based on blueimp/JavaScript-MD5 (MIT License)
   */
  function md5(str) {
    function safeAdd(x, y) {
      const lsw = (x & 0xFFFF) + (y & 0xFFFF);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }
    function bitRotateLeft(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5cmn(q, a, b, x, s, t) {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a, b, c, d, x, s, t) {
      return md5cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5gg(a, b, c, d, x, s, t) {
      return md5cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5hh(a, b, c, d, x, s, t) {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a, b, c, d, x, s, t) {
      return md5cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function binlMD5(x, len) {
      x[len >> 5] |= 0x80 << (len % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;
      let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
      for (let i = 0; i < x.length; i += 16) {
        const olda = a, oldb = b, oldc = c, oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
      }
      return [a, b, c, d];
    }

    function binl2hex(binarray) {
      const hexTab = '0123456789abcdef';
      let str = '';
      for (let i = 0; i < binarray.length * 4; i++) {
        str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
               hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
      }
      return str;
    }

    function str2binl(str) {
      const bin = [];
      for (let i = 0; i < str.length * 8; i += 8) {
        bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
      }
      return bin;
    }

    function utf8Encode(str) {
      return unescape(encodeURIComponent(str));
    }

    const utf8 = utf8Encode(str);
    return binl2hex(binlMD5(str2binl(utf8), utf8.length * 8)).toUpperCase();
  }

  /** Combine all fingerprint values into a single MD5 hash */
  function generateFingerprintHash(values) {
    const str = values.map(v => JSON.stringify(v)).join('|');
    return md5(str);
  }

  /** Extract browser and OS from user agent string */
  function parseUserAgent(ua) {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Browser detection (order matters: check Edge before Chrome)
    if (ua.includes('Firefox/')) {
      const match = ua.match(/Firefox\/(\d+)/);
      browser = 'Firefox ' + (match ? match[1] : '');
    } else if (ua.includes('Edg/')) {
      const match = ua.match(/Edg\/(\d+)/);
      browser = 'Edge ' + (match ? match[1] : '');
    } else if (ua.includes('Chrome/')) {
      const match = ua.match(/Chrome\/(\d+)/);
      browser = 'Chrome ' + (match ? match[1] : '');
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      const match = ua.match(/Version\/(\d+)/);
      browser = 'Safari ' + (match ? match[1] : '');
    }

    // OS detection (check iPhone/iPad before Mac OS X since iOS UA contains "Mac OS X")
    if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
    } else if (ua.includes('Windows NT 10.0')) {
      os = ua.includes('Windows NT 10.0; Win64') ? 'Windows 10/11' : 'Windows 10';
    } else if (ua.includes('Windows NT')) {
      os = 'Windows';
    } else if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      os = 'macOS' + (match ? ' ' + match[1].replace('_', '.') : '');
    } else if (ua.includes('Linux')) {
      os = ua.includes('Android') ? 'Android' : 'Linux';
    }

    return { browser, os };
  }

  /** Get timezone info in readable format */
  function getTimezoneInfo() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMins = Math.abs(offset % 60);
    const sign = offset <= 0 ? '+' : '-';
    const offsetStr = 'UTC' + sign + offsetHours + (offsetMins ? ':' + String(offsetMins).padStart(2, '0') : '');
    const readableTz = tz.replace(/_/g, ' ').split('/').pop();
    return { timezone: readableTz, offset: offsetStr, raw: tz };
  }

  /**
   * Analyze pixel ratio for zoom detection. Browser zoom affects devicePixelRatio,
   * so we try to determine the "true" DPR and zoom level.
   */
  function analyzePixelRatio(ratio) {
    const displayRatio = Math.round(ratio * 1000) / 1000;
    const knownDPRs = [1, 1.25, 1.5, 2, 2.5, 3];
    const commonZoomLevels = [
      { zoom: 1.0, percent: 100 }, { zoom: 1.1, percent: 110 },
      { zoom: 1.2, percent: 120 }, { zoom: 1.25, percent: 125 },
      { zoom: 1.33, percent: 133 }, { zoom: 1.5, percent: 150 },
      { zoom: 1.75, percent: 175 }, { zoom: 2.0, percent: 200 },
      { zoom: 0.9, percent: 90 }, { zoom: 0.8, percent: 80 },
      { zoom: 0.75, percent: 75 }, { zoom: 0.67, percent: 67 },
      { zoom: 0.5, percent: 50 }, { zoom: 0.33, percent: 33 }, { zoom: 0.3, percent: 30 }
    ];
    const tolerance = 0.015;

    // Check for exact DPR match (no zoom)
    for (const baseDPR of knownDPRs) {
      if (Math.abs(displayRatio - baseDPR) < tolerance) {
        return {
          displayRatio, trueDPR: baseDPR, zoomPercent: 100,
          isZoomed: false, confidence: 'high', matchedBucket: String(baseDPR)
        };
      }
    }

    // Try to find baseDPR × zoom combination
    let allMatches = [];
    for (const baseDPR of knownDPRs) {
      for (const { zoom, percent } of commonZoomLevels) {
        if (percent === 100) continue;
        const expectedRatio = baseDPR * zoom;
        const diff = Math.abs(displayRatio - expectedRatio);
        if (diff < tolerance) {
          allMatches.push({
            displayRatio, trueDPR: baseDPR, zoomPercent: percent,
            isZoomed: true, confidence: 'medium', matchedBucket: String(baseDPR), diff
          });
        }
      }
    }

    if (allMatches.length > 0) {
      allMatches.sort((a, b) => a.trueDPR !== b.trueDPR ? a.trueDPR - b.trueDPR : a.diff - b.diff);
      const best = allMatches[0];
      delete best.diff;
      return best;
    }

    // No match - assume 1x screen with unusual zoom
    return {
      displayRatio, trueDPR: 1, zoomPercent: Math.round(displayRatio * 100),
      isZoomed: true, confidence: 'low', matchedBucket: '1'
    };
  }

  /** Pause execution for animations */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // SECTION 6: FINGERPRINTING TESTS
  // ==========================================================================
  // Each test detects a browser characteristic. Tests are grouped by compatibility:
  // - TIER 1 (High): Works in almost all browsers
  // - TIER 2 (Good): Works in most modern browsers
  // - TIER 3 (Advanced): Fingerprinting techniques that may not work everywhere
  // - TIER 4 (Behavioral): User behavior detection

  const tests = {

    // TIER 1: HIGH COMPATIBILITY

    screenResolution: {
      name: 'Screen Resolution',
      difficulty: 'hard',
      changeRequires: 'Different monitor',
      run: function() {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.round(screen.width * dpr);
        const height = Math.round(screen.height * dpr);
        const resolution = `${width}x${height}`;
        const lookup = lookupMarketShare(SCREEN_RESOLUTION_DATA, resolution);

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.screenResolution;
          return {
            value: resolution,
            message: `Your screen resolution is **${width}×${height}**.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: resolution,
          message: `Your screen resolution is **${width}×${height}**.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: SCREEN_RESOLUTION_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    pixelRatio: {
      name: 'Pixel Ratio',
      difficulty: 'hard',
      changeRequires: 'Different display',
      run: function() {
        const rawRatio = window.devicePixelRatio || 1;
        const analysis = analyzePixelRatio(rawRatio);

        let desc = analysis.trueDPR >= 2 ? 'high-density (Retina/HiDPI)' :
                   analysis.trueDPR >= 1.5 ? 'enhanced density' : 'standard density';

        let message;
        if (analysis.isZoomed) {
          if (analysis.confidence === 'high') {
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, browser zoomed to ${analysis.zoomPercent}%).`;
          } else if (analysis.confidence === 'medium') {
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, likely browser zoom ~${analysis.zoomPercent}%).`;
          } else {
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, unusual value - may be affected by zoom).`;
          }
        } else {
          message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}).`;
        }

        if (analysis.matchedBucket) {
          const lookup = lookupMarketShare(PIXEL_RATIO_DATA, analysis.matchedBucket);
          if (!lookup.estimated) {
            return {
              value: analysis.displayRatio,
              message: message,
              lookup: {
                percent: lookup.percent, source: lookup.source,
                sourceLabel: PIXEL_RATIO_DATA.sourceLabel, estimated: false,
                entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
              }
            };
          }
        }

        const baseline = BASELINE_ENTROPY.pixelRatio;
        return {
          value: analysis.displayRatio,
          message: message,
          lookup: {
            percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
            estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },

    timezone: {
      name: 'Timezone',
      difficulty: 'easy',
      changeRequires: 'OS settings',
      run: function() {
        const info = getTimezoneInfo();
        const lookup = lookupMarketShare(TIMEZONE_DATA, info.raw);

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.timezone;
          return {
            value: info.raw,
            message: `You're in the **${info.timezone}** timezone (${info.offset}).`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: info.raw,
          message: `You're in the **${info.timezone}** timezone (${info.offset}).`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: TIMEZONE_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    language: {
      name: 'Language',
      difficulty: 'easy',
      changeRequires: 'Browser settings',
      run: function() {
        const lang = navigator.language;
        const langs = navigator.languages ? navigator.languages.length : 1;
        const extra = langs > 1 ? ` (with ${langs} language preferences)` : '';
        const lookup = lookupMarketShare(LANGUAGE_DATA, lang);

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.language;
          return {
            value: lang,
            message: `Your primary language is **${lang}**${extra}.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: lang,
          message: `Your primary language is **${lang}**${extra}.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: LANGUAGE_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    platform: {
      name: 'Platform',
      difficulty: 'medium',
      changeRequires: 'Browser extension',
      run: function() {
        const platform = navigator.platform;
        const lookup = lookupMarketShare(PLATFORM_DATA, platform);

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.platform;
          return {
            value: platform,
            message: `Your platform reports as **${platform}**.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: platform,
          message: `Your platform reports as **${platform}**.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: PLATFORM_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    userAgent: {
      name: 'Browser/OS',
      difficulty: 'medium',
      changeRequires: 'Browser extension',
      run: function() {
        const ua = navigator.userAgent;
        const parsed = parseUserAgent(ua);
        const browserName = parsed.browser.split(' ')[0];
        const lookup = lookupMarketShare(BROWSER_DATA, browserName);

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.userAgent;
          return {
            value: ua,
            message: `You're running **${parsed.browser}** on **${parsed.os}**.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: ua,
          message: `You're running **${parsed.browser}** on **${parsed.os}**.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: BROWSER_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    doNotTrack: {
      name: 'Do Not Track',
      difficulty: 'easy',
      changeRequires: 'Browser settings',
      run: function() {
        const dnt = navigator.doNotTrack;
        let status, irony;
        if (dnt === '1') {
          status = 'enabled';
          irony = 'Ironically, this makes you more identifiable.';
        } else if (dnt === '0') {
          status = 'explicitly disabled';
          irony = 'Few users bother to disable it explicitly.';
        } else {
          status = 'not set';
          irony = '';
        }

        const lookupKey = dnt === '1' ? '1' : (dnt === '0' ? '0' : 'null');
        const lookup = lookupMarketShare(DNT_DATA, lookupKey);

        return {
          value: dnt,
          message: `Your Do Not Track setting is **${status}**.` + (irony ? ' ' + irony : ''),
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: DNT_DATA.sourceLabel, estimated: lookup.estimated,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    // TIER 2: GOOD COMPATIBILITY

    cpuCores: {
      name: 'CPU Cores',
      difficulty: 'hard',
      changeRequires: 'Different device',
      run: function() {
        const cores = navigator.hardwareConcurrency;
        if (!cores) return null;

        const lookup = lookupMarketShare(CPU_CORES_DATA, String(cores));

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.cpuCores;
          return {
            value: cores,
            message: `Your device has **${cores} CPU cores**.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: cores,
          message: `Your device has **${cores} CPU cores**.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: CPU_CORES_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    deviceMemory: {
      name: 'Device Memory',
      difficulty: 'hard',
      changeRequires: 'Different device',
      run: function() {
        const mem = navigator.deviceMemory;
        if (!mem) return null;

        const lookup = lookupMarketShare(DEVICE_MEMORY_DATA, String(mem));

        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.deviceMemory;
          return {
            value: mem,
            message: `Your device reports **${mem}GB of RAM**.`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        return {
          value: mem,
          message: `Your device reports **${mem}GB of RAM**.`,
          lookup: {
            percent: lookup.percent, source: lookup.source,
            sourceLabel: DEVICE_MEMORY_DATA.sourceLabel, estimated: false,
            entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
          }
        };
      }
    },

    touchSupport: {
      name: 'Touch Support',
      difficulty: 'hard',
      changeRequires: 'Different device',
      run: function() {
        const points = navigator.maxTouchPoints || 0;
        let desc = points === 0 ? 'no touch support (desktop)' :
                   points <= 2 ? 'basic touch support' : `multi-touch support (${points} points)`;

        const baseline = BASELINE_ENTROPY.touchSupport;
        return {
          value: points,
          message: `Your device has **${desc}**.`,
          lookup: {
            percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
            estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },

    connectionType: {
      name: 'Connection Type',
      difficulty: 'medium',
      changeRequires: 'Different network',
      run: function() {
        const conn = navigator.connection;
        if (!conn || !conn.effectiveType) return null;

        const baseline = BASELINE_ENTROPY.connectionType;
        return {
          value: conn.effectiveType,
          message: `Your connection type is **${conn.effectiveType.toUpperCase()}**.`,
          lookup: {
            percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
            estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },

    // TIER 3: FINGERPRINTING TECHNIQUES
    // These exploit rendering/processing differences across browsers and hardware

    /**
     * Canvas fingerprinting: Draw shapes/text on invisible canvas, then hash the
     * pixel data. Tiny GPU/driver/font differences create unique results.
     */
    canvas: {
      name: 'Canvas Fingerprint',
      difficulty: 'hard',
      changeRequires: 'Different browser/GPU, or disable via extension',
      run: function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 280;
          canvas.height = 60;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          // Draw test shapes that reveal rendering differences
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#069';
          ctx.font = '14px "Times New Roman"';
          ctx.fillText('Cwm fjordbank glyphs vext quiz', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.font = '18px Arial';
          ctx.fillText('FOUNDprint test', 4, 45);

          // Overlapping circles with multiply blend mode
          ctx.globalCompositeOperation = 'multiply';
          const colors = [['#f2f', 40, 40], ['#2ff', 80, 40], ['#ff2', 60, 60]];
          for (const [color, x, y] of colors) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fill();
          }

          const dataUrl = canvas.toDataURL();
          const canvasHash = md5(dataUrl);
          const baseline = BASELINE_ENTROPY.canvas;

          return {
            value: dataUrl,
            message: `Your browser renders invisible test shapes in a **unique way** (<code class="foundprint-inline-hash">${canvasHash}</code>).`,
            lookup: {
              percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
              estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        } catch (e) {
          return null;
        }
      }
    },

    webgl: {
      name: 'WebGL',
      difficulty: 'hard',
      changeRequires: 'Different GPU, or disable in browser settings',
      run: function() {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) return null;

          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          const rendererBaseline = BASELINE_ENTROPY.webglRenderer;
          const vendorBaseline = BASELINE_ENTROPY.webglVendor;

          if (!debugInfo) {
            const renderer = gl.getParameter(gl.RENDERER);
            return {
              value: renderer,
              message: `Your graphics renderer is **${renderer}**.`,
              lookup: {
                percent: null, source: rendererBaseline.source,
                sourceLabel: rendererBaseline.sourceLabel, estimated: true,
                entropy: rendererBaseline.bits * 0.5, oneInX: Math.pow(2, rendererBaseline.bits * 0.5),
                note: 'Reduced entropy - WebGL debug info not available'
              }
            };
          }

          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

          let cleanRenderer = renderer;
          if (renderer.includes('ANGLE')) {
            const match = renderer.match(/ANGLE \([^,]+, ([^,]+)/);
            if (match) cleanRenderer = match[1].trim();
          }

          const lookup = lookupMarketShare(GPU_DATA, renderer);

          if (!lookup.estimated) {
            return {
              value: { vendor, renderer },
              message: `Your graphics card is **${cleanRenderer}**.`,
              lookup: {
                percent: lookup.percent, source: lookup.source,
                sourceLabel: GPU_DATA.sourceLabel, estimated: false,
                entropy: percentToEntropy(lookup.percent),
                oneInX: percentToOneInX(lookup.percent), note: GPU_DATA.note
              }
            };
          }

          const combinedEntropy = rendererBaseline.bits + vendorBaseline.bits;
          return {
            value: { vendor, renderer },
            message: `Your graphics card is **${cleanRenderer}**.`,
            lookup: {
              percent: null, source: rendererBaseline.source,
              sourceLabel: rendererBaseline.sourceLabel, estimated: true,
              entropy: combinedEntropy, oneInX: Math.pow(2, combinedEntropy),
              note: rendererBaseline.note
            }
          };
        } catch (e) {
          return null;
        }
      }
    },

    /**
     * Audio fingerprinting: Generate a test signal through audio processing,
     * then measure the output. Different audio stacks produce unique signatures.
     */
    audio: {
      name: 'Audio Fingerprint',
      difficulty: 'hard',
      changeRequires: 'Different browser/audio hardware, or disable via extension',
      run: async function() {
        try {
          const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          if (!AudioContext) return null;

          const context = new AudioContext(1, 5000, 44100);
          const oscillator = context.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.value = 10000;

          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -50;
          compressor.knee.value = 40;
          compressor.ratio.value = 12;
          compressor.attack.value = 0;
          compressor.release.value = 0.25;

          oscillator.connect(compressor);
          compressor.connect(context.destination);
          oscillator.start(0);

          const baseline = BASELINE_ENTROPY.audio;

          return new Promise((resolve) => {
            context.oncomplete = (event) => {
              const buffer = event.renderedBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 4500; i < 5000; i++) {
                sum += Math.abs(buffer[i]);
              }
              oscillator.disconnect();
              const signature = Math.round(sum * 10000) / 10000;
              const audioHash = md5(String(signature));

              resolve({
                value: signature,
                message: `Your audio hardware processes sound with a **distinct signature** (<code class="foundprint-inline-hash">${audioHash}</code>).`,
                lookup: {
                  percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
                  estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
                  note: baseline.note
                }
              });
            };
            context.startRendering();
          });
        } catch (e) {
          return null;
        }
      }
    },

    fonts: {
      name: 'Installed Fonts',
      difficulty: 'medium',
      changeRequires: 'Install/remove fonts',
      run: function() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';

        const holder = document.createElement('div');
        holder.style.cssText = 'position:absolute;left:-9999px;visibility:hidden';
        document.body.appendChild(holder);

        // Measure baseline dimensions
        const baseSizes = {};
        for (const baseFont of baseFonts) {
          const span = document.createElement('span');
          span.style.fontSize = testSize;
          span.style.fontFamily = baseFont;
          span.textContent = testString;
          holder.appendChild(span);
          baseSizes[baseFont] = { w: span.offsetWidth, h: span.offsetHeight };
        }

        // Test each font
        const detected = [];
        for (const font of TEST_FONTS) {
          let found = false;
          for (const baseFont of baseFonts) {
            const span = document.createElement('span');
            span.style.fontSize = testSize;
            span.style.fontFamily = `'${font}', ${baseFont}`;
            span.textContent = testString;
            holder.appendChild(span);

            if (span.offsetWidth !== baseSizes[baseFont].w ||
                span.offsetHeight !== baseSizes[baseFont].h) {
              found = true;
              break;
            }
          }
          if (found) detected.push(font);
        }

        document.body.removeChild(holder);
        if (detected.length === 0) return null;

        const interesting = detected.filter(f =>
          ['Fira Code', 'JetBrains Mono', 'Monaco', 'Consolas', 'Comic Sans MS',
           'SF Pro', 'Roboto', 'Ubuntu', 'Helvetica Neue'].includes(f)
        );

        let highlight = '';
        if (interesting.length >= 2) {
          highlight = `, including **${interesting[0]}** and **${interesting[1]}**`;
        } else if (interesting.length === 1) {
          highlight = `, including **${interesting[0]}**`;
        }

        const baseline = BASELINE_ENTROPY.fonts;
        return {
          value: detected,
          message: `You have **${detected.length} distinctive fonts** installed${highlight}.`,
          lookup: {
            percent: null, source: baseline.source, sourceLabel: baseline.sourceLabel,
            estimated: true, entropy: baseline.bits, oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },

    // TIER 4: BEHAVIORAL

    adBlocker: {
      name: 'Ad Blocker',
      difficulty: 'easy',
      changeRequires: 'Install/remove extension',
      run: async function() {
        const bait = document.createElement('div');
        bait.innerHTML = '&nbsp;';
        bait.className = 'adsbox pub_300x250 pub_728x90 text-ad textAd ad-unit';
        bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-10000px;top:-10000px';
        document.body.appendChild(bait);

        return new Promise((resolve) => {
          setTimeout(() => {
            const blocked = bait.offsetHeight === 0 ||
                           bait.offsetParent === null ||
                           getComputedStyle(bait).display === 'none' ||
                           getComputedStyle(bait).visibility === 'hidden';
            bait.remove();

            const lookupKey = blocked ? 'true' : 'false';
            const lookup = lookupMarketShare(AD_BLOCKER_DATA, lookupKey);

            resolve({
              value: blocked,
              message: blocked
                ? `You have an **ad blocker installed**. About 42% of users do.`
                : `You **don't have an ad blocker**. About 58% of users don't either.`,
              lookup: {
                percent: lookup.percent, source: AD_BLOCKER_DATA.source,
                sourceLabel: AD_BLOCKER_DATA.sourceLabel, estimated: false,
                entropy: percentToEntropy(lookup.percent), oneInX: percentToOneInX(lookup.percent)
              }
            });
          }, 100);
        });
      }
    }
  };

  // ==========================================================================
  // SECTION 7: UI RENDERING
  // ==========================================================================

  /** Build the initial HTML structure */
  function createUI(container) {
    container.innerHTML = `
      <div class="foundprint-header">
        <h1 class="foundprint-title">FOUNDprint</h1>
      </div>
      <div class="foundprint-disclaimer" id="foundprint-disclaimer">
        <p class="foundprint-tagline">This experiment analyzes your browser's characteristics to calculate how identifiable you are online—without ever looking at your IP address. All testing is performed locally on your device, and no data is sent or recorded. This experiment assumes one browser = one person. For the curious, you can review the <a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">source code</a> at any time.</p>
        <button class="foundprint-start" id="foundprint-start">Start</button>
      </div>
      <div class="foundprint-results" id="foundprint-results" style="display: none;"></div>
      <div class="foundprint-final" id="foundprint-final" style="display: none;"></div>
      <div class="foundprint-end" id="foundprint-end" style="display: none;"></div>
      <div class="foundprint-footer">
        <p>FOUNDprint v${CONFIG.version} by <a href="${CONFIG.authorUrl}" target="_blank" rel="noopener">Chris Neal</a></p>
        <p><a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">View on GitHub</a> · <a href="${CONFIG.githubUrl}/blob/main/METHODOLOGY.md" target="_blank" rel="noopener">How It Works</a></p>
        <p class="foundprint-footer-privacy">NOTE: All project code is <a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">publicly auditable</a>.<br>No data is stored or recorded by this script.</p>
      </div>
    `;
  }

  /** Typewriter effect - reveal text character by character */
  async function typewriterReveal(element, html, speed) {
    if (speed === 0) {
      element.innerHTML = html;
      return;
    }

    const parts = html.split(/(\*\*[^*]+\*\*)/g);
    let fullText = '';

    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        const text = part.slice(2, -2);
        for (const char of text) {
          fullText += char;
          element.innerHTML = formatBold(fullText);
          await sleep(speed);
        }
      } else {
        for (const char of part) {
          fullText += char;
          element.innerHTML = formatBold(fullText);
          await sleep(speed);
        }
      }
    }
  }

  /** Convert **markdown** bold to <strong>HTML</strong> */
  function formatBold(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /** Display a test result with animation */
  async function addResultLine(container, message, testEntropy, oneInX, sourceUrl, isEstimated, totalEntropy, isFirstTest = false, wasAlreadyUnique = false) {
    const line = document.createElement('div');
    line.className = 'foundprint-line';

    const content = document.createElement('div');
    content.className = 'foundprint-content';
    line.appendChild(content);

    const testUnique = document.createElement('div');
    testUnique.className = 'foundprint-test-unique';
    line.appendChild(testUnique);

    const count = document.createElement('div');
    count.className = 'foundprint-count';
    line.appendChild(count);

    container.appendChild(line);

    // Trigger CSS transition on next frame
    requestAnimationFrame(() => {
      line.classList.add('visible');
    });

    await typewriterReveal(content, message, CONFIG.typewriterSpeed);

    const testFormatted = formatNumber(oneInX);
    const bitsText = `${testEntropy.toFixed(1)} bits`;

    let uniquenessHtml;
    if (sourceUrl && !isEstimated) {
      uniquenessHtml = `You share this with <a href="${sourceUrl}" target="_blank" rel="noopener">1 in ${testFormatted.text}</a> people (${bitsText}).`;
    } else if (sourceUrl && isEstimated) {
      uniquenessHtml = `You share this with 1 in ${testFormatted.text} people (${bitsText}, <a href="${sourceUrl}" target="_blank" rel="noopener">estimated</a>).`;
    } else {
      uniquenessHtml = `You share this with 1 in ${testFormatted.text} people (${bitsText}, estimated).`;
    }
    testUnique.innerHTML = uniquenessHtml;

    const totalUniqueness = entropyToUniqueness(totalEntropy);
    const totalFormatted = formatNumber(totalUniqueness);

    if (totalFormatted.isUnique && !wasAlreadyUnique) {
      count.innerHTML = `<strong>You are now statistically unique among all 8 billion humans on Earth</strong> (1 in ${totalFormatted.text}).`;
      count.classList.add('foundprint-unique');
    } else if (totalFormatted.isUnique) {
      count.innerHTML = `You are now 1 in ${totalFormatted.text}.`;
      count.classList.add('foundprint-unique');
      count.style.fontWeight = 'normal';
    } else if (isFirstTest) {
      count.textContent = `You are currently 1 in ${totalFormatted.text} people.`;
    } else {
      count.textContent = `You are now 1 in ${totalFormatted.text} people.`;
    }

    await sleep(CONFIG.revealDelay);
    return totalFormatted.isUnique;
  }

  /** Show the final reveal */
  async function showFinalReveal(container, successfulTests, totalEntropy, fingerprintHash) {
    await sleep(CONFIG.dramaticPause);

    const uniqueness = entropyToUniqueness(totalEntropy);
    const formatted = formatNumber(uniqueness);

    let uniquenessHtml = formatted.isUnique
      ? `<p class="foundprint-uniqueness"><strong>You are unique.</strong></p>`
      : `<p class="foundprint-uniqueness">You are <strong>1 in ${formatted.text}</strong>.</p>`;

    container.innerHTML = `
      <div class="foundprint-final-content">
        <p class="foundprint-summary">${successfulTests} tests, <strong>${totalEntropy.toFixed(1)} bits</strong> of entropy:</p>
        ${uniquenessHtml}
        <p class="foundprint-hash">Fingerprint: <code>${fingerprintHash}</code></p>
        <p class="foundprint-punchline"><strong>Your IP address is the least interesting thing about you.</strong></p>
      </div>
    `;
    container.style.display = 'block';

    requestAnimationFrame(() => {
      container.classList.add('visible');
    });
  }

  /** Show the end state with spoofability report */
  function showEndState(container, successfulTests, failedTests, completedTests) {
    let failedHtml = '';
    if (failedTests.length > 0) {
      failedHtml = `<p class="foundprint-failed">Unable to detect: ${failedTests.join(', ')}.</p>`;
    }

    const easyTests = completedTests.filter(t => t.difficulty === 'easy');
    const mediumTests = completedTests.filter(t => t.difficulty === 'medium');
    const hardTests = completedTests.filter(t => t.difficulty === 'hard');

    const sumEntropy = (tests) => tests.reduce((sum, t) => sum + (t.entropy || 0), 0);
    const totalEntropy = sumEntropy(completedTests);
    const easyEntropy = sumEntropy(easyTests);
    const mediumEntropy = sumEntropy(mediumTests);
    const hardEntropy = sumEntropy(hardTests);

    const hardOnlyUniqueness = Math.pow(2, hardEntropy);
    const hardOnlyFormatted = formatNumber(Math.min(hardOnlyUniqueness, WORLD_POPULATION));

    const buildTableRows = (testsArray) => {
      return testsArray.map(t => {
        const difficultyLabel = t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1);
        return `<tr>
          <td>${t.name}</td>
          <td><span class="foundprint-difficulty foundprint-difficulty-${t.difficulty}">${difficultyLabel}</span></td>
          <td>${t.changeRequires}</td>
        </tr>`;
      }).join('');
    };

    let reportHtml = `
      <div class="foundprint-report">
        <h3 class="foundprint-report-header">Report</h3>
        <p class="foundprint-report-intro">How difficult is it to change or spoof each attribute?</p>
        <table class="foundprint-report-table">
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Difficulty</th>
              <th>Example of Change(s) Needed</th>
            </tr>
          </thead>
          <tbody>
            ${buildTableRows(easyTests)}
            ${buildTableRows(mediumTests)}
            ${buildTableRows(hardTests)}
          </tbody>
        </table>
        <div class="foundprint-report-summary">
          <span class="foundprint-summary-item"><span class="foundprint-difficulty foundprint-difficulty-easy">Easy</span> ${easyTests.length} <span class="foundprint-entropy-bits">(${easyEntropy.toFixed(1)} bits)</span></span>
          <span class="foundprint-summary-item"><span class="foundprint-difficulty foundprint-difficulty-medium">Medium</span> ${mediumTests.length} <span class="foundprint-entropy-bits">(${mediumEntropy.toFixed(1)} bits)</span></span>
          <span class="foundprint-summary-item"><span class="foundprint-difficulty foundprint-difficulty-hard">Hard</span> ${hardTests.length} <span class="foundprint-entropy-bits">(${hardEntropy.toFixed(1)} bits)</span></span>
        </div>
        <div class="foundprint-entropy-potential">
          <h4 class="foundprint-potential-header">The Hard Truth</h4>
          <p class="foundprint-potential-row">Even if you changed all <span class="foundprint-difficulty foundprint-difficulty-easy">Easy</span> and <span class="foundprint-difficulty foundprint-difficulty-medium">Medium</span> attributes (−${(easyEntropy + mediumEntropy).toFixed(1)} bits), the <span class="foundprint-difficulty foundprint-difficulty-hard">Hard</span> attributes alone (${hardEntropy.toFixed(1)} bits) still make you <strong>1 in ${hardOnlyFormatted.text}</strong>. <strong>${hardTests.length} of ${completedTests.length}</strong> attributes are difficult or impractical to change for most users. Disabling JavaScript prevents most fingerprinting, but breaks many websites. Modern fingerprinting scripts also incorporate significantly more tests than the ${completedTests.length} shown here. <a href="https://chris.neal.media/2025/the-vpn-trap/" target="_blank" rel="noopener">Learn more &raquo;</a></p>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="foundprint-end-content">
        <button class="foundprint-restart" id="foundprint-restart">Run Again</button>
        <p class="foundprint-source"><a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">View source</a></p>
        ${failedHtml}
        ${reportHtml}
      </div>
    `;
    container.style.display = 'block';

    document.getElementById('foundprint-restart').addEventListener('click', () => {
      window.location.href = window.location.pathname + window.location.search + '#foundprint-demo';
      window.location.reload();
    });
  }

  // ==========================================================================
  // SECTION 8: MAIN EXECUTION
  // ==========================================================================

  /** Run all fingerprinting tests and display results */
  async function runExperiment() {
    const disclaimer = document.getElementById('foundprint-disclaimer');
    const resultsContainer = document.getElementById('foundprint-results');
    const finalContainer = document.getElementById('foundprint-final');
    const endContainer = document.getElementById('foundprint-end');

    // Fade out disclaimer
    disclaimer.classList.add('fade-out');
    await sleep(300);
    disclaimer.style.display = 'none';
    resultsContainer.style.display = 'block';

    let totalEntropy = 0;
    let successfulTests = 0;
    const failedTests = [];
    const fingerprintValues = [];
    let alreadyUnique = false;
    const completedTests = [];

    const testOrder = [
      'screenResolution', 'pixelRatio', 'timezone', 'language', 'userAgent',
      'platform', 'doNotTrack', 'cpuCores', 'deviceMemory', 'touchSupport',
      'adBlocker', 'connectionType', 'webgl', 'fonts', 'canvas', 'audio'
    ];

    for (const testName of testOrder) {
      const test = tests[testName];
      if (!test) continue;

      try {
        const result = await test.run();

        if (result === null || result === undefined) {
          failedTests.push(test.name);
          continue;
        }

        let entropyBits, sourceUrl, isEstimated = false;

        if (result.lookup && result.lookup.entropy !== undefined) {
          entropyBits = result.lookup.entropy;
          sourceUrl = result.lookup.source;
          isEstimated = result.lookup.estimated || false;
        } else if (result.entropy !== undefined) {
          entropyBits = result.entropy;
          sourceUrl = null;
        } else if (testName === 'webgl') {
          entropyBits = BASELINE_ENTROPY.webglRenderer.bits + BASELINE_ENTROPY.webglVendor.bits;
          sourceUrl = BASELINE_ENTROPY.webglRenderer.source;
          isEstimated = true;
        } else if (BASELINE_ENTROPY[testName]) {
          const entropyConfig = BASELINE_ENTROPY[testName];
          entropyBits = entropyConfig.bits;
          sourceUrl = entropyConfig.source;
          isEstimated = true;
        } else {
          console.warn(`FOUNDprint: No entropy config for test "${testName}". Using conservative fallback.`);
          entropyBits = 1.0;
          sourceUrl = null;
          isEstimated = true;
        }

        totalEntropy += entropyBits;
        successfulTests++;
        fingerprintValues.push(result.value);

        completedTests.push({
          name: test.name,
          difficulty: test.difficulty,
          changeRequires: test.changeRequires,
          entropy: entropyBits
        });

        const oneInX = (result.lookup && result.lookup.oneInX)
          ? result.lookup.oneInX
          : entropyToUniqueness(entropyBits);

        const isUnique = await addResultLine(
          resultsContainer, result.message, entropyBits, oneInX,
          sourceUrl, isEstimated, totalEntropy,
          successfulTests === 1, alreadyUnique
        );

        if (isUnique && !alreadyUnique) {
          alreadyUnique = true;
        }

      } catch (e) {
        failedTests.push(test.name);
        console.warn(`FOUNDprint: ${test.name} failed:`, e);
      }
    }

    const fingerprintHash = generateFingerprintHash(fingerprintValues);
    await showFinalReveal(finalContainer, successfulTests, totalEntropy, fingerprintHash);

    await sleep(800);
    showEndState(endContainer, successfulTests, failedTests, completedTests);
  }

  /** Initialize FOUNDprint when DOM is ready */
  function init() {
    const container = document.getElementById('foundprint-demo');

    if (!container) {
      console.error('FOUNDprint: Container #foundprint-demo not found');
      return;
    }

    createUI(container);

    document.getElementById('foundprint-start').addEventListener('click', () => {
      runExperiment();
    });
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
