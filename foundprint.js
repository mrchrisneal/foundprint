/**
 * ============================================================================
 * FOUNDprint - Fingerprint Output Using Non-IP Detection
 * ============================================================================
 *
 * Repository: https://github.com/mrchrisneal/foundprint
 * This file: https://github.com/mrchrisneal/foundprint/blob/main/foundprint.js
 *
 * EDUCATIONAL PROJECT
 * -------------------
 * This code is heavily commented to explain how browser fingerprinting works.
 * Each section explains not just WHAT the code does, but WHY it does it that
 * way. The comments are designed to be educational and approachable.
 *
 * WHAT THIS PROJECT DOES
 * ----------------------
 * This is an interactive experiment that reveals how identifiable your browser
 * is online - WITHOUT ever looking at your IP address. It demonstrates that
 * websites can identify you through dozens of small details about your browser,
 * screen, fonts, and hardware.
 *
 * All processing happens client-side (in your browser). Nothing is stored,
 * saved, or transmitted to any server.
 *
 * CONTACT
 * -------
 * Author: Chris Neal
 * Email: chris@neal.media
 * Website: https://neal.media/
 *
 * HOW TO READ THIS CODE
 * ---------------------
 * The code is organized into logical sections. Here's a roadmap:
 *
 * TABLE OF CONTENTS
 * -----------------
 * Line ~93    | SECTION 1: IIFE WRAPPER AND CONFIGURATION
 *             | The wrapper pattern and basic settings like animation speeds
 *
 * Line ~170   | SECTION 2: MARKET SHARE DATA
 *             | Real-world statistics about how common different browsers,
 *             | screen sizes, etc. are among internet users
 *
 * Line ~448   | SECTION 3: BASELINE ENTROPY VALUES
 *             | Academic research data about how identifying each browser
 *             | characteristic is (measured in "bits of entropy")
 *
 * Line ~702   | SECTION 4: DATA LOOKUP UTILITIES
 *             | Helper functions to look up how rare your specific
 *             | browser characteristics are
 *
 * Line ~842   | SECTION 5: GENERAL UTILITY FUNCTIONS
 *             | Reusable helper functions (formatting, hashing, parsing, etc.)
 *
 * Line ~1240  | SECTION 6: FINGERPRINTING TESTS
 *             | The actual tests that detect your browser's characteristics
 *             | (screen resolution, fonts, canvas fingerprint, etc.)
 *
 * Line ~2169  | SECTION 7: UI RENDERING
 *             | Functions that create the visual interface and animations
 *
 * Line ~2457  | SECTION 8: MAIN EXECUTION
 *             | The code that runs all tests and orchestrates the experiment
 *
 * KEY CONCEPTS
 * ------------
 * - IIFE: Immediately Invoked Function Expression - wraps code to avoid
 *   polluting the global namespace (explained at line ~93)
 * - Entropy: A measure of randomness/uniqueness (explained at line ~448)
 * - Async/Await: Modern way to handle asynchronous operations (explained
 *   where first used)
 * - DOM: Document Object Model - how JavaScript interacts with HTML
 *
 * ACADEMIC SOURCES
 * ----------------
 * Entropy values sourced from peer-reviewed research:
 * - Panopticlick (Eckersley, 2010)
 * - AmIUnique (Laperdrix et al., 2016)
 * - "Hiding in the Crowd" (Gomez-Boix et al., 2018)
 *
 * LICENSE
 * -------
 * AGPL-3.0
 *
 * THIRD-PARTY CODE
 * ----------------
 * - MD5 function based on blueimp/JavaScript-MD5 (MIT License)
 *   Copyright Sebastian Tschan - https://github.com/blueimp/JavaScript-MD5
 */

/*
 * ============================================================================
 * SECTION 1: IIFE WRAPPER AND CONFIGURATION
 * ============================================================================
 *
 * WHAT IS AN IIFE?
 * ----------------
 * The code below starts with "(function() {" and ends with "})();" - this is
 * called an IIFE (Immediately Invoked Function Expression, pronounced "iffy").
 *
 * WHY USE AN IIFE?
 * ----------------
 * In JavaScript, variables declared with "var" (or without any keyword) become
 * "global" - meaning any other script on the page can see and modify them.
 * This can cause bugs if two scripts use the same variable name.
 *
 * An IIFE creates a private scope. All the variables inside stay private and
 * can't accidentally interfere with other scripts. It's like putting your code
 * in its own room.
 *
 * Modern alternatives: Today, ES6 modules provide better isolation, but IIFEs
 * are still common and work in all browsers without build tools.
 *
 * WHAT IS 'use strict'?
 * ---------------------
 * This enables JavaScript's "strict mode" which:
 * - Catches common coding mistakes and throws errors
 * - Prevents use of some problematic language features
 * - Makes code run slightly faster in some engines
 * Always use it - it helps you write better code!
 */
