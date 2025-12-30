# FOUNDprint

**Fingerprint Output Using Non-IP Detection**

An interactive browser fingerprinting demonstration originally created as a solo educational project. FOUNDprint reveals how identifiable your browser is—without ever looking at your IP address.

> **Project Repository:** https://github.com/mrchrisneal/foundprint
> 
> **Live Demo:** https://neal.media/foundprint/
> 
> **Blog Post:** https://chris.neal.media/2025/the-vpn-trap/
> 
> **Contact:** chris@neal.media

## What Is This?

FOUNDprint is an educational demonstration that shows how websites can uniquely identify your browser using "fingerprinting" techniques. Unlike cookies or IP addresses, browser fingerprinting collects characteristics about your device—screen resolution, installed fonts, graphics card, timezone, and more—to create a unique identifier.

The goal is to help readers understand that hiding their IP address (via VPN or proxy) does almost nothing when their browser freely announces dozens of identifying characteristics.

## How It Works

When you click "Start," FOUNDprint runs 16 detection tests in sequence:

| Test              | What It Detects                                |
|-------------------|------------------------------------------------|
| Screen Resolution | Physical pixel dimensions of your display      |
| Pixel Ratio       | Display density (1x standard, 2x Retina/HiDPI) |
| Timezone          | Your local timezone (e.g., America/New_York)   |
| Language          | Primary language preference                    |
| Browser/OS        | Browser type and operating system              |
| Platform          | Hardware platform (Win32, MacIntel, etc.)      |
| Do Not Track      | Whether DNT is enabled, disabled, or not set   |
| CPU Cores         | Number of logical processor cores              |
| Device Memory     | Reported RAM in GB                             |
| Touch Support     | Touch screen capability                        |
| Ad Blocker        | Whether an ad blocker is detected              |
| Connection Type   | Network connection speed class                 |
| WebGL             | Graphics card vendor and renderer              |
| Fonts             | Which fonts are installed on your system       |
| Canvas            | How your browser renders invisible shapes      |
| Audio             | How your audio hardware processes sound        |

Each test reveals a finding along with its "entropy" value (measured in bits) and source citation. The running calculation shows your cumulative uniqueness, demonstrating how quickly you become identifiable as tests accumulate.

When your combined entropy exceeds the world population (8.3 billion), you are considered "statistically unique among all humans on Earth."

## Privacy Statement

**FOUNDprint processes all data entirely in your browser.**

- No data is transmitted to any server
- No cookies are created or read
- No localStorage or sessionStorage is used
- No network requests are made
- Nothing is stored, saved, or logged
- The page can run completely offline

This is a demonstration tool, not a tracking tool. For the curious (or the untrusting), you can examine the code yourself in its entirety. All code is very thoroughly documented.

## Assumptions

This experiment assumes **one browser = one person**. In reality, people use multiple browsers and devices, but for demonstration purposes each browser instance is treated as a unique individual.

## Live Demo

**Try it now:** https://neal.media/foundprint/

Or open `index.html` locally in any browser.

## Embedding in Your Site

FOUNDprint is designed to be embedded in any HTML page. Files are served via the jsDelivr CDN.

### Recommended: Pinned Version with SRI