(function() {
  'use strict';

  // ============================================================================
  // SECTION 1: CONFIGURATION
  // ============================================================================
  //
  // This section defines all the configurable settings for FOUNDprint.
  // By putting these at the top, they're easy to find and modify.
  //
  // WHY USE A CONFIG OBJECT?
  // ------------------------
  // Instead of scattering "magic numbers" throughout the code, all settings
  // are grouped in one place. This makes the code:
  // - Easier to understand (CONFIG.revealDelay vs mysterious "400")
  // - Easier to modify (change one place, affects everywhere)
  // - Self-documenting (the property names explain what each value does)

  const CONFIG = {
    // The version number of this script (follows semantic versioning: major.minor.patch)
    version: '1.0.2',

    // Animation timing settings (all values are in milliseconds)
    // 1000 milliseconds = 1 second
    revealDelay: 400,        // Pause between revealing each test result line
    typewriterSpeed: 15,     // Speed of the typing animation (lower = faster, 0 = instant)
    dramaticPause: 1200,     // Suspenseful pause before showing the final results

    // External links
    githubUrl: 'https://github.com/mrchrisneal/foundprint',  // Where to find the source code
    authorUrl: 'https://neal.media/'                          // Author's website
  };

  /*
   * WORLD_POPULATION constant
   * -------------------------
   * This serves as an upper bound for uniqueness calculations. If the math says
   * you're "1 in 10 billion" but there are only 8.3 billion humans, the value
   * is capped. You can't be more unique than "1 in everyone on Earth"!
   *
   * The "8.3e9" notation is scientific notation:
   * 8.3e9 = 8.3 × 10^9 = 8,300,000,000 (8.3 billion)
   *
   * This is easier to read and less error-prone than writing out all the zeros.
   */
  const WORLD_POPULATION = 8.3e9;

  // ============================================================================
  // SECTION 2: MARKET SHARE DATA FROM PUBLIC SOURCES
  // ============================================================================
  //
  // WHAT IS THIS SECTION?
  // ---------------------
  // This section contains real-world statistics about how common different
  // browser characteristics are among internet users. This data is used to
  // calculate how "rare" or "common" each of your browser's traits is.
  //
  // WHY IS THIS DATA NEEDED?
  // ------------------------
  // To figure out how identifiable you are, the calculation needs to know what
  // percentage of people share your characteristics. For example:
  // - If 23% of people have a 1920x1080 screen, you share that with ~1 in 4 people
  // - If only 2% have a 4K screen (3840x2160), you share that with ~1 in 50 people
  //
  // THE MATH (don't worry, it's simple!)
  // ------------------------------------
  // "1 in X" = 100 / market_share_percent
  //
  // Example: Chrome has 65% market share
  //   100 / 65 = ~1.54, so you share Chrome with about 1 in 1.5 people
  //   (meaning most people use Chrome - not very unique!)
  //
  // Example: Firefox has 3% market share
  //   100 / 3 = ~33, so you share Firefox with about 1 in 33 people
  //   (more unique than Chrome users!)
  //
  // DATA SOURCES
  // ------------
  // FOUNDprint uses data from Panopticlick (EFF's fingerprinting research project)
  // and other academic sources. All sources are cited for transparency.
  //
  // Data retrieved: December 2024
  // For detailed methodology, see:
  // https://github.com/mrchrisneal/foundprint/blob/main/METHODOLOGY.md
  //

  /*
   * SCREEN_RESOLUTION_DATA
   * ----------------------
   * Contains market share percentages for common screen resolutions.
   *
   * STRUCTURE OF THESE DATA OBJECTS:
   * - source: URL where the data was obtained (for verification)
   * - sourceLabel: Human-readable name of the source
   * - data: Object mapping values to their market share percentages
   * - defaultPercent: What percentage to assume for unlisted values
   *
   * WHY USE AN OBJECT INSTEAD OF AN ARRAY?
   * Objects allow O(1) lookup time - the code can instantly find "1920x1080": 23
   * without searching through a list. This is called a "hash map" or "dictionary"
   * in computer science.
   */
  const SCREEN_RESOLUTION_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.screenResolutions',
    data: {
      '1920x1080': 23,
      '1366x768': 19,
      '1536x864': 8,
      '1440x900': 5,
      '1280x720': 4,
      '2560x1440': 4,
      '1600x900': 3,
      '1280x800': 3,
      '3840x2160': 2
      // 'other': 29 - not matched, use defaultPercent
    },
    defaultPercent: 1.0  // Conservative estimate for unlisted resolutions
  };

  /*
   * BROWSER_DATA
   * ------------
   * Market share for different web browsers. Notice how Chrome dominates at 65%!
   * This means using Chrome makes you LESS unique (you blend in with the crowd).
   * Using a rare browser like Firefox (3%) makes you MORE identifiable.
   *
   * THE PRIVACY PARADOX:
   * Some privacy-conscious users switch to Firefox for better privacy features,
   * but ironically this can make them MORE identifiable through fingerprinting
   * because fewer people use Firefox.
   */
  const BROWSER_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.browsers',
    data: {
      'Chrome': 65,
      'Safari': 18,
      'Edge': 5,
      'Firefox': 3,
      'Opera': 2
      // 'Other': 7 - not matched, use defaultPercent
    },
    defaultPercent: 1.0
  };

  // GPU/WebGL Renderer Market Share
  // Note: Panopticlick doesn't include GPU-specific data
  // Fallback Source: Steam Hardware Survey (gamer-skewed sample)
  // For entropy baseline, FOUNDprint uses AmIUnique 2016: 3.41 bits
  // URL: https://store.steampowered.com/hwsurvey/directx/
  const GPU_DATA = {
    source: 'https://store.steampowered.com/hwsurvey/directx/',
    sourceLabel: 'Steam Hardware Survey (fallback)',
    note: 'Panopticlick lacks GPU data; Steam data is gamer-skewed',
    baselineEntropy: 3.41, // AmIUnique 2016 - conservative estimate
    baselineSource: 'https://hal.inria.fr/hal-01285470/document',
    data: {
      'NVIDIA GeForce RTX 3060': 8.32,
      'NVIDIA GeForce RTX 4060': 7.92,
      'NVIDIA GeForce RTX 3050': 5.92,
      'NVIDIA GeForce GTX 1650': 5.60,
      'NVIDIA GeForce RTX 4060 Ti': 5.26,
      'NVIDIA GeForce RTX 3060 Ti': 4.78,
      'NVIDIA GeForce RTX 3070': 4.48,
      'AMD Radeon Graphics': 4.24,
      'NVIDIA GeForce RTX 4070': 4.14,
      'NVIDIA GeForce RTX 2060': 3.92,
      'NVIDIA GeForce GTX 1060': 3.60,
      'Intel Iris Xe': 3.52,
      'Intel UHD Graphics': 2.0,
      'AMD Radeon RX': 2.0,
      'Apple M1': 1.5,
      'Apple M2': 1.0,
      'Apple M3': 0.8
    },
    defaultPercent: 0.5  // Most GPUs have <1% share
  };

  // Pixel Ratio
  // Source: Panopticlick entropy.ts POPULATION_STATS.pixelRatios
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const PIXEL_RATIO_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.pixelRatios',
    data: {
      '1': 45,
      '2': 30,
      '1.25': 10,
      '1.5': 8,
      '3': 3,
      '2.5': 2
      // 'other': 2 - use defaultPercent
    },
    defaultPercent: 2.0
  };

  /*
   * DNT_DATA (Do Not Track)
   * -----------------------
   * "Do Not Track" is a browser setting that asks websites not to track you.
   * Only ~20% of users enable it, which creates another privacy paradox:
   *
   * THE IRONY: Enabling "Do Not Track" makes you MORE trackable!
   * Since only 20% enable it, having DNT=1 immediately narrows you down to
   * 1 in 5 people. The setting meant to protect privacy becomes a fingerprint.
   *
   * Most websites ignore DNT anyway since it's not legally binding.
   */
  const DNT_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.privacyTools',
    data: {
      '1': 20,       // Enabled - 20% per Panopticlick
      '0': 3,        // Explicitly disabled (estimated)
      'null': 77     // Not set (remainder)
    },
    defaultPercent: 77
  };

  // CPU Cores (hardwareConcurrency)
  // Source: Panopticlick entropy.ts POPULATION_STATS.cpuCores
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const CPU_CORES_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.cpuCores',
    data: {
      '1': 1,
      '2': 15,
      '4': 35,
      '6': 15,
      '8': 20,
      '12': 5,
      '16': 5
      // 'other': 4 - use defaultPercent
    },
    defaultPercent: 4.0
  };

  // Device Memory (GB)
  // Source: Panopticlick entropy.ts POPULATION_STATS.deviceMemory
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const DEVICE_MEMORY_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.deviceMemory',
    data: {
      '2': 5,
      '4': 25,
      '8': 45,
      '16': 15,
      '32': 5
      // 'other': 5 - use defaultPercent
    },
    defaultPercent: 5.0
  };

  // Ad Blocker usage
  // Source: Panopticlick comparison.ts POPULATION_DATA.privacyTools.adBlocker
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts
  const AD_BLOCKER_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts',
    sourceLabel: 'Panopticlick POPULATION_DATA.privacyTools',
    data: {
      'true': 42,    // Has ad blocker - 42% per Panopticlick
      'false': 58    // No ad blocker
    }
  };

  // Timezone
  // Source: Panopticlick entropy.ts POPULATION_STATS.timezones
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const TIMEZONE_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.timezones',
    data: {
      'America/New_York': 12,
      'America/Los_Angeles': 10,
      'America/Chicago': 8,
      'Asia/Shanghai': 6,
      'Europe/London': 5,
      'Asia/Tokyo': 4,
      'Europe/Paris': 3,
      'Europe/Berlin': 3
      // 'other': 49 - use defaultPercent
    },
    defaultPercent: 1.0  // Conservative for unlisted timezones
  };

  // Language
  // Source: Panopticlick entropy.ts POPULATION_STATS.languages
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const LANGUAGE_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.languages',
    data: {
      'en-US': 35,
      'zh-CN': 10,
      'en-GB': 5,
      'es': 5,
      'de': 3,
      'fr': 3,
      'ja': 3
      // 'other': 36 - use defaultPercent
    },
    defaultPercent: 1.0  // Conservative for unlisted languages
  };

  // Platform
  // Source: Panopticlick entropy.ts POPULATION_STATS.platforms
  // URL: https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts
  const PLATFORM_DATA = {
    source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
    sourceLabel: 'Panopticlick POPULATION_STATS.platforms',
    data: {
      'Win32': 70,
      'MacIntel': 15,
      'iPhone': 5,
      'Android': 4,
      'Linux x86_64': 3,
      'iPad': 2
      // 'other': 1 - use defaultPercent
    },
    defaultPercent: 1.0
  };

  // ============================================================================
  // SECTION 3: BASELINE ENTROPY VALUES FROM ACADEMIC RESEARCH
  // ============================================================================
  //
  // WHAT IS ENTROPY?
  // ----------------
  // Entropy is a measure of randomness or unpredictability, measured in "bits".
  // In fingerprinting, entropy indicates how much identifying information a single
  // characteristic provides.
  //
  // UNDERSTANDING BITS OF ENTROPY
  // -----------------------------
  // Think of each bit as a yes/no question that narrows down who you are:
  //
  //   1 bit  = 2 possibilities   (1 in 2 people)    - like a coin flip
  //   2 bits = 4 possibilities   (1 in 4 people)    - like two coin flips
  //   3 bits = 8 possibilities   (1 in 8 people)
  //   8 bits = 256 possibilities (1 in 256 people)
  //   10 bits = 1,024 possibilities (1 in ~1000 people)
  //   20 bits = 1,048,576 possibilities (1 in ~1 million people)
  //   33 bits = 8.6 billion possibilities (more than Earth's population!)
  //
  // THE FORMULA: possibilities = 2^bits
  // Or backwards: bits = log2(possibilities)
  //
  // COMBINING ENTROPY
  // -----------------
  // When you combine independent characteristics, you ADD the bits:
  // - Screen resolution: 4 bits (1 in 16)
  // - Browser: 3 bits (1 in 8)
  // - Combined: 7 bits (1 in 128)
  //
  // This is why fingerprinting is so powerful - each small detail adds up!
  //
  // WHY "BASELINE" VALUES?
  // ----------------------
  // For some characteristics (like canvas fingerprints), exact market share
  // can't be looked up. Instead, FOUNDprint uses values from academic research
  // that measured how identifying these characteristics are in real populations.
  //
  // The LOWEST (most conservative) value from multiple studies is always used
  // to avoid overstating how unique you are.
  //
  // ACADEMIC SOURCES
  // ----------------
  // - Panopticlick 2010: https://coveryourtracks.eff.org/static/browser-uniqueness.pdf
  // - AmIUnique 2016: https://hal.inria.fr/hal-01285470/document
  // - Hiding in the Crowd 2018: https://hal.inria.fr/hal-01718234v2/document

  const BASELINE_ENTROPY = {
    /*
     * Canvas Fingerprint Entropy
     * --------------------------
     * Canvas fingerprinting draws invisible shapes and text, then reads back
     * the pixel data. Tiny differences in graphics hardware, drivers, and
     * fonts cause each browser to render slightly differently.
     *
     * At 8.04 bits, your canvas fingerprint alone narrows you to 1 in ~260 people.
     */
    canvas: {
      bits: 8.04,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 8.28 bits'
    },
    
    // Audio fingerprint
    // Panopticlick entropy.ts: 10 bits (from code comment)
    // No academic cross-reference available
    // Using: 10 bits (only available estimate)
    audio: {
      bits: 10,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick entropy.ts (code comment)',
      note: 'Based on Panopticlick implementation; no academic baseline available'
    },
    
    // WebGL Renderer
    // AmIUnique 2016: 3.41 bits, HitC 2018: 5.28 bits
    // Using: 3.41 bits (lowest - AmIUnique 2016)
    webglRenderer: {
      bits: 3.41,
      source: 'https://hal.inria.fr/hal-01285470/document',
      sourceLabel: 'AmIUnique 2016 (Table 2)',
      note: 'Conservative estimate; HitC 2018 found 5.28 bits'
    },
    
    // WebGL Vendor
    // AmIUnique 2016: 2.14 bits, HitC 2018: 1.82 bits
    // Using: 1.82 bits (lowest - HitC 2018)
    webglVendor: {
      bits: 1.82,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 2.14 bits'
    },
    
    // Fonts (when no specific list match is found)
    // Panopticlick 2010: 13.9 bits, AmIUnique 2016: 8.38 bits, HitC 2018: 6.97 bits
    // Using: 6.97 bits (lowest - HitC 2018)
    fonts: {
      bits: 6.97,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; Panopticlick found 13.9 bits'
    },
    
    // User Agent (baseline when not matching specific browser)
    // Panopticlick 2010: 10.0 bits, AmIUnique 2016: 9.78 bits, HitC 2018: 6.32 bits
    // Using: 6.32 bits (lowest - HitC 2018)
    userAgent: {
      bits: 6.32,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; Panopticlick found 10.0 bits'
    },
    
    // Timezone (baseline when not in the lookup table)
    // Panopticlick 2010: 3.04 bits, AmIUnique 2016: 3.34 bits
    // HitC 2018: 0.10 bits (EXCLUDED - 98% French sample biased to single timezone)
    // Using: 3.04 bits (lowest unbiased - Panopticlick 2010)
    timezone: {
      bits: 3.04,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'HitC 2018 (0.10 bits) excluded due to French geographic bias'
    },
    
    // Language (baseline when not in the lookup table)
    // AmIUnique 2016: 5.92 bits, HitC 2018: 2.56 bits
    // Using: 2.56 bits (lowest - HitC 2018)
    language: {
      bits: 2.56,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Conservative estimate; AmIUnique found 5.92 bits'
    },
    
    // Touch support
    // Panopticlick entropy.ts: 1-3 bits based on touch point count
    // Using: 1 bit (conservative - most common case)
    touchSupport: {
      bits: 1,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick entropy.ts (calculateTouchPointsEntropy)',
      note: 'Desktop (0 touch) = 1 bit; touch devices = 2-3 bits'
    },
    
    // Connection type
    // No academic data available
    // Using: 1.5 bits (conservative estimate)
    connectionType: {
      bits: 1.5,
      source: null,
      sourceLabel: 'No public dataset',
      note: 'Estimated; no academic baseline available'
    },
    
    // Plugins (modern browsers)
    // Panopticlick 2010: 15.4 bits, AmIUnique 2016: 11.06 bits
    // HitC 2018 Desktop: 10.28 bits, HitC 2018 Mobile: 0.21 bits
    // Using: 0.21 bits (lowest - mobile, since plugins are mostly dead)
    plugins: {
      bits: 0.21,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 Mobile (Table 3)',
      note: 'Plugins largely deprecated; desktop was 10.28 bits'
    },
    
    // Do Not Track (baseline)
    // AmIUnique 2016: 0.94 bits, HitC 2018: 1.92 bits
    // Using: 0.94 bits (lowest - AmIUnique 2016)
    doNotTrack: {
      bits: 0.94,
      source: 'https://hal.inria.fr/hal-01285470/document',
      sourceLabel: 'AmIUnique 2016 (Table 2)',
      note: 'Conservative estimate; HitC 2018 found 1.92 bits'
    },
    
    // Cookies Enabled
    // Panopticlick 2010: 0.35 bits, AmIUnique 2016: 0.25 bits, HitC 2018: 0.00 bits
    // Using: 0.00 bits (lowest - HitC 2018, nearly everyone has cookies enabled)
    cookiesEnabled: {
      bits: 0.00,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Nearly universal; provides no distinguishing information'
    },
    
    // Local/Session Storage
    // AmIUnique 2016: 0.41 bits, HitC 2018: 0.04 bits
    // Using: 0.04 bits (lowest - HitC 2018)
    localStorage: {
      bits: 0.04,
      source: 'https://hal.inria.fr/hal-01718234v2/document',
      sourceLabel: 'Hiding in the Crowd 2018 (Table 3)',
      note: 'Nearly universal; provides minimal distinguishing information'
    },

    // Screen Resolution (baseline when not in lookup table)
    // Panopticlick 2010: 4.83 bits, AmIUnique 2016: 5.21 bits, HitC 2018: 4.83 bits
    // Using: 4.83 bits (lowest - Panopticlick 2010 / HitC 2018)
    screenResolution: {
      bits: 4.83,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'Used when resolution not in Panopticlick POPULATION_STATS lookup table'
    },

    // Pixel Ratio (baseline when not in lookup table)
    // Not tracked separately in academic studies
    // Panopticlick POPULATION_STATS covers main values (1, 2, 1.25, 1.5, 3, 2.5)
    // "Other" is ~2% per Panopticlick, giving ~5.64 bits
    // Using: 2.0 bits (conservative estimate for unlisted ratios)
    pixelRatio: {
      bits: 2.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For pixel ratios not in the lookup table'
    },

    // Platform (baseline when not in lookup table)
    // Panopticlick 2010: 0.56 bits, AmIUnique 2016: 1.06 bits
    // Using: 0.56 bits (lowest - Panopticlick 2010)
    platform: {
      bits: 0.56,
      source: 'https://coveryourtracks.eff.org/static/browser-uniqueness.pdf',
      sourceLabel: 'Panopticlick 2010',
      note: 'Used when platform not in Panopticlick POPULATION_STATS lookup table'
    },

    // CPU Cores (baseline when not in lookup table)
    // Not tracked by academic studies
    // Panopticlick POPULATION_STATS covers 1-16 cores
    // Using: 3.0 bits (conservative for unusual core counts)
    cpuCores: {
      bits: 3.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For core counts not in the lookup table'
    },

    // Device Memory (baseline when not in lookup table)
    // Not tracked by academic studies
    // Panopticlick POPULATION_STATS covers 2-32 GB
    // Using: 3.0 bits (conservative for unusual memory sizes)
    deviceMemory: {
      bits: 3.0,
      source: 'https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts',
      sourceLabel: 'Panopticlick POPULATION_STATS (estimated for unlisted)',
      note: 'For memory sizes not in the lookup table'
    }
  };

  // ============================================================================
  // SECTION 4: UTILITY FUNCTIONS FOR DATA LOOKUP
  // ============================================================================
  //
  // This section contains helper functions that look up values in the market
  // share data and convert between different representations (percentage,
  // entropy bits, "1 in X" format).
  //
  // WHY SEPARATE LOOKUP FUNCTIONS?
  // ------------------------------
  // Instead of copying the same lookup logic everywhere, it's placed in one spot.
  // This is called "DRY" (Don't Repeat Yourself) - a core programming principle.

  /**
   * lookupMarketShare - Find how common a value is in the population
   * ----------------------------------------------------------------
   * This function searches the market share data to find what percentage
   * of people share a given characteristic (like screen resolution or browser).
   *
   * HOW IT WORKS:
   * 1. First, try an exact match (e.g., "1920x1080" matches "1920x1080")
   * 2. If no exact match, try a partial match (e.g., "Chrome" matches "Chrome 120")
   * 3. If still no match, return the default percentage (conservative estimate)
   *
   * PARAMETERS:
   * @param {Object} dataSource - One of the data objects (like SCREEN_RESOLUTION_DATA)
   * @param {string|number} value - The value to look up (e.g., "1920x1080")
   *
   * RETURNS:
   * @returns {Object} - { percent: number, source: string, estimated: boolean }
   *   - percent: The market share percentage
   *   - source: URL where the data was obtained
   *   - estimated: true if a default value was used (no exact match found)
   */
  function lookupMarketShare(dataSource, value) {
    // Convert to string and remove whitespace for consistent comparison
    const normalizedValue = String(value).trim();

    // STRATEGY 1: Try exact match first (fastest, most accurate)
    // The "!== undefined" check is important because the value could be 0,
    // which is falsy but still a valid percentage
    if (dataSource.data[normalizedValue] !== undefined) {
      return {
        percent: dataSource.data[normalizedValue],
        source: dataSource.source,
        estimated: dataSource.estimated || false
      };
    }

    // STRATEGY 2: Try partial match
    // This handles cases like "Chrome 120.0.6099.130" matching "Chrome"
    // Object.keys() returns an array of all the keys in the data object
    for (const key of Object.keys(dataSource.data)) {
      if (normalizedValue.includes(key) || key.includes(normalizedValue)) {
        return {
          percent: dataSource.data[key],
          source: dataSource.source,
          estimated: dataSource.estimated || false
        };
      }
    }

    // STRATEGY 3: No match found - use conservative default
    // This is marked as "estimated" so the UI can show it differently
    return {
      percent: dataSource.defaultPercent || 1.0,
      source: dataSource.source,
      estimated: true
    };
  }

  /**
   * percentToEntropy - Convert market share percentage to entropy bits
   * -------------------------------------------------------------------
   * This is the core formula for calculating fingerprinting entropy.
   *
   * THE MATH:
   * entropy = log2(100 / percent)
   *
   * EXAMPLES:
   * - 50% market share: log2(100/50) = log2(2) = 1 bit
   * - 25% market share: log2(100/25) = log2(4) = 2 bits
   * - 1% market share:  log2(100/1) = log2(100) = ~6.64 bits
   *
   * WHY THIS FORMULA?
   * Entropy measures "surprise" or "information". If something is rare
   * (low percentage), seeing it tells you more about who the person is.
   *
   * @param {number} percent - Market share as a percentage (0-100)
   * @returns {number} - Entropy in bits
   */
  function percentToEntropy(percent) {
    // Guard against division by zero or negative values
    if (percent <= 0) return 10; // Cap at 10 bits for very rare values
    return Math.log2(100 / percent);
  }

  /**
   * percentToOneInX - Convert percentage to "1 in X people" format
   * ---------------------------------------------------------------
   * This makes the data more intuitive for users to understand.
   *
   * EXAMPLES:
   * - 50% market share: 100/50 = 2  → "1 in 2 people"
   * - 10% market share: 100/10 = 10 → "1 in 10 people"
   * - 1% market share:  100/1 = 100 → "1 in 100 people"
   *
   * @param {number} percent - Market share as a percentage (0-100)
   * @returns {number} - The "X" in "1 in X people"
   */
  function percentToOneInX(percent) {
    if (percent <= 0) return 1000; // Cap for very rare values
    return 100 / percent;
  }

  /*
   * TEST_FONTS - List of fonts to check for during font fingerprinting
   * -------------------------------------------------------------------
   * FOUNDprint tests whether each of these fonts is installed on the user's system.
   * The combination of installed fonts is surprisingly unique!
   *
   * WHY THESE SPECIFIC FONTS?
   * - Common system fonts (Arial, Times New Roman) - installed on most systems
   * - Platform-specific fonts (SF Pro for Mac, Segoe UI for Windows)
   * - Developer fonts (Fira Code, JetBrains Mono) - rare, very identifying!
   *
   * WHY NOT TEST MORE FONTS?
   * Testing fonts is slow (requires DOM manipulation for each one).
   * The list is limited for performance while still getting good entropy.
   */
  const TEST_FONTS = [
    'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS',
    'Consolas', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
    'Lucida Console', 'Monaco', 'Palatino Linotype', 'Segoe UI',
    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Menlo',
    'SF Pro', 'Roboto', 'Open Sans', 'Helvetica Neue', 'Ubuntu',
    'Droid Sans', 'Noto Sans', 'Liberation Sans', 'DejaVu Sans'
  ];

  // ============================================================================
  // SECTION 5: GENERAL UTILITY FUNCTIONS
  // ============================================================================
  //
  // This section contains reusable helper functions used throughout the code.
  // These are general-purpose tools, not specific to fingerprinting.
  //
  // WHAT ARE UTILITY FUNCTIONS?
  // ---------------------------
  // Utility functions are small, focused functions that do one thing well.
  // They're like tools in a toolbox - you don't need to rebuild a hammer
  // every time you need to drive a nail. Similarly, these functions are written
  // once and reused wherever needed.
  //
  // FUNCTIONS IN THIS SECTION:
  // - formatNumber(): Make big numbers readable (e.g., "8.3 billion")
  // - entropyToUniqueness(): Convert entropy bits to "1 in X" number
  // - md5(): Generate a hash fingerprint from data
  // - generateFingerprintHash(): Combine all fingerprint data into one hash
  // - parseUserAgent(): Extract browser and OS info from user agent string
  // - getTimezoneInfo(): Get the user's timezone in a readable format
  // - sleep(): Pause execution for animations

  /**
   * formatNumber - Make large numbers human-readable
   * -------------------------------------------------
   * Converts numbers like 8300000000 to "8.3 billion" for easier reading.
   * Also determines if a number exceeds world population (meaning uniqueness).
   *
   * WHY RETURN AN OBJECT INSTEAD OF JUST A STRING?
   * The caller needs both the formatted text AND whether the number represents
   * statistical uniqueness (exceeding world population). Returning an object
   * bundles related information together.
   *
   * @param {number} num - The number to format
   * @returns {Object} - { text: string, isUnique: boolean, raw: number }
   */
  function formatNumber(num) {
    // Format the actual number (always round - can't have fractional people!)
    let text;

    // Use if-else chain to pick appropriate suffix based on magnitude
    // 1e12 = 1,000,000,000,000 (one trillion) - scientific notation is cleaner
    if (num >= 1e12) text = (num / 1e12).toFixed(1) + ' trillion';
    else if (num >= 1e9) text = (num / 1e9).toFixed(1) + ' billion';
    else if (num >= 1e6) text = (num / 1e6).toFixed(1) + ' million';
    // toLocaleString() adds commas: 1234567 → "1,234,567"
    else if (num >= 1e3) text = Math.round(num).toLocaleString();
    else text = Math.round(num).toString();

    // Check if exceeds world population (statistically unique among all humans)
    if (num >= WORLD_POPULATION) {
      return {
        text: text,
        isUnique: true,  // Flag that this person is globally unique!
        raw: num
      };
    }

    return {
      text: text,
      isUnique: false,
      raw: num
    };
  }

  /**
   * entropyToUniqueness - Convert entropy bits to anonymity set size
   * -----------------------------------------------------------------
   * This is the inverse of the entropy formula: 2^bits calculates how many
   * people share this combination of characteristics.
   *
   * EXAMPLES:
   * - 10 bits → 2^10 = 1,024 people (you're 1 in ~1000)
   * - 20 bits → 2^20 = 1,048,576 people (you're 1 in ~1 million)
   * - 33 bits → 2^33 = 8.6 billion people (unique among all humans!)
   *
   * @param {number} bits - Entropy in bits
   * @returns {number} - Size of the anonymity set (the "X" in "1 in X")
   */
  function entropyToUniqueness(bits) {
    // Math.pow(2, bits) calculates 2 raised to the power of bits
    return Math.pow(2, bits);
  }

  /**
   * MD5 Hash Function
   * -----------------
   * Creates a 32-character "fingerprint" of any input string.
   * Same input always produces the same output, but you can't reverse it.
   *
   * WHAT IS A HASH?
   * A hash function takes any input and produces a fixed-size output.
   * Think of it like a blender - you can blend any fruit into a smoothie,
   * but you can't un-blend it back into the original fruit.
   *
   * WHY USE MD5?
   * MD5 creates a short, consistent identifier from all the fingerprint data.
   * This makes it easy to compare fingerprints and display them to users.
   * (Note: MD5 is NOT secure for passwords, but it's fine for this
   * non-security-critical use case.)
   *
   * TECHNICAL NOTE:
   * This implementation is based on the blueimp/JavaScript-MD5 library.
   * The math is complex (bitwise operations, specific constants) but follows
   * the official MD5 specification (RFC 1321).
   *
   * Based on blueimp/JavaScript-MD5 (https://github.com/blueimp/JavaScript-MD5)
   * Copyright Sebastian Tschan (https://blueimp.net)
   * Licensed under the MIT license: https://opensource.org/licenses/MIT
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

  /**
   * generateFingerprintHash - Combine all fingerprint data into one hash
   * ---------------------------------------------------------------------
   * Takes all the collected fingerprint values and creates a single,
   * unique identifier (hash) that represents this browser's fingerprint.
   *
   * HOW IT WORKS:
   * 1. Convert each value to a JSON string (handles objects, arrays, etc.)
   * 2. Join all values with a "|" separator
   * 3. Hash the combined string with MD5
   *
   * EXAMPLE:
   * Input values: [1920, "Chrome", ["Arial", "Helvetica"]]
   * Combined string: '1920|"Chrome"|["Arial","Helvetica"]'
   * Output: "A7B2C9D4E5F6..." (32-character hash)
   *
   * @param {Array} values - Array of fingerprint values collected from tests
   * @returns {string} - 32-character MD5 hash
   */
  function generateFingerprintHash(values) {
    // .map() transforms each value; JSON.stringify handles any data type
    // .join('|') combines them with a separator that won't appear in the data
    const str = values.map(v => JSON.stringify(v)).join('|');
    return md5(str);
  }

  /**
   * parseUserAgent - Extract browser and OS from the user agent string
   * -------------------------------------------------------------------
   * The "user agent" is a string your browser sends to every website,
   * identifying what browser and operating system you're using.
   *
   * EXAMPLE USER AGENT STRING:
   * "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
   *  (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
   *
   * This function parses that messy string to extract human-readable info:
   * - Browser: "Chrome 120"
   * - OS: "Windows 10/11"
   *
   * WHY IS THE USER AGENT SO COMPLICATED?
   * Historical reasons! Browsers used to lie about their identity to get
   * served content meant for other browsers. Now everyone includes bits
   * from everyone else's user agent for compatibility. It's a mess.
   *
   * @param {string} ua - The user agent string from navigator.userAgent
   * @returns {Object} - { browser: string, os: string }
   */
  function parseUserAgent(ua) {
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // BROWSER DETECTION
    // Order matters! Check Edge before Chrome because Edge includes "Chrome" in its UA
    // The .includes() method checks if a string contains a substring
    // The .match() method uses a regex to extract specific parts
    if (ua.includes('Firefox/')) {
      const match = ua.match(/Firefox\/(\d+)/);  // Capture the version number
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
    
    // Detect OS (check iPhone/iPad before Mac OS X since iOS UA contains "Mac OS X")
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

  /**
   * getTimezoneInfo - Get the user's timezone in a readable format
   * ---------------------------------------------------------------
   * Retrieves timezone information from the browser and formats it
   * for display. Timezones are identifying because they narrow down
   * your geographic region.
   *
   * WHAT WE EXTRACT:
   * - timezone: Human-readable name like "New York" (from "America/New_York")
   * - offset: UTC offset like "UTC-5" or "UTC+5:30"
   * - raw: The original timezone identifier for fingerprinting
   *
   * @returns {Object} - { timezone: string, offset: string, raw: string }
   */
  function getTimezoneInfo() {
    // The Intl API provides locale-aware formatting
    // resolvedOptions() reveals what settings the browser is using
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // getTimezoneOffset() returns the difference from UTC in MINUTES
    // Confusingly, it's positive for zones BEHIND UTC (America) and negative for AHEAD (Asia)
    const offset = new Date().getTimezoneOffset();

    // Convert minutes to hours and minutes for display
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMins = Math.abs(offset % 60);

    // Build the offset string (note: sign is inverted from getTimezoneOffset!)
    const sign = offset <= 0 ? '+' : '-';
    const offsetStr = 'UTC' + sign + offsetHours + (offsetMins ? ':' + String(offsetMins).padStart(2, '0') : '');

    // Make timezone name more readable:
    // "America/New_York" → split by "/" → ["America", "New_York"] → pop() → "New_York" → replace "_" → "New York"
    const readableTz = tz.replace(/_/g, ' ').split('/').pop();

    return { timezone: readableTz, offset: offsetStr, raw: tz };
  }

  /**
   * analyzePixelRatio - Detect if devicePixelRatio appears to be affected by zoom
   * -------------------------------------------------------------------------------
   * Browser zoom affects window.devicePixelRatio, making fingerprinting unreliable.
   * For example, a 1x display at 110% zoom reports 1.1 DPR.
   *
   * This function analyzes the reported ratio and attempts to determine:
   * 1. Whether zoom is likely applied
   * 2. What the "true" (unzoomed) device pixel ratio probably is
   *
   * STRATEGY:
   * Common base DPRs: 1, 1.25, 1.5, 2, 2.5, 3
   * Common zoom levels: 100%, 110%, 125%, 150%, 175%, 200%
   *
   * If the ratio = baseDPR × zoomFactor (within tolerance), we can infer both.
   *
   * LIMITATIONS:
   * - Cannot definitively distinguish 2x DPR from 1x at 200% zoom
   * - Safari doesn't change DPR with zoom (so zoom detection doesn't apply)
   * - This is a heuristic, not a guarantee
   *
   * @param {number} ratio - The raw window.devicePixelRatio value
   * @returns {Object} - { displayRatio, trueDPR, zoomPercent, isZoomed, confidence }
   */
  function analyzePixelRatio(ratio) {
    // Round to 3 decimal places for cleaner display and comparison
    const displayRatio = Math.round(ratio * 1000) / 1000;

    // Known base device pixel ratios - order matters for priority!
    // We check DPR 1 first because it's most common and we want to prefer
    // "1x screen with zoom" over "2x screen with zoom-out" interpretations
    const knownDPRs = [1, 1.25, 1.5, 2, 2.5, 3];

    // Common browser zoom levels as multipliers
    // Includes all standard browser zoom presets
    const commonZoomLevels = [
      { zoom: 1.0,   percent: 100 },
      { zoom: 1.1,   percent: 110 },
      { zoom: 1.2,   percent: 120 },
      { zoom: 1.25,  percent: 125 },
      { zoom: 1.33,  percent: 133 },
      { zoom: 1.5,   percent: 150 },
      { zoom: 1.75,  percent: 175 },
      { zoom: 2.0,   percent: 200 },
      { zoom: 0.9,   percent: 90 },
      { zoom: 0.8,   percent: 80 },
      { zoom: 0.75,  percent: 75 },
      { zoom: 0.67,  percent: 67 },
      { zoom: 0.5,   percent: 50 },
      { zoom: 0.33,  percent: 33 },
      { zoom: 0.3,   percent: 30 }
    ];

    // Tolerance for matching (accounts for floating-point imprecision)
    const tolerance = 0.015;

    // Check if the ratio exactly matches a known DPR (no zoom)
    for (const baseDPR of knownDPRs) {
      if (Math.abs(displayRatio - baseDPR) < tolerance) {
        return {
          displayRatio,
          trueDPR: baseDPR,
          zoomPercent: 100,
          isZoomed: false,
          confidence: 'high',
          matchedBucket: String(baseDPR)
        };
      }
    }

    // Try to find a baseDPR × zoom combination that matches
    // IMPORTANT: We iterate DPRs in order (1 first) and prefer lower DPRs
    // This ensures "1x at 120% zoom" beats "1.5x at 80% zoom" when both match
    let allMatches = [];

    for (const baseDPR of knownDPRs) {
      for (const { zoom, percent } of commonZoomLevels) {
        if (percent === 100) continue; // Already checked exact matches

        const expectedRatio = baseDPR * zoom;
        const diff = Math.abs(displayRatio - expectedRatio);

        if (diff < tolerance) {
          allMatches.push({
            displayRatio,
            trueDPR: baseDPR,
            zoomPercent: percent,
            isZoomed: true,
            confidence: 'medium',
            matchedBucket: String(baseDPR),
            diff: diff
          });
        }
      }
    }

    if (allMatches.length > 0) {
      // Sort matches by priority:
      // 1. Prefer lower base DPR (1x screens are most common)
      // 2. For same DPR, prefer smaller diff (better match)
      allMatches.sort((a, b) => {
        if (a.trueDPR !== b.trueDPR) {
          return a.trueDPR - b.trueDPR; // Lower DPR wins
        }
        return a.diff - b.diff; // Better match wins
      });

      const best = allMatches[0];
      delete best.diff; // Remove internal property
      return best;
    }

    // No match found - this is an unusual ratio
    // Assume it's a 1x screen with unusual zoom (most common case)
    const inferredZoom = Math.round(displayRatio * 100);

    return {
      displayRatio,
      trueDPR: 1, // Assume standard density screen
      zoomPercent: inferredZoom,
      isZoomed: true,
      confidence: 'low',
      matchedBucket: '1' // Match to standard density bucket
    };
  }

  /**
   * sleep - Pause execution for a specified time
   * ---------------------------------------------
   * This function is used to create delays for animations.
   * It returns a Promise that resolves after the specified time.
   *
   * HOW IT WORKS WITH ASYNC/AWAIT:
   * When you use "await sleep(1000)", JavaScript pauses at that line
   * for 1 second, then continues. This is much cleaner than nested
   * setTimeout callbacks!
   *
   * EXAMPLE USAGE:
   *   async function animate() {
   *     showElement();
   *     await sleep(500);   // Wait 500ms
   *     hideElement();
   *   }
   *
   * WHAT IS A PROMISE?
   * A Promise is JavaScript's way of handling async operations.
   * It's like a "promise" to give you a value later. The Promise
   * constructor takes a function with a "resolve" callback that
   * you call when the async work is done.
   *
   * @param {number} ms - Time to wait in milliseconds
   * @returns {Promise} - Resolves after the specified time
   */
  function sleep(ms) {
    // setTimeout schedules a function to run after ms milliseconds
    // Wrapping it in a Promise allows using await with it
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // SECTION 6: FINGERPRINTING TESTS
  // ============================================================================
  //
  // This is the heart of FOUNDprint! Each test detects a different browser
  // characteristic that can be used to identify you.
  //
  // HOW TESTS ARE ORGANIZED
  // -----------------------
  // Tests are grouped into tiers based on browser compatibility:
  //
  // TIER 1 - High Compatibility (works in almost all browsers):
  //   Screen resolution, pixel ratio, timezone, language, platform, user agent, DNT
  //
  // TIER 2 - Good Compatibility (works in most modern browsers):
  //   CPU cores, device memory, touch support, connection type
  //
  // TIER 3 - Fingerprinting Techniques (more advanced, may not work everywhere):
  //   Canvas fingerprint, WebGL, audio fingerprint, font detection
  //
  // TIER 4 - Behavioral:
  //   Ad blocker detection
  //
  // TEST STRUCTURE
  // --------------
  // Each test is an object with:
  // - name: Human-readable name for display
  // - run: Function that performs the test and returns results
  //
  // The run() function returns an object with:
  // - value: The raw detected value (used for the fingerprint hash)
  // - message: Human-readable description (shown to user)
  // - lookup: Entropy/uniqueness data (percent, source, entropy bits, etc.)
  //
  // If a test fails or can't detect anything, it returns null.

  const tests = {

    // =========================================================================
    // TIER 1: HIGH COMPATIBILITY TESTS
    // =========================================================================
    // These tests work in virtually all browsers and don't require special APIs.

    /**
     * Screen Resolution Test
     * ----------------------
     * Detects your display's resolution (e.g., 1920x1080, 2560x1440).
     *
     * WHY IS THIS IDENTIFYING?
     * While 1920x1080 is common (~23% of users), unusual resolutions like
     * 2560x1080 (ultrawide) or custom monitor sizes are quite rare.
     *
     * TECHNICAL NOTE:
     * The code multiplies by devicePixelRatio to get physical pixels, not CSS pixels.
     * A Retina display might report 1440x900 CSS pixels but actually have
     * 2880x1800 physical pixels.
     */
    screenResolution: {
      name: 'Screen Resolution',
      difficulty: 'hard',
      changeRequires: 'Different monitor',
      run: function() {
        // Get the device pixel ratio (1 for standard displays, 2 for Retina, etc.)
        const dpr = window.devicePixelRatio || 1;

        // Calculate actual physical resolution
        const width = Math.round(screen.width * dpr);
        const height = Math.round(screen.height * dpr);
        const resolution = `${width}x${height}`;

        // Look up market share from Panopticlick data
        const lookup = lookupMarketShare(SCREEN_RESOLUTION_DATA, resolution);

        // If no match found, fall back to baseline entropy from research
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.screenResolution;
          return {
            value: resolution,
            message: `Your screen resolution is **${width}×${height}**.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);

        return {
          value: resolution,
          message: `Your screen resolution is **${width}×${height}**.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: SCREEN_RESOLUTION_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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

        // Analyze the ratio for zoom detection and smart bucket matching
        const analysis = analyzePixelRatio(rawRatio);

        // Determine density description based on TRUE DPR (not zoomed value)
        // High-density displays are typically 2x or higher
        let desc;
        if (analysis.trueDPR >= 2) {
          desc = 'high-density (Retina/HiDPI)';
        } else if (analysis.trueDPR >= 1.5) {
          desc = 'enhanced density';
        } else {
          desc = 'standard density';
        }

        // Build the message - include zoom info if detected, with confidence level
        let message;
        if (analysis.isZoomed) {
          if (analysis.confidence === 'high') {
            // High confidence: exact match to known DPR × zoom combination
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, browser zoomed to ${analysis.zoomPercent}%).`;
          } else if (analysis.confidence === 'medium') {
            // Medium confidence: likely zoom detected
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, likely browser zoom ~${analysis.zoomPercent}%).`;
          } else {
            // Low confidence: unusual ratio, best guess
            message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}, unusual value - may be affected by zoom).`;
          }
        } else {
          message = `Your display has a **${analysis.displayRatio}x pixel ratio** (${desc}).`;
        }

        // Use the matched bucket if we have confidence, otherwise use estimated entropy
        if (analysis.matchedBucket) {
          // Try to match against Panopticlick pixel ratio data using the TRUE DPR
          const lookup = lookupMarketShare(PIXEL_RATIO_DATA, analysis.matchedBucket);

          if (!lookup.estimated) {
            const entropy = percentToEntropy(lookup.percent);
            const oneInX = percentToOneInX(lookup.percent);

            return {
              value: analysis.displayRatio, // Use the actual ratio for fingerprinting
              message: message,
              lookup: {
                percent: lookup.percent,
                source: lookup.source,
                sourceLabel: PIXEL_RATIO_DATA.sourceLabel,
                estimated: false,
                entropy: entropy,
                oneInX: oneInX
              }
            };
          }
        }

        // Fall back to baseline entropy for unusual ratios
        const baseline = BASELINE_ENTROPY.pixelRatio;
        return {
          value: analysis.displayRatio,
          message: message,
          lookup: {
            percent: null,
            source: baseline.source,
            sourceLabel: baseline.sourceLabel,
            estimated: true,
            entropy: baseline.bits,
            oneInX: Math.pow(2, baseline.bits),
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
        
        // Try to match against Panopticlick timezone data
        const lookup = lookupMarketShare(TIMEZONE_DATA, info.raw);
        
        // If no match found, fall back to baseline entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.timezone;
          return {
            value: info.raw,
            message: `You're in the **${info.timezone}** timezone (${info.offset}).`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }
        
        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);
        
        return {
          value: info.raw,
          message: `You're in the **${info.timezone}** timezone (${info.offset}).`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: TIMEZONE_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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
        
        // Try to match against Panopticlick language data
        const lookup = lookupMarketShare(LANGUAGE_DATA, lang);
        
        // If no match found, fall back to baseline entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.language;
          return {
            value: lang,
            message: `Your primary language is **${lang}**${extra}.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }
        
        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);
        
        return {
          value: lang,
          message: `Your primary language is **${lang}**${extra}.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: LANGUAGE_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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

        // Try to match against Panopticlick platform data
        const lookup = lookupMarketShare(PLATFORM_DATA, platform);

        // If no match found, fall back to baseline entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.platform;
          return {
            value: platform,
            message: `Your platform reports as **${platform}**.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);

        return {
          value: platform,
          message: `Your platform reports as **${platform}**.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: PLATFORM_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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

        // Look up browser market share from Panopticlick data
        const browserName = parsed.browser.split(' ')[0]; // Get just "Chrome", "Firefox", etc.
        const lookup = lookupMarketShare(BROWSER_DATA, browserName);

        // If browser not in lookup, fall back to baseline user agent entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.userAgent;
          return {
            value: ua,
            message: `You're running **${parsed.browser}** on **${parsed.os}**.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);

        return {
          value: ua,
          message: `You're running **${parsed.browser}** on **${parsed.os}**.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: BROWSER_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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
        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);
        
        return {
          value: dnt,
          message: `Your Do Not Track setting is **${status}**.` + (irony ? ' ' + irony : ''),
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: DNT_DATA.sourceLabel,
            estimated: lookup.estimated,
            entropy: entropy,
            oneInX: oneInX
          }
        };
      }
    },
    
    // TIER 2: Good Compatibility
    
    cpuCores: {
      name: 'CPU Cores',
      difficulty: 'hard',
      changeRequires: 'Different device',
      run: function() {
        const cores = navigator.hardwareConcurrency;
        if (!cores) return null;

        const lookup = lookupMarketShare(CPU_CORES_DATA, String(cores));

        // If core count not in lookup, fall back to baseline entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.cpuCores;
          return {
            value: cores,
            message: `Your device has **${cores} CPU cores**.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);

        return {
          value: cores,
          message: `Your device has **${cores} CPU cores**.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: CPU_CORES_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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

        // If memory size not in lookup, fall back to baseline entropy
        if (lookup.estimated) {
          const baseline = BASELINE_ENTROPY.deviceMemory;
          return {
            value: mem,
            message: `Your device reports **${mem}GB of RAM**.`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
              note: baseline.note
            }
          };
        }

        const entropy = percentToEntropy(lookup.percent);
        const oneInX = percentToOneInX(lookup.percent);

        return {
          value: mem,
          message: `Your device reports **${mem}GB of RAM**.`,
          lookup: {
            percent: lookup.percent,
            source: lookup.source,
            sourceLabel: DEVICE_MEMORY_DATA.sourceLabel,
            estimated: false,
            entropy: entropy,
            oneInX: oneInX
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
        let desc;
        if (points === 0) {
          desc = 'no touch support (desktop)';
        } else if (points <= 2) {
          desc = 'basic touch support';
        } else {
          desc = `multi-touch support (${points} points)`;
        }
        
        const baseline = BASELINE_ENTROPY.touchSupport;
        
        return {
          value: points,
          message: `Your device has **${desc}**.`,
          lookup: {
            percent: null,
            source: baseline.source,
            sourceLabel: baseline.sourceLabel,
            estimated: true,
            entropy: baseline.bits,
            oneInX: Math.pow(2, baseline.bits),
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
            percent: null,
            source: baseline.source,
            sourceLabel: baseline.sourceLabel,
            estimated: true,
            entropy: baseline.bits,
            oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },
    
    // =========================================================================
    // TIER 3: FINGERPRINTING TECHNIQUES
    // =========================================================================
    // These are the more advanced fingerprinting methods. They exploit the fact
    // that different browsers/hardware render graphics and process audio in
    // slightly different ways - even when given identical input!

    /**
     * Canvas Fingerprint Test
     * -----------------------
     * This is one of the most powerful fingerprinting techniques!
     *
     * HOW IT WORKS:
     * 1. Create an invisible canvas element
     * 2. Draw shapes, text, and colors on it
     * 3. Read back the pixel data
     * 4. Hash the data to create a fingerprint
     *
     * WHY DOES IT WORK?
     * Even though the same shapes are drawn on every browser, tiny differences
     * in how the graphics are rendered create unique results:
     * - Different GPUs process anti-aliasing differently
     * - Different operating systems have different default fonts
     * - Different browser versions have different rendering engines
     * - Even floating-point math can vary between systems!
     *
     * The "Cwm fjordbank glyphs vext quiz" text is a pangram that uses
     * every letter of the alphabet, ensuring all character rendering is tested.
     *
     * RESEARCH SHOWS:
     * Canvas fingerprints alone can identify you with 8+ bits of entropy
     * (1 in 260+ people), making this one of the most identifying tests.
     */
    canvas: {
      name: 'Canvas Fingerprint',
      difficulty: 'hard',
      changeRequires: 'Different browser/GPU, or disable via extension',
      run: function() {
        try {
          // Create an off-screen canvas (invisible to the user)
          const canvas = document.createElement('canvas');
          canvas.width = 280;
          canvas.height = 60;

          // Get the 2D drawing context - this is how to draw on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;  // Some browsers might block canvas

          // STEP 1: Draw an orange rectangle as background
          ctx.fillStyle = '#f60';  // Orange color
          ctx.fillRect(125, 1, 62, 20);  // x, y, width, height

          // STEP 2: Draw text with a specific font
          // Text rendering is particularly variable across systems
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#069';  // Blue color
          ctx.font = '14px "Times New Roman"';
          ctx.fillText('Cwm fjordbank glyphs vext quiz', 2, 15);

          // STEP 3: Draw overlapping text with transparency
          // Transparency blending varies between systems
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';  // Semi-transparent green
          ctx.font = '18px Arial';
          ctx.fillText('FOUNDprint test', 4, 45);

          // STEP 4: Draw overlapping circles with multiply blend mode
          // Blend modes reveal differences in color processing
          ctx.globalCompositeOperation = 'multiply';
          const colors = [['#f2f', 40, 40], ['#2ff', 80, 40], ['#ff2', 60, 60]];
          for (const [color, x, y] of colors) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);  // Draw a circle
            ctx.fill();
          }

          // STEP 5: Export the canvas as a data URL and hash it
          // toDataURL() converts the canvas to a base64-encoded PNG
          const dataUrl = canvas.toDataURL();
          const canvasHash = md5(dataUrl);

          const baseline = BASELINE_ENTROPY.canvas;
          return {
            value: dataUrl,
            message: `Your browser renders invisible test shapes in a **unique way** (<code class="foundprint-inline-hash">${canvasHash}</code>).`,
            lookup: {
              percent: null,
              source: baseline.source,
              sourceLabel: baseline.sourceLabel,
              estimated: true,
              entropy: baseline.bits,
              oneInX: Math.pow(2, baseline.bits),
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
            // Fallback to basic renderer info - lower confidence
            const renderer = gl.getParameter(gl.RENDERER);
            return {
              value: renderer,
              message: `Your graphics renderer is **${renderer}**.`,
              lookup: {
                percent: null,
                source: rendererBaseline.source,
                sourceLabel: rendererBaseline.sourceLabel,
                estimated: true,
                entropy: rendererBaseline.bits * 0.5,  // Lower confidence without debug info
                oneInX: Math.pow(2, rendererBaseline.bits * 0.5),
                note: 'Reduced entropy - WebGL debug info not available'
              }
            };
          }
          
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          
          // Clean up renderer string for display
          let cleanRenderer = renderer;
          if (renderer.includes('ANGLE')) {
            const match = renderer.match(/ANGLE \([^,]+, ([^,]+)/);
            if (match) cleanRenderer = match[1].trim();
          }
          
          // Try to look up GPU in the data
          const lookup = lookupMarketShare(GPU_DATA, renderer);
          
          // If found in GPU data, use that; otherwise use baseline
          if (!lookup.estimated) {
            const entropy = percentToEntropy(lookup.percent);
            return {
              value: { vendor, renderer },
              message: `Your graphics card is **${cleanRenderer}**.`,
              lookup: {
                percent: lookup.percent,
                source: lookup.source,
                sourceLabel: GPU_DATA.sourceLabel,
                estimated: false,
                entropy: entropy,
                oneInX: percentToOneInX(lookup.percent),
                note: GPU_DATA.note
              }
            };
          }
          
          // Use baseline from research
          const combinedEntropy = rendererBaseline.bits + vendorBaseline.bits;
          return {
            value: { vendor, renderer },
            message: `Your graphics card is **${cleanRenderer}**.`,
            lookup: {
              percent: null,
              source: rendererBaseline.source,
              sourceLabel: rendererBaseline.sourceLabel,
              estimated: true,
              entropy: combinedEntropy,
              oneInX: Math.pow(2, combinedEntropy),
              note: rendererBaseline.note
            }
          };
        } catch (e) {
          return null;
        }
      }
    },
    
    /**
     * Audio Fingerprint Test
     * ----------------------
     * Creates a unique fingerprint based on how your browser processes audio.
     *
     * HOW IT WORKS:
     * 1. Create an "offline" audio context (doesn't play sound - just calculates)
     * 2. Generate a test signal (triangle wave at 10kHz)
     * 3. Process it through a dynamics compressor (audio effect)
     * 4. Measure the output values
     * 5. Hash the result
     *
     * WHY DOES THIS WORK?
     * Different audio hardware and software stacks process audio slightly
     * differently. The tiny variations in floating-point calculations,
     * sample rate conversions, and filter implementations create a unique
     * signature for each system.
     *
     * TECHNICAL NOTE - ASYNC/AWAIT:
     * This test uses async/await because audio processing happens
     * asynchronously. The "async" keyword before "function()" means this
     * function returns a Promise. The "return new Promise()" pattern wraps
     * the callback-based audio API.
     *
     * WHAT IS AN OFFLINE AUDIO CONTEXT?
     * Normally, AudioContext plays audio through speakers. OfflineAudioContext
     * instead renders audio to a buffer as fast as possible - useful for
     * analysis without making any sound.
     */
    audio: {
      name: 'Audio Fingerprint',
      difficulty: 'hard',
      changeRequires: 'Different browser/audio hardware, or disable via extension',
      run: async function() {
        try {
          // Get the OfflineAudioContext (with webkit prefix for older Safari)
          const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          if (!AudioContext) return null;

          // Create an offline context: 1 channel, 5000 samples, 44.1kHz sample rate
          const context = new AudioContext(1, 5000, 44100);

          // Create an oscillator (sound generator)
          const oscillator = context.createOscillator();
          oscillator.type = 'triangle';       // Triangle wave shape
          oscillator.frequency.value = 10000; // 10kHz frequency

          // Create a dynamics compressor (audio effect)
          // The specific settings create a distinctive processing signature
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -50;   // When to start compressing
          compressor.knee.value = 40;         // How gradual the compression curve is
          compressor.ratio.value = 12;        // Compression ratio
          compressor.attack.value = 0;        // How fast to respond to loud sounds
          compressor.release.value = 0.25;    // How fast to release compression

          // Connect: oscillator → compressor → output
          oscillator.connect(compressor);
          compressor.connect(context.destination);
          oscillator.start(0);

          const baseline = BASELINE_ENTROPY.audio;

          // Return a Promise that resolves when audio rendering is complete
          return new Promise((resolve) => {
            // This callback fires when the offline rendering is done
            context.oncomplete = (event) => {
              // Get the rendered audio data (array of sample values)
              const buffer = event.renderedBuffer.getChannelData(0);

              // Sum the absolute values of the last 500 samples
              // This creates a signature based on how the audio was processed
              let sum = 0;
              for (let i = 4500; i < 5000; i++) {
                sum += Math.abs(buffer[i]);
              }
              oscillator.disconnect();

              // Round to 4 decimal places to avoid tiny floating-point differences
              const signature = Math.round(sum * 10000) / 10000;
              const audioHash = md5(String(signature));

              resolve({
                value: signature,
                message: `Your audio hardware processes sound with a **distinct signature** (<code class="foundprint-inline-hash">${audioHash}</code>).`,
                lookup: {
                  percent: null,
                  source: baseline.source,
                  sourceLabel: baseline.sourceLabel,
                  estimated: true,
                  entropy: baseline.bits,
                  oneInX: Math.pow(2, baseline.bits),
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
        
        // Pick interesting fonts to highlight
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
            percent: null,
            source: baseline.source,
            sourceLabel: baseline.sourceLabel,
            estimated: true,
            entropy: baseline.bits,
            oneInX: Math.pow(2, baseline.bits),
            note: baseline.note
          }
        };
      }
    },
    
    // TIER 4: Behavioral
    
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
            const entropy = percentToEntropy(lookup.percent);
            const oneInX = percentToOneInX(lookup.percent);
            
            if (blocked) {
              resolve({
                value: true,
                message: `You have an **ad blocker installed**. About 42% of users do.`,
                lookup: {
                  percent: lookup.percent,
                  source: AD_BLOCKER_DATA.source,
                  sourceLabel: AD_BLOCKER_DATA.sourceLabel,
                  estimated: false,
                  entropy: entropy,
                  oneInX: oneInX
                }
              });
            } else {
              resolve({
                value: false,
                message: `You **don't have an ad blocker**. About 58% of users don't either.`,
                lookup: {
                  percent: lookup.percent,
                  source: AD_BLOCKER_DATA.source,
                  sourceLabel: AD_BLOCKER_DATA.sourceLabel,
                  estimated: false,
                  entropy: entropy,
                  oneInX: oneInX
                }
              });
            }
          }, 100);
        });
      }
    }
  };

  // ============================================================================
  // SECTION 7: UI RENDERING
  // ============================================================================
  //
  // This section handles all the visual aspects of FOUNDprint - creating the
  // HTML structure, animating text reveals, and displaying results.
  //
  // KEY CONCEPTS IN THIS SECTION:
  // - Template Literals: The `backtick strings` that allow embedding ${variables}
  // - DOM Manipulation: Creating and modifying HTML elements with JavaScript
  // - CSS Classes: Adding/removing classes to trigger CSS animations
  // - Async Animation: Using async/await to sequence visual effects
  //
  // FUNCTIONS IN THIS SECTION:
  // - createUI(): Builds the initial HTML structure
  // - typewriterReveal(): Animates text appearing character by character
  // - formatBold(): Converts **markdown** to <strong>HTML</strong>
  // - addResultLine(): Shows each test result with animation
  // - showFinalReveal(): Displays the dramatic final results
  // - showEndState(): Shows the "Run Again" button and summary

  /**
   * createUI - Build the initial HTML structure
   * -------------------------------------------
   * This function creates all the HTML elements for FOUNDprint by setting
   * the innerHTML of the container element.
   *
   * TEMPLATE LITERALS (backtick strings):
   * Using `backticks` instead of "quotes" allows template literals which support:
   * - Multi-line strings (no need for string concatenation)
   * - Embedded expressions with ${variable} syntax
   *
   * Example: `Hello, ${name}!` inserts the value of 'name' into the string
   *
   * @param {HTMLElement} container - The DOM element to render into
   */
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
        <p><a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">View on GitHub</a> · <a href="${CONFIG.githubUrl}/blob/main/METHODOLOGY.md" target="_blank" rel="noopener">Methodology</a></p>
        <p class="foundprint-footer-privacy">No data is stored or recorded. <a href="${CONFIG.githubUrl}" target="_blank" rel="noopener">Vet the code yourself</a> to confirm.</p>
      </div>
    `;
  }

  /**
   * typewriterReveal - Animate text appearing character by character
   * -----------------------------------------------------------------
   * Creates a "typewriter" effect where text appears one character at a time,
   * like someone is typing it. This adds drama and lets users read along.
   *
   * HOW IT WORKS:
   * 1. Split the text into parts (regular text and bold sections)
   * 2. Loop through each character
   * 3. Add the character to the display
   * 4. Wait a few milliseconds
   * 5. Repeat until all text is shown
   *
   * REGEX NOTE:
   * The split pattern (see function body) separates text into normal and
   * bold segments. The capture group keeps bold markers in the result array
   * so they can be processed differently. The "g" flag finds all matches.
   *
   * @param {HTMLElement} element - The element to type text into
   * @param {string} html - The text to reveal (may contain bold markers)
   * @param {number} speed - Milliseconds per character (0 = instant)
   */
  async function typewriterReveal(element, html, speed) {
    // Speed of 0 means instant reveal - skip the animation
    if (speed === 0) {
      element.innerHTML = html;
      return;
    }

    // Split text into parts: regular text and **bold** sections
    // The regex captures **text** so it stays in the array
    const parts = html.split(/(\*\*[^*]+\*\*)/g);
    let fullText = '';

    // Process each part
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is a bold section - remove the ** markers for processing
        const text = part.slice(2, -2);  // slice(2, -2) removes first 2 and last 2 chars
        for (const char of text) {
          fullText += char;
          element.innerHTML = formatBold(fullText);
          await sleep(speed);  // Pause between characters
        }
      } else {
        // Regular text
        for (const char of part) {
          fullText += char;
          element.innerHTML = formatBold(fullText);
          await sleep(speed);
        }
      }
    }
  }

  /**
   * formatBold - Convert markdown bold to HTML
   * ------------------------------------------
   * Transforms double-asterisk bold markers into HTML strong tags.
   * Example: "some **bold** text" becomes "some <strong>bold</strong> text"
   *
   * REGEX BREAKDOWN (see pattern in function body):
   * The pattern matches double-asterisks, captures the text between them,
   * and replaces the whole match with strong tags around the captured text.
   * The "g" flag means replace all occurrences, not just the first.
   *
   * @param {string} text - Text containing markdown-style bold markers
   * @returns {string} - Text with HTML strong tags
   */
  function formatBold(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /**
   * addResultLine - Display a test result with animation
   * -----------------------------------------------------
   * Creates a result line showing:
   * 1. The finding (e.g., "Your screen resolution is 1920x1080")
   * 2. Per-test uniqueness (e.g., "1 in 4 people share this")
   * 3. Cumulative uniqueness (e.g., "You are now 1 in 10,000")
   *
   * DOM CREATION PATTERN:
   * Instead of innerHTML, createElement() is used for each element.
   * This is more verbose but gives references to elements that need
   * manipulation later (like adding content after animation).
   *
   * ANIMATION TECHNIQUE:
   * Elements are added without the 'visible' class, then the class is added
   * on the next animation frame. This triggers CSS transitions for
   * a smooth fade-in effect.
   *
   * @param {HTMLElement} container - Where to add the result line
   * @param {string} message - The finding to display
   * @param {number} testEntropy - Entropy bits for this test
   * @param {number} oneInX - "1 in X" value for this test
   * @param {string} sourceUrl - URL for the data source
   * @param {boolean} isEstimated - Whether the value is estimated
   * @param {number} totalEntropy - Cumulative entropy so far
   * @param {boolean} isFirstTest - Is this the first test result?
   * @param {boolean} wasAlreadyUnique - Did user already reach uniqueness?
   * @returns {boolean} - Whether user is now statistically unique
   */
  async function addResultLine(container, message, testEntropy, oneInX, sourceUrl, isEstimated, totalEntropy, isFirstTest = false, wasAlreadyUnique = false) {
    // Create the container for this result line
    const line = document.createElement('div');
    line.className = 'foundprint-line';

    // Create element for the main finding text
    const content = document.createElement('div');
    content.className = 'foundprint-content';
    line.appendChild(content);  // Add as child of line

    // Create element for per-test uniqueness info
    const testUnique = document.createElement('div');
    testUnique.className = 'foundprint-test-unique';
    line.appendChild(testUnique);

    // Create element for cumulative uniqueness
    const count = document.createElement('div');
    count.className = 'foundprint-count';
    line.appendChild(count);

    // Add the line to the results container
    container.appendChild(line);

    // ANIMATION TRICK: requestAnimationFrame
    // Adding 'visible' class on the next frame triggers CSS transitions.
    // Adding it immediately would skip the transition (no "before" state).
    requestAnimationFrame(() => {
      line.classList.add('visible');
    });

    // Reveal the message with typewriter effect
    await typewriterReveal(content, message, CONFIG.typewriterSpeed);

    // Format the oneInX value for display
    const testFormatted = formatNumber(oneInX);
    const bitsText = `${testEntropy.toFixed(1)} bits`;

    // Build the uniqueness line with source link and/or estimated tag
    let uniquenessHtml;
    if (sourceUrl && !isEstimated) {
      // Has verified source - make it a link
      uniquenessHtml = `You share this with <a href="${sourceUrl}" target="_blank" rel="noopener">1 in ${testFormatted.text}</a> people (${bitsText}).`;
    } else if (sourceUrl && isEstimated) {
      // Has source but value is estimated (not in dataset)
      uniquenessHtml = `You share this with 1 in ${testFormatted.text} people (${bitsText}, <a href="${sourceUrl}" target="_blank" rel="noopener">estimated</a>).`;
    } else {
      // No source - fully estimated
      uniquenessHtml = `You share this with 1 in ${testFormatted.text} people (${bitsText}, estimated).`;
    }
    testUnique.innerHTML = uniquenessHtml;
    
    // Calculate and show cumulative uniqueness
    const totalUniqueness = entropyToUniqueness(totalEntropy);
    const totalFormatted = formatNumber(totalUniqueness);
    
    if (totalFormatted.isUnique && !wasAlreadyUnique) {
      // First time crossing the threshold - this is the moment they become globally unique
      count.innerHTML = `<strong>You are now statistically unique among all 8 billion humans on Earth</strong> (1 in ${totalFormatted.text}).`;
      count.classList.add('foundprint-unique');
    } else if (totalFormatted.isUnique) {
      // Already unique from a previous test - red line with border, no bold
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

  /**
   * Show the final reveal
   */
  async function showFinalReveal(container, successfulTests, totalEntropy, fingerprintHash) {
    await sleep(CONFIG.dramaticPause);

    const uniqueness = entropyToUniqueness(totalEntropy);
    const formatted = formatNumber(uniqueness);

    let uniquenessHtml;
    if (formatted.isUnique) {
      uniquenessHtml = `<p class="foundprint-uniqueness"><strong>You are unique.</strong></p>`;
    } else {
      uniquenessHtml = `<p class="foundprint-uniqueness">You are <strong>1 in ${formatted.text}</strong>.</p>`;
    }

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

  /**
   * Show the end state with spoofability report
   */
  function showEndState(container, successfulTests, failedTests, completedTests) {
    let failedHtml = '';
    if (failedTests.length > 0) {
      failedHtml = `<p class="foundprint-failed">Unable to detect: ${failedTests.join(', ')}.</p>`;
    }

    // Group tests by difficulty
    const easyTests = completedTests.filter(t => t.difficulty === 'easy');
    const mediumTests = completedTests.filter(t => t.difficulty === 'medium');
    const hardTests = completedTests.filter(t => t.difficulty === 'hard');

    // Calculate entropy totals per category
    const sumEntropy = (tests) => tests.reduce((sum, t) => sum + (t.entropy || 0), 0);
    const totalEntropy = sumEntropy(completedTests);
    const easyEntropy = sumEntropy(easyTests);
    const mediumEntropy = sumEntropy(mediumTests);
    const hardEntropy = sumEntropy(hardTests);

    // Calculate potential uniqueness if categories were changed
    const calcPotentialOneInX = (removedEntropy) => {
      const remainingEntropy = totalEntropy - removedEntropy;
      const uniqueness = Math.pow(2, remainingEntropy);
      return formatNumber(Math.min(uniqueness, WORLD_POPULATION));
    };

    const easyPotential = calcPotentialOneInX(easyEntropy);
    const easyMediumPotential = calcPotentialOneInX(easyEntropy + mediumEntropy);

    // Calculate uniqueness from just Hard attributes alone
    const hardOnlyUniqueness = Math.pow(2, hardEntropy);
    const hardOnlyFormatted = formatNumber(Math.min(hardOnlyUniqueness, WORLD_POPULATION));

    // Build the table rows with difficulty badges
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

  // ============================================================================
  // SECTION 8: MAIN EXECUTION
  // ============================================================================
  //
  // This section contains the main orchestration logic that:
  // 1. Runs all fingerprinting tests in sequence
  // 2. Accumulates entropy from each test
  // 3. Updates the UI with results
  // 4. Shows the final fingerprint
  //
  // THE EXPERIMENT FLOW:
  // User clicks "Start" → runExperiment() runs → Each test executes one by one
  // → Results appear with animations → Final fingerprint is revealed
  //
  // KEY PROGRAMMING PATTERNS:
  // - Async/await for sequential async operations
  // - Try/catch for graceful error handling
  // - Accumulator pattern (totalEntropy keeps adding up)
  // - Data-driven design (testOrder array controls which tests run)

  /**
   * runExperiment - The main function that runs all fingerprinting tests
   * ---------------------------------------------------------------------
   * This is the heart of FOUNDprint! It coordinates running all tests,
   * collecting results, and updating the display.
   *
   * ASYNC FUNCTION EXPLANATION:
   * The "async" keyword means this function can use "await" to pause
   * execution while waiting for asynchronous operations (like animations
   * or tests that take time). This makes the code read like synchronous
   * code while still being non-blocking.
   *
   * HOW THE LOOP WORKS:
   * The code iterates through testOrder array, running each test and accumulating
   * entropy. If a test fails (returns null), it's skipped and the failure is noted.
   * This graceful degradation means the experiment continues even if some
   * browser features aren't available.
   */
  async function runExperiment() {
    // Get references to DOM elements that will be manipulated
    // document.getElementById() finds elements by their id attribute
    const disclaimer = document.getElementById('foundprint-disclaimer');
    const resultsContainer = document.getElementById('foundprint-results');
    const finalContainer = document.getElementById('foundprint-final');
    const endContainer = document.getElementById('foundprint-end');

    // ANIMATION: Fade out the disclaimer/start screen
    disclaimer.classList.add('fade-out');  // CSS class triggers fade animation
    await sleep(300);                       // Wait for animation to complete
    disclaimer.style.display = 'none';      // Hide it completely
    resultsContainer.style.display = 'block'; // Show results container

    // ACCUMULATORS: Variables that collect data as tests run
    let totalEntropy = 0;           // Sum of all entropy bits
    let successfulTests = 0;        // Count of tests that worked
    const failedTests = [];         // Names of tests that failed
    const fingerprintValues = [];   // Raw values for the final hash
    let alreadyUnique = false;      // Track if the uniqueness threshold is crossed
    const completedTests = [];      // Track test metadata for final report

    // TEST ORDER: Which tests to run and in what sequence
    // Simpler tests run first, building up to more complex ones
    // This creates a nice narrative as uniqueness grows
    const testOrder = [
      'screenResolution',
      'pixelRatio',
      'timezone',
      'language',
      'userAgent',
      'platform',
      'doNotTrack',
      'cpuCores',
      'deviceMemory',
      'touchSupport',
      'adBlocker',
      'connectionType',
      'webgl',
      'fonts',
      'canvas',
      'audio'
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
        
        // Get entropy config - handle special cases
        let entropyBits;
        let sourceUrl;
        let isEstimated = false;
        
        // Priority: result.lookup.entropy > result.entropy > BASELINE_ENTROPY > fallback
        if (result.lookup && result.lookup.entropy !== undefined) {
          // Test returned a lookup with calculated entropy
          entropyBits = result.lookup.entropy;
          sourceUrl = result.lookup.source;
          isEstimated = result.lookup.estimated || false;
        } else if (result.entropy !== undefined) {
          // Test returned entropy directly
          entropyBits = result.entropy;
          sourceUrl = null;
        } else if (testName === 'webgl') {
          // WebGL combines renderer + vendor entropy
          entropyBits = BASELINE_ENTROPY.webglRenderer.bits + BASELINE_ENTROPY.webglVendor.bits;
          sourceUrl = BASELINE_ENTROPY.webglRenderer.source;
          isEstimated = true;
        } else if (BASELINE_ENTROPY[testName]) {
          // Use baseline entropy from research
          const entropyConfig = BASELINE_ENTROPY[testName];
          entropyBits = entropyConfig.bits;
          sourceUrl = entropyConfig.source;
          isEstimated = true;
        } else {
          // Fallback for tests without explicit entropy config
          // This should not be reached if all tests are properly configured
          console.warn(`FOUNDprint: No entropy config for test "${testName}". Using conservative fallback.`);
          entropyBits = 1.0;  // Conservative fallback (low entropy = less fingerprinting impact)
          sourceUrl = null;
          isEstimated = true;
        }
        
        totalEntropy += entropyBits;
        successfulTests++;
        fingerprintValues.push(result.value);

        // Track test metadata for final report
        completedTests.push({
          name: test.name,
          difficulty: test.difficulty,
          changeRequires: test.changeRequires,
          entropy: entropyBits
        });

        // Get oneInX from lookup if available, otherwise calculate from entropy
        const oneInX = (result.lookup && result.lookup.oneInX) 
          ? result.lookup.oneInX 
          : entropyToUniqueness(entropyBits);
        
        const isUnique = await addResultLine(
          resultsContainer,
          result.message,
          entropyBits,
          oneInX,
          sourceUrl,
          isEstimated,
          totalEntropy,
          successfulTests === 1,  // isFirstTest
          alreadyUnique           // wasAlreadyUnique
        );
        
        // Track if user became unique
        if (isUnique && !alreadyUnique) {
          alreadyUnique = true;
        }
        
      } catch (e) {
        failedTests.push(test.name);
        console.warn(`FOUNDprint: ${test.name} failed:`, e);
      }
    }
    
    // Show final reveal
    const fingerprintHash = generateFingerprintHash(fingerprintValues);
    await showFinalReveal(finalContainer, successfulTests, totalEntropy, fingerprintHash);
    
    // Wait then show end state
    await sleep(800);
    showEndState(endContainer, successfulTests, failedTests, completedTests);
  }

  /**
   * init - Initialize FOUNDprint when the page is ready
   * -----------------------------------------------------
   * Sets up the UI and attaches event listeners. This function runs
   * automatically when the DOM is ready.
   *
   * DEFENSIVE PROGRAMMING:
   * The code checks if the container element exists before proceeding.
   * This prevents errors if someone forgets to add the container
   * element to their HTML, and provides a helpful error message.
   *
   * EVENT LISTENER PATTERN:
   * addEventListener('click', callback) sets up a function to run
   * when the element is clicked. The arrow function () => { ... }
   * is shorthand for function() { ... }.
   */
  function init() {
    // Find the container element where FOUNDprint should render
    const container = document.getElementById('foundprint-demo');

    // Defensive check - make sure the container exists
    if (!container) {
      console.error('FOUNDprint: Container #foundprint-demo not found');
      return;  // Exit early if no container
    }

    // Build the initial UI (buttons, disclaimers, etc.)
    createUI(container);

    // Set up the "Start" button to run the experiment when clicked
    document.getElementById('foundprint-start').addEventListener('click', () => {
      runExperiment();  // This runs all the fingerprinting tests
    });
  }

  // ============================================================================
  // INITIALIZATION: Run init() when the DOM is ready
  // ============================================================================
  //
  // WHAT IS THE DOM?
  // The DOM (Document Object Model) is JavaScript's representation of the HTML
  // page. Before elements can be manipulated, the browser must finish building
  // the DOM from the HTML.
  //
  // WHY CHECK readyState?
  // If the script loads BEFORE the HTML is fully parsed, it must wait.
  // If it loads AFTER (or with 'defer'), the DOM is already ready.
  //
  // document.readyState values:
  // - 'loading': The document is still loading
  // - 'interactive': The DOM is ready, but images/etc may still be loading
  // - 'complete': Everything is fully loaded
  //
  // This pattern ensures init() runs at the right time regardless of when
  // the script loads.

  if (document.readyState === 'loading') {
    // DOM is still loading - wait for it to be ready
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready - run init immediately
    init();
  }

// End of IIFE - the })(); closes the (function() { at the start
})();