Get the latest embed code with version-pinned URLs and [SRI integrity hashes](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) from the **[Releases page](https://github.com/mrchrisneal/foundprint/releases/latest)**.

### Alternative: Auto-Updating (No SRI)

Use the `@1` tag to always get the latest 1.x version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mrchrisneal/foundprint@1/foundprint.css">
<div id="foundprint-demo"></div>
<script src="https://cdn.jsdelivr.net/gh/mrchrisneal/foundprint@1/foundprint.js"></script>
```

The script automatically finds `#foundprint-demo` and injects all necessary HTML.

### Self-Hosting

You can also download and host the files yourself:
- [`foundprint.js`](https://github.com/mrchrisneal/foundprint/blob/main/foundprint.js)
- [`foundprint.css`](https://github.com/mrchrisneal/foundprint/blob/main/foundprint.css)

## Configuration

Customize behavior by editing the `CONFIG` object at the top of `foundprint.js`:

```javascript
const CONFIG = {
  version: '1.1.3',
  revealDelay: 400,        // ms between each line reveal
  typewriterSpeed: 15,     // ms per character (0 = instant)
  dramaticPause: 1200,     // ms before final reveal
  githubUrl: 'https://github.com/mrchrisneal/foundprint',
  authorUrl: 'https://neal.media/'
};
```

## Data Sources

All entropy values are sourced from peer-reviewed academic research and the Panopticlick project. Each "1 in X" value displayed in the demo is a clickable link to the exact source.

### Primary Sources

| Source              | Year | Sample Size | Link                                                                 |
|---------------------|------|-------------|----------------------------------------------------------------------|
| Panopticlick        | 2010 | 470,161     | [PDF](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf) |
| AmIUnique           | 2016 | 118,934     | [PDF](https://hal.inria.fr/hal-01285470/document)                    |
| Hiding in the Crowd | 2018 | 2,067,942   | [PDF](https://hal.inria.fr/hal-01718234v2/document)                  |

### Panopticlick Valuation Engine

Population statistics for lookups come from:
- [entropy.ts](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts) — Screen, pixel ratio, timezone, language, platform, CPU, memory
- [comparison.ts](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts) — Browser market share, privacy tools

For complete methodology including all entropy values and their sources, see [METHODOLOGY.md](https://github.com/mrchrisneal/foundprint/blob/main/METHODOLOGY.md).

## Browser Compatibility

| Browser | Desktop | Mobile  | Notes                                                             |
|---------|---------|---------|-------------------------------------------------------------------|
| Chrome  | Full    | Full    | All features supported                                            |
| Firefox | Full    | Full    | deviceMemory unavailable                                          |
| Safari  | Full    | Full    | deviceMemory unavailable; may inject canvas noise in Private mode |
| Edge    | Full    | Full    | All features supported                                            |
| Brave   | Partial | Partial | Some values may be obfuscated by Shields                          |

### Graceful Degradation

Tests that fail on certain browsers are handled gracefully:
- `deviceMemory` — Chrome/Edge only
- `connectionType` — Chrome only
- `WebGL debug info` — May be blocked in privacy-focused browsers
- `Audio fingerprint` — May fail if Web Audio API is restricted

Failed tests are listed at the end of the experiment.

## Technical Details

### Zero Dependencies

FOUNDprint is vanilla JavaScript with no external dependencies. This is intentional:
- Avoids ad blocker filter lists that flag fingerprinting libraries
- Ensures maximum browser compatibility
- Keeps the codebase fully auditable

### Third-Party Code

The MD5 hash function is based on [blueimp/JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) (MIT License) by Sebastian Tschan.

### World Population Cap

To prevent absurd uniqueness claims, calculations are capped at about 8.3 billion (world population). If combined entropy exceeds this threshold, the user is shown a special message indicating they are "statistically unique among all 8 billion humans on Earth."

## Files

| File                                                                                   | Description                                   |
|----------------------------------------------------------------------------------------|-----------------------------------------------|
| [`index.html`](https://github.com/mrchrisneal/foundprint/blob/main/index.html)         | Demo page                                     |
| [`foundprint.js`](https://github.com/mrchrisneal/foundprint/blob/main/foundprint.js)   | Main application (all logic, data, and tests) |
| [`foundprint.css`](https://github.com/mrchrisneal/foundprint/blob/main/foundprint.css) | Styles                                        |
| [`README.md`](https://github.com/mrchrisneal/foundprint/blob/main/README.md)           | This file                                     |
| [`METHODOLOGY.md`](https://github.com/mrchrisneal/foundprint/blob/main/METHODOLOGY.md) | Detailed explanation of entropy calculations  |

## Further Reading

- [EFF Cover Your Tracks](https://coveryourtracks.eff.org/) — Test your own browser's fingerprint
- [AmIUnique](https://amiunique.org/) — Another fingerprinting demonstration
- [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) — Open source fingerprinting library (MIT)
- [Privacy Badger](https://privacybadger.org/) — Browser extension to block trackers

## License

**GNU Affero General Public License v3.0 (AGPL-3.0)**

Copyright (c) 2025 Chris Neal

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

### Third-Party Licenses

- **MD5 function**: Based on [blueimp/JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) by Sebastian Tschan, licensed under the [MIT License](https://opensource.org/licenses/MIT).
