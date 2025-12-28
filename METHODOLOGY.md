# FOUNDprint Methodology

**A plain-language guide to how FOUNDprint calculates your browser's uniqueness**

> **Project Repository:** https://github.com/mrchrisneal/foundprint
> **This File:** https://github.com/mrchrisneal/foundprint/blob/main/METHODOLOGY.md
> **Contact:** chris@neal.media

This document explains everything about how FOUNDprint works—from the basic concepts to the specific numbers. Whether you're a curious beginner or a technical expert, you'll find what you need here.

---

## Table of Contents

1. [What is Browser Fingerprinting?](#1-what-is-browser-fingerprinting)
2. [The Big Picture: How FOUNDprint Works](#2-the-big-picture-how-foundprint-works)
3. [Understanding Probability](#3-understanding-probability)
4. [Understanding Entropy](#4-understanding-entropy)
5. [The Math: From Market Share to Uniqueness](#5-the-math-from-market-share-to-uniqueness)
6. [Where the Data Comes From](#6-where-the-data-comes-from)
7. [Lookup Tables: What FOUNDprint Detects](#7-lookup-tables-what-foundprint-detects)
8. [Baseline Entropy: When Lookup Isn't Available](#8-baseline-entropy-when-lookup-isnt-available)
9. [Combining Everything: The Independence Assumption](#9-combining-everything-the-independence-assumption)
10. [Limitations and Disclaimers](#10-limitations-and-disclaimers)
11. [Verify It Yourself](#11-verify-it-yourself)
12. [Data Freshness](#12-data-freshness)
13. [Glossary](#13-glossary)

---

## 1. What is Browser Fingerprinting?

Imagine you're at a party with 1,000 people. Everyone's wearing a name tag, but the name tags are blank—nobody wrote their name. Now imagine someone asks you to find a specific person without knowing their name. Sounds impossible, right?

But what if you knew these details about them:
- They're wearing red shoes
- They have a blue watch
- They're about 5'8" tall
- They're left-handed
- They have a small scar above their left eyebrow

Suddenly, finding them becomes much easier. Even though none of these details is their "name," the *combination* of all these small details might describe only one person at the entire party.

**Browser fingerprinting works the same way.**

Your browser reveals dozens of small details about your computer:
- Your screen resolution
- What fonts you have installed
- Your timezone
- Your graphics card
- And many more...

None of these details alone identifies you. But combine them all together, and you might be the *only person on Earth* with that exact combination.

> [!NOTE]
> **This is different from tracking cookies.** Cookies are like name tags that websites stick on you. Fingerprinting doesn't need to stick anything on you—it just reads the details you're already broadcasting.

### Why Does This Matter?

Browser fingerprinting is used by:
- **Advertisers** to track you across websites (even if you delete cookies)
- **Banks and security systems** to detect fraud
- **Websites** to detect bots and scrapers
- **Researchers** to study web privacy

FOUNDprint exists to *show you* how identifiable you are, so you can make informed decisions about your privacy.

---

## 2. The Big Picture: How FOUNDprint Works

Here's what happens when you run FOUNDprint:

```
                    YOUR BROWSER
                         |
                         v
    +--------------------+--------------------+
    |                    |                    |
    v                    v                    v
Screen Resolution    Timezone           Canvas Hash
    1920x1080       America/NY           [unique]
        |               |                    |
        v               v                    v
    "23% of           "12% of         "This hash has
     users have        users are       8.04 bits of
     this"             in this zone"   entropy"
        |               |                    |
        v               v                    v
    2.12 bits    +   3.06 bits    +    8.04 bits   = Combined Entropy
                                                           |
                                                           v
                                            "1 in X people share all these"
```

**The process has three steps:**

1. **Detect** your browser's characteristics
2. **Look up** how common each characteristic is (or use research estimates)
3. **Combine** everything to calculate your overall uniqueness

The magic happens in step 3. When multiple characteristics are combined, the uniqueness multiplies. This is why even "common" traits like using Chrome can contribute to making you unique when combined with everything else.

---

## 3. Understanding Probability

Before diving into entropy (the main concept in fingerprinting), it helps to understand probability. Don't worry—this is simpler than it sounds.

### Probability is Just "How Often"

If you flip a fair coin, it lands heads about 50% of the time. This is expressed as:

> The **probability** of heads is 0.50 (or 50%)

If you roll a six-sided die, any specific number comes up about 16.7% of the time:

> The **probability** of rolling a 4 is 0.167 (or 16.7%, which is 1/6)

### Market Share is Probability

The statement "23% of internet users have a 1920x1080 screen" means:

> If you pick a random person on the internet, there's a 23% probability they have a 1920x1080 screen.

This is exactly the data needed for fingerprinting. FOUNDprint looks up market share percentages for various browser characteristics, and those percentages *are* probabilities.

### The "1 in X" Number

You've probably heard phrases like "1 in 4 people..." or "1 in 100 people...". This is just another way to express probability.

```
If 25% of people have a trait:
    Probability = 25% = 0.25 = 1/4
    "1 in 4 people have this trait"

If 2% of people have a trait:
    Probability = 2% = 0.02 = 1/50
    "1 in 50 people have this trait"
```

**The formula:**

```
"1 in X" = 100 / percentage
```

**Examples:**
- 23% market share → 1 in 4.3 people (100 / 23 = 4.35)
- 3% market share → 1 in 33 people (100 / 3 = 33.3)
- 0.1% market share → 1 in 1,000 people (100 / 0.1 = 1000)

> [!TIP]
> **Quick mental math:** If something has 1% market share, 1 in 100 people have it. If it has 10% market share, 1 in 10 people have it. The rarer something is (lower percentage), the bigger the "1 in X" number.

---

## 4. Understanding Entropy

Now for the key concept: **entropy**. This word comes from physics and information theory, but the idea is intuitive once you see it.

### Entropy Measures "Surprise" or "Uniqueness"

Think about these two questions:

1. "Did the sun rise this morning?" (Answer: Yes, obviously)
2. "Did you win the lottery last night?" (Answer: Almost certainly no)

The first answer tells you *almost nothing*—it's completely predictable. The second answer, if it were "yes," would be *shocking*—extremely surprising information.

**Entropy measures how "surprising" or "informative" an answer is.**

- **Low entropy** = Very predictable, very common, tells you little
- **High entropy** = Unpredictable, rare, tells you a lot

### Entropy is Measured in "Bits"

A "bit" in this context is a unit of information—specifically, the amount of information in a single yes/no answer to a perfectly balanced question.

**1 bit of entropy:** Like flipping a coin (2 equally likely outcomes)
```
Heads or tails? → 1 bit of information
```

**2 bits of entropy:** Like picking one of 4 equally likely things
```
Which card suit? Hearts, Diamonds, Clubs, or Spades → 2 bits
```

**3 bits of entropy:** Like picking one of 8 equally likely things
```
Which day of the work week plus weekend? → ~3 bits
```

See the pattern? The number of equally likely possibilities **doubles** with each additional bit:

| Bits | Number of Possibilities | Example |
|------|------------------------|---------|
| 1    | 2                      | Coin flip |
| 2    | 4                      | Card suit |
| 3    | 8                      | Days of week |
| 4    | 16                     | Hex digit (0-F) |
| 5    | 32                     | Letters + some |
| 10   | 1,024                  | ~1 thousand |
| 20   | 1,048,576              | ~1 million |
| 30   | 1,073,741,824          | ~1 billion |
| 33   | 8,589,934,592          | ~World population |

> [!IMPORTANT]
> **The key insight:** About **33 bits of entropy** is enough to uniquely identify every person on Earth (8 billion people = 2^33).

### Entropy in Fingerprinting

The statement "your screen resolution has 2.12 bits of entropy" means:

> Knowing your screen resolution narrows down who you might be to about 1 in 4 people (2^2.12 ≈ 4.35 people)

Similarly, "your canvas fingerprint has 8.04 bits of entropy" means:

> Knowing your canvas fingerprint narrows down who you might be to about 1 in 262 people (2^8.04 ≈ 262)

And here's the powerful part: **entropy adds up**. Given both:
- Your screen resolution (2.12 bits)
- Your canvas fingerprint (8.04 bits)

Together that's 2.12 + 8.04 = **10.16 bits**, which means about 1 in 1,145 people share *both* traits (2^10.16 ≈ 1,145).

Keep adding more traits, and pretty soon you've got 33+ bits—enough to be unique among all humans.

---

## 5. The Math: From Market Share to Uniqueness

Now let's see the actual formulas FOUNDprint uses. If math makes your eyes glaze over, feel free to skim—the [Glossary](#13-glossary) has quick definitions.

### Step 1: Market Share to Probability

```
probability = market_share_percent / 100
```

**Example:** If 23% of users have 1920x1080 screens:
```
probability = 23 / 100 = 0.23
```

### Step 2: Probability to "1 in X"

```
one_in_x = 1 / probability
         = 100 / market_share_percent
```

**Example:**
```
one_in_x = 100 / 23 = 4.35
"1 in 4.35 people have a 1920x1080 screen"
```

### Step 3: Market Share to Entropy

This is where logarithms come in. Don't panic—here's what's happening:

```
entropy_bits = log2(100 / market_share_percent)
             = log2(one_in_x)
```

**What does log2 mean?**

The logarithm base 2 (log2) asks: "2 raised to *what power* gives me this number?"

```
log2(2) = 1    because 2^1 = 2
log2(4) = 2    because 2^2 = 4
log2(8) = 3    because 2^3 = 8
log2(16) = 4   because 2^4 = 16
```

For non-powers of 2, you get decimal answers:
```
log2(4.35) ≈ 2.12   because 2^2.12 ≈ 4.35
```

**Why use logarithms?**

Because they allow *adding* entropy values instead of *multiplying* probabilities. Adding is much easier for humans to think about.

> [!NOTE]
> **The mathematical reason:** When combining independent events, probabilities multiply but entropies add. This is because log(A × B) = log(A) + log(B). So if two traits each have 3 bits of entropy, together they have 6 bits—much easier than calculating 0.125 × 0.125 = 0.015625.

**Complete Example:**

Let's say 1920x1080 screens have 23% market share:

```
probability      = 23 / 100 = 0.23
one_in_x        = 100 / 23 = 4.35 ("1 in 4.35 people")
entropy_bits    = log2(4.35) = 2.12 bits
```

### Step 4: Entropy to Total Uniqueness

To find out how many people share *all* your characteristics:

1. **Add up** all the entropy values
2. **Calculate** 2^(total_entropy) to get the "1 in X" number

```
total_uniqueness = 2^(total_entropy_bits)
```

**Example:**

| Characteristic | Entropy (bits) |
|----------------|----------------|
| Screen Resolution | 2.12 |
| Timezone | 3.06 |
| Browser | 0.62 |
| Canvas | 8.04 |
| **Total** | **13.84** |

```
total_uniqueness = 2^13.84 = 14,654
"You are 1 in 14,654 people"
```

### The World Population Cap

FOUNDprint uses 8.3 billion as the world population (UN estimate, December 2025). If your combined entropy suggests you're "1 in 50 trillion," the result is capped at world population because you can't be rarer than unique among all humans.

```javascript
// From foundprint.js line 101
const WORLD_POPULATION = 8.3e9;  // 8.3 billion
```

---

## 6. Where the Data Comes From

FOUNDprint doesn't make up numbers. Every value comes from one of two sources:

### Source Type 1: Lookup Tables

For characteristics where an exact value can be matched to a known market share, FOUNDprint uses **lookup tables** from the [Panopticlick project](https://github.com/panopticlick/Panopticlick) by the Electronic Frontier Foundation (EFF).

These tables contain percentages like "23% of users have 1920x1080 screens" or "65% of users use Chrome."

**Panopticlick source files:**

| File | What It Contains |
|------|------------------|
| [entropy.ts](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts) | Screen resolutions, pixel ratios, platforms, timezones, CPU cores, device memory, languages |
| [comparison.ts](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts) | Browser market share, privacy tool adoption (ad blockers, Do Not Track) |

### Source Type 2: Baseline Entropy from Academic Research

For characteristics where FOUNDprint can *detect* something but can't match it to a specific percentage (like your unique canvas fingerprint hash), **baseline entropy values** from peer-reviewed academic studies are used.

**Referenced studies:**

| Study | Year | Sample Size | What They Studied | PDF |
|-------|------|-------------|-------------------|-----|
| Panopticlick | 2010 | 470,161 browsers | First large-scale fingerprinting study | [EFF PDF](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf) |
| AmIUnique | 2016 | 118,934 browsers | Extended Panopticlick with new attributes | [HAL PDF](https://hal.inria.fr/hal-01285470/document) |
| Hiding in the Crowd (HitC) | 2018 | 2,067,942 browsers | Largest study, mobile vs desktop | [HAL PDF](https://hal.inria.fr/hal-01718234v2/document) |

### The Conservative Approach

When multiple studies report different entropy values for the same attribute, **FOUNDprint always uses the lowest value**. This prevents overstating how unique you are.

**Example:** Canvas fingerprint entropy:
- AmIUnique 2016: 8.28 bits
- HitC 2018: 8.04 bits
- **FOUNDprint uses: 8.04 bits** (the lower, more conservative value)

> [!NOTE]
> **Why be conservative?** It's better to slightly *underestimate* your uniqueness than to exaggerate it. If the result shows you're "1 in 1 million" and you're actually "1 in 500,000," that's still a privacy concern. But showing "1 in 10 million" when you're really "1 in 1 million" would be misleading about your actual exposure.

---

## 7. Lookup Tables: What FOUNDprint Detects

These tables show the actual data FOUNDprint uses. Each row shows a specific value, its market share, the calculated "1 in X" number, and the entropy in bits.

### Screen Resolution

Your screen resolution is one of the first things any website can detect. It's not just your monitor's native resolution—it's the actual pixel dimensions your browser reports.

**Source:** [Panopticlick POPULATION_STATS.screenResolutions](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Resolution | Market Share | 1 in X | Entropy (bits) |
|------------|--------------|--------|----------------|
| 1920x1080  | 23%          | 4.3    | 2.12           |
| 1366x768   | 19%          | 5.3    | 2.40           |
| 1536x864   | 8%           | 12.5   | 3.64           |
| 1440x900   | 5%           | 20.0   | 4.32           |
| 1280x720   | 4%           | 25.0   | 4.64           |
| 2560x1440  | 4%           | 25.0   | 4.64           |
| 1600x900   | 3%           | 33.3   | 5.06           |
| 1280x800   | 3%           | 33.3   | 5.06           |
| 3840x2160  | 2%           | 50.0   | 5.64           |

**Fallback:** If your resolution isn't in this list, FOUNDprint uses 4.83 bits (from Panopticlick 2010 research).

> [!TIP]
> **Why 1920x1080 has low entropy:** Because it's the most common resolution! About 1 in 4 people have it, so knowing you have it doesn't narrow down who you are very much. Rare resolutions like 4K (3840x2160) have higher entropy because fewer people have them.

---

### Pixel Ratio

The pixel ratio (also called device pixel ratio or DPR) indicates how many physical pixels your screen uses for each "CSS pixel." High-DPI displays like Apple's Retina screens have a ratio of 2 or higher.

**Source:** [Panopticlick POPULATION_STATS.pixelRatios](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Ratio | Market Share | 1 in X | Entropy (bits) | Typical Devices |
|-------|--------------|--------|----------------|-----------------|
| 1     | 45%          | 2.2    | 1.15           | Most desktop monitors |
| 2     | 30%          | 3.3    | 1.74           | Retina Macs, many phones |
| 1.25  | 10%          | 10.0   | 3.32           | Some Windows laptops |
| 1.5   | 8%           | 12.5   | 3.64           | Some Windows displays |
| 3     | 3%           | 33.3   | 5.06           | High-end phones |
| 2.5   | 2%           | 50.0   | 5.64           | Some Android devices |

**Fallback:** If your ratio isn't listed, FOUNDprint uses 2.0 bits (estimated).

---

### Platform

The "platform" value comes from `navigator.platform` in JavaScript. It identifies your operating system and processor architecture.

**Source:** [Panopticlick POPULATION_STATS.platforms](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Platform     | Market Share | 1 in X | Entropy (bits) | What It Means |
|--------------|--------------|--------|----------------|---------------|
| Win32        | 70%          | 1.4    | 0.51           | Windows (32 or 64-bit, both report "Win32") |
| MacIntel     | 15%          | 6.7    | 2.74           | Intel Mac |
| iPhone       | 5%           | 20.0   | 4.32           | iPhone |
| Android      | 4%           | 25.0   | 4.64           | Android phone/tablet (older browsers) |
| Linux x86_64 | 3%           | 33.3   | 5.06           | Linux on Intel/AMD 64-bit |
| iPad         | 2%           | 50.0   | 5.64           | iPad |

**Fallback:** If your platform isn't listed, FOUNDprint uses 0.56 bits (Panopticlick 2010).

> [!NOTE]
> **Why Windows has such low entropy:** Because nearly everyone uses Windows! When 70% of users share a trait, knowing someone has that trait barely narrows down who they are (1 in 1.4 people = almost everyone).

---

### Browser

FOUNDprint identifies your browser from the User-Agent string and looks up its market share.

**Source:** [Panopticlick POPULATION_DATA.browsers](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts)

| Browser | Market Share | 1 in X | Entropy (bits) |
|---------|--------------|--------|----------------|
| Chrome  | 65%          | 1.5    | 0.62           |
| Safari  | 18%          | 5.6    | 2.47           |
| Edge    | 5%           | 20.0   | 4.32           |
| Firefox | 3%           | 33.3   | 5.06           |
| Opera   | 2%           | 50.0   | 5.64           |

**Fallback:** If your browser isn't listed, FOUNDprint uses 6.32 bits (HitC 2018 user agent entropy).

---

### Timezone

Your timezone is detected using JavaScript's Intl API. It reveals not just your time offset, but your specific IANA timezone name (like "America/New_York").

**Source:** [Panopticlick POPULATION_STATS.timezones](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Timezone            | Market Share | 1 in X | Entropy (bits) |
|---------------------|--------------|--------|----------------|
| America/New_York    | 12%          | 8.3    | 3.06           |
| America/Los_Angeles | 10%          | 10.0   | 3.32           |
| America/Chicago     | 8%           | 12.5   | 3.64           |
| Asia/Shanghai       | 6%           | 16.7   | 4.06           |
| Europe/London       | 5%           | 20.0   | 4.32           |
| Asia/Tokyo          | 4%           | 25.0   | 4.64           |
| Europe/Paris        | 3%           | 33.3   | 5.06           |
| Europe/Berlin       | 3%           | 33.3   | 5.06           |

**Fallback:** If your timezone isn't listed, FOUNDprint uses 3.04 bits (Panopticlick 2010).

> [!WARNING]
> **Note on the HitC 2018 study:** They reported only 0.10 bits for timezone, but their sample was 98% French users (almost all in a single timezone). This biased figure is excluded in favor of Panopticlick's more globally representative 3.04 bits.

---

### Language

Your browser's language setting (from `navigator.language`) indicates your preferred language for web content.

**Source:** [Panopticlick POPULATION_STATS.languages](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Language | Market Share | 1 in X | Entropy (bits) |
|----------|--------------|--------|----------------|
| en-US    | 35%          | 2.9    | 1.51           |
| zh-CN    | 10%          | 10.0   | 3.32           |
| en-GB    | 5%           | 20.0   | 4.32           |
| es       | 5%           | 20.0   | 4.32           |
| de       | 3%           | 33.3   | 5.06           |
| fr       | 3%           | 33.3   | 5.06           |
| ja       | 3%           | 33.3   | 5.06           |

**Fallback:** If your language isn't listed, FOUNDprint uses 2.56 bits (HitC 2018).

---

### CPU Cores

Modern browsers expose how many CPU cores (or threads) your device has through `navigator.hardwareConcurrency`.

**Source:** [Panopticlick POPULATION_STATS.cpuCores](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Cores | Market Share | 1 in X | Entropy (bits) |
|-------|--------------|--------|----------------|
| 4     | 35%          | 2.9    | 1.51           |
| 8     | 20%          | 5.0    | 2.32           |
| 2     | 15%          | 6.7    | 2.74           |
| 6     | 15%          | 6.7    | 2.74           |
| 12    | 5%           | 20.0   | 4.32           |
| 16    | 5%           | 20.0   | 4.32           |
| 1     | 1%           | 100.0  | 6.64           |

**Fallback:** If your core count isn't listed, FOUNDprint uses 3.0 bits (estimated).

---

### Device Memory

Some browsers expose approximate RAM through `navigator.deviceMemory`. This API intentionally "buckets" the value to reduce fingerprinting precision (it reports 2, 4, 8, 16, etc., not exact amounts).

**Source:** [Panopticlick POPULATION_STATS.deviceMemory](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts)

| Memory (GB) | Market Share | 1 in X | Entropy (bits) |
|-------------|--------------|--------|----------------|
| 8           | 45%          | 2.2    | 1.15           |
| 4           | 25%          | 4.0    | 2.00           |
| 16          | 15%          | 6.7    | 2.74           |
| 2           | 5%           | 20.0   | 4.32           |
| 32          | 5%           | 20.0   | 4.32           |

**Fallback:** If your memory isn't listed, FOUNDprint uses 3.0 bits (estimated).

---

### Do Not Track

The "Do Not Track" (DNT) setting is a browser preference that *asks* websites not to track you. Ironically, enabling it can make you *more* identifiable because relatively few people bother to set it.

**Source:** [Panopticlick POPULATION_DATA.privacyTools](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts)

| Setting            | Market Share | 1 in X | Entropy (bits) |
|--------------------|--------------|--------|----------------|
| Not set (null)     | 77%          | 1.3    | 0.38           |
| Enabled (1)        | 20%          | 5.0    | 2.32           |
| Explicitly off (0) | 3%           | 33.3   | 5.06           |

> [!CAUTION]
> **The DNT Paradox:** Enabling Do Not Track was meant to improve privacy, but because most people leave it unset, having it enabled actually makes you stand out. Setting it to explicitly "off" is even more identifying because almost nobody does that.

---

### Ad Blocker

FOUNDprint detects ad blockers by creating a hidden "bait" element with class names that ad blockers typically hide (like "adsbox" or "ad-unit"). If the element gets hidden, you probably have an ad blocker.

**Source:** [Panopticlick POPULATION_DATA.privacyTools](https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts)

| Status   | Market Share | 1 in X | Entropy (bits) |
|----------|--------------|--------|----------------|
| Detected | 42%          | 2.4    | 1.25           |
| None     | 58%          | 1.7    | 0.79           |

---

## 8. Baseline Entropy: When Lookup Isn't Available

Some browser characteristics produce unique values that can't be matched to a market share percentage. For example, your canvas fingerprint is a hash that's (probably) different from almost everyone else's—there's no way to look up "what percentage of users have hash ABC123?"

For these attributes, FOUNDprint uses **baseline entropy values** from academic research. These values represent the *average* amount of identifying information that attribute provides.

### Selection Criteria

When studies report different values, **the lowest (most conservative) is always used** to avoid overstating uniqueness.

### Baseline Values Used

| Attribute | Entropy (bits) | Source | Why This Value |
|-----------|----------------|--------|----------------|
| Canvas fingerprint | 8.04 | HitC 2018 | AmIUnique found 8.28 bits; lower value used |
| Audio fingerprint | 10.0 | Panopticlick entropy.ts | Only available estimate |
| WebGL Renderer | 3.41 | AmIUnique 2016 | HitC found 5.28 bits; lower value used |
| WebGL Vendor | 1.82 | HitC 2018 | AmIUnique found 2.14 bits; lower value used |
| Fonts | 6.97 | HitC 2018 | Panopticlick found 13.9 bits; lower value used |
| User Agent (fallback) | 6.32 | HitC 2018 | Panopticlick found 10.0 bits; lower value used |
| Timezone (fallback) | 3.04 | Panopticlick 2010 | HitC excluded due to French sample bias |
| Language (fallback) | 2.56 | HitC 2018 | AmIUnique found 5.92 bits; lower value used |
| Touch Support | 1.0 | Panopticlick entropy.ts | Desktop (0 touch) = 1 bit; touch = 2-3 bits |
| Connection Type | 1.5 | Estimated | No academic baseline available |
| Plugins | 0.21 | HitC 2018 Mobile | Desktop was 10.28 bits, but plugins are deprecated |
| Cookies Enabled | 0.00 | HitC 2018 | Nearly universal; provides no identifying info |
| Local Storage | 0.04 | HitC 2018 | Nearly universal |

### Cross-Reference of Studies

This table shows how different studies measured the same attributes, and which value FOUNDprint uses:

| Attribute | Panopticlick 2010 | AmIUnique 2016 | HitC 2018 | FOUNDprint Uses |
|-----------|-------------------|----------------|-----------|-----------------|
| User Agent | 10.0 bits | 9.78 bits | 6.32 bits | **6.32** (lowest) |
| Screen Resolution | 4.83 bits | 5.21 bits | 4.83 bits | **4.83** (lowest) |
| Timezone | 3.04 bits | 3.34 bits | 0.10 bits* | **3.04** (unbiased) |
| Canvas | — | 8.28 bits | 8.04 bits | **8.04** (lowest) |
| WebGL Renderer | — | 3.41 bits | 5.28 bits | **3.41** (lowest) |
| WebGL Vendor | — | 2.14 bits | 1.82 bits | **1.82** (lowest) |
| Fonts | 13.9 bits | 8.38 bits | 6.97 bits | **6.97** (lowest) |
| Plugins | 15.4 bits | 11.06 bits | 0.21/10.28 bits | **0.21** (modern) |
| Do Not Track | — | 0.94 bits | 1.92 bits | **0.94** (lowest) |

*HitC 2018 timezone was 0.10 bits because 98% of their sample was in France (single timezone). This biased figure is excluded.

---

## 9. Combining Everything: The Independence Assumption

Here's where the math gets powerful—and where it's important to be honest about the limitations.

### How Entropy Values Are Combined

When you have multiple independent pieces of information, their entropies **add together**:

```
Total Entropy = Entropy(Screen) + Entropy(Browser) + Entropy(Canvas) + ...
```

And the total uniqueness is:

```
Total Uniqueness = 2^(Total Entropy)
```

### Visual Example

Let's walk through a real example:

```
Trait                 Market Share    Entropy
----------------------------------------------------
Screen: 1920x1080          23%        2.12 bits
Browser: Chrome            65%        0.62 bits
Timezone: America/NY       12%        3.06 bits
Canvas: [unique]            —         8.04 bits
Audio: [unique]             —        10.00 bits
----------------------------------------------------
TOTAL                                23.84 bits

Total Uniqueness = 2^23.84 = 14,965,021
"You are 1 in ~15 million people"
```

### The Independence Assumption

There's an important caveat: **this math assumes all traits are independent**.

What does "independent" mean? It means knowing one trait tells you nothing about another. Like:
- Knowing someone's shoe size tells you nothing about their favorite color
- Those are independent traits

But in browser fingerprinting, traits are often **correlated**:
- macOS users are more likely to use Safari
- iPhone users always have an iPad-like screen resolution
- Linux users are more likely to use Firefox

When traits are correlated, combining them gives *less* information than the math suggests. This means **the calculations may slightly overestimate your uniqueness**.

> [!IMPORTANT]
> **Why entropies are still added:** Even with correlations, adding entropies gives a reasonable upper-bound estimate. The alternative—modeling every possible correlation—would be extraordinarily complex and require data that isn't available. Academic fingerprinting studies use the same approach.

### An Analogy

Imagine you're trying to identify someone using:
1. Hair color (10 options)
2. Eye color (6 options)
3. Height category (5 options)

If these were completely independent, you'd have 10 × 6 × 5 = 300 possible combinations.

But they're not fully independent—people with blonde hair are more likely to have blue eyes. So the *actual* number of common combinations might be more like 150.

Similarly, FOUNDprint calculates the "300" but acknowledges the real number might be somewhat lower due to correlations.

---

## 10. Limitations and Disclaimers

This project prioritizes transparency. Here's what FOUNDprint can't do perfectly:

### 1. The Data is Approximate and Aging

- **Panopticlick data** is described in its source code as "approximate distributions from research"—not continuously updated telemetry
- **Academic studies** are from 2010, 2016, and 2018. Browser and device landscapes have changed significantly since then
- Market shares shift constantly (Chrome wasn't always dominant; 4K monitors were once rare)

### 2. Geographic and Demographic Bias

The studies sampled different populations:
- Panopticlick: EFF website visitors (likely more privacy-conscious and technical)
- AmIUnique: Visitors to the AmIUnique website (global, but self-selected)
- HitC: A French news website (98% French users)

None perfectly represents global internet users. Your actual uniqueness depends on *which population* you're being compared against.

### 3. No Ground Truth for Fingerprint Hashes

For canvas, audio, and WebGL fingerprints, FOUNDprint detects your unique hash but uses *average* entropy from studies. There's no way to verify how rare your *specific* signature is because no database of everyone's fingerprints exists.

### 4. The Independence Assumption (Again)

As discussed in Section 9, the math assumes traits are independent when they're often correlated. This means FOUNDprint likely **overestimates** your uniqueness somewhat.

### 5. One Browser = One Person

FOUNDprint assumes each browser instance represents one person. In reality:
- People use multiple browsers (work vs. personal)
- People use multiple devices (phone, tablet, laptop)
- Multiple people might share a device

### 6. Fingerprints Change Over Time

Your fingerprint isn't permanent:
- Browser updates can change your user agent, canvas rendering, etc.
- Installing new fonts changes your font fingerprint
- Getting a new monitor changes your screen resolution
- OS updates can affect various values

> [!NOTE]
> **Despite these limitations,** FOUNDprint provides a meaningful demonstration of how identifying browser characteristics can be. Even if the specific numbers are imperfect, the fundamental lesson remains: combining many "ordinary" traits can make you uniquely identifiable.

---

## 11. Verify It Yourself

FOUNDprint is designed to be fully transparent and verifiable. Here's how to check the work:

### 1. Read the Source Code

All calculations happen in **foundprint.js**:

> **Full path:** https://github.com/mrchrisneal/foundprint/blob/main/foundprint.js

The code is heavily commented and includes source URLs for every data value.

**Key locations in foundprint.js:**
- Lines 117-320: Market share lookup tables with source URLs
- Lines 336-533: Baseline entropy values with academic citations
- Lines 581-591: The core math functions (`percentToEntropy`, `percentToOneInX`)
- Lines 641-643: The entropy-to-uniqueness conversion

### 2. Check Panopticlick Directly

Visit the source files referenced in this project:

- **entropy.ts** (screen, timezone, language, CPU, memory data):
  https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/entropy.ts

- **comparison.ts** (browser and privacy tool data):
  https://github.com/panopticlick/Panopticlick/blob/main/packages/valuation-engine/src/comparison.ts

### 3. Read the Academic Papers

All three studies are freely available:
- [Panopticlick 2010 (PDF)](https://coveryourtracks.eff.org/static/browser-uniqueness.pdf) - The original EFF study
- [AmIUnique 2016 (PDF)](https://hal.inria.fr/hal-01285470/document) - Extended the Panopticlick methodology
- [Hiding in the Crowd 2018 (PDF)](https://hal.inria.fr/hal-01718234v2/document) - Largest study with mobile analysis

### 4. Do the Math Yourself

The formulas are simple enough to verify with a calculator:

```
entropy = log2(100 / percentage)
```

**Example:** For 23% market share:
```
entropy = log2(100 / 23)
        = log2(4.35)
        = 2.12 bits
```

Most calculators don't have log base 2, but you can use:
```
log2(x) = ln(x) / ln(2)
        = log10(x) / log10(2)
```

Or just type "log2(4.35)" into Google or Wolfram Alpha.

---

## 12. Data Freshness

| Source | Retrieved | URL |
|--------|-----------|-----|
| Panopticlick repo | December 2024 | https://github.com/panopticlick/Panopticlick |
| Panopticlick 2010 paper | 2010 | https://coveryourtracks.eff.org/static/browser-uniqueness.pdf |
| AmIUnique 2016 paper | 2016 | https://hal.inria.fr/hal-01285470/document |
| HitC 2018 paper | 2018 | https://hal.inria.fr/hal-01718234v2/document |
| Steam Hardware Survey | December 2024 | https://store.steampowered.com/hwsurvey/directx/ |
| World Population | December 2025 | UN estimate: 8.3 billion |

For the most current figures, check these source URLs directly.

---

## 13. Glossary

Quick definitions for terms used throughout this document:

<dl>

### Baseline Entropy
A pre-calculated entropy value from academic research, used when the market share for a specific value can't be looked up (e.g., your unique canvas fingerprint hash). FOUNDprint always uses the most conservative (lowest) estimate available.

### Bit (of entropy)
A unit of information. One bit represents the information in a single yes/no answer to a perfectly balanced question. Each additional bit doubles the number of possibilities: 1 bit = 2 options, 2 bits = 4 options, 10 bits = 1,024 options.

### Browser Fingerprint
A collection of your browser's characteristics (screen size, timezone, installed fonts, etc.) that, when combined, can uniquely or nearly-uniquely identify your browser.

### Canvas Fingerprint
A fingerprinting technique that draws hidden graphics in your browser and measures tiny differences in how your specific hardware/software combination renders them. Different computers produce slightly different results.

### Entropy
A measure of uncertainty, randomness, or "surprise." In fingerprinting, higher entropy means more identifying information. Low entropy (common trait) reveals little; high entropy (rare trait) narrows down who you might be.

### Independence (Statistical)
Two traits are independent if knowing one tells you nothing about the other. Example: coin flip outcomes are independent—the first flip doesn't affect the second. In fingerprinting, traits are assumed to be independent so their entropies can be added, but this is only approximately true.

### Logarithm (log2)
A mathematical function that answers: "What power do I raise 2 to, to get this number?" log2(8) = 3 because 2³ = 8. FOUNDprint uses log2 because it converts multiplicative probabilities into additive entropies, making the math easier.

### Market Share
The percentage of users who have a particular characteristic. If 23% of internet users have 1920x1080 screens, that's the market share for that resolution.

### "1 in X"
A way to express probability. "1 in 100" means 1% probability, or that 1 out of every 100 people has this trait. Calculated as 100 divided by the percentage.

### Probability
The likelihood of something happening, expressed as a number from 0 (impossible) to 1 (certain), or as a percentage (0% to 100%). A 23% market share means 0.23 probability.

### User Agent
A text string your browser sends to every website identifying your browser name, version, and operating system. Example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120..."

### World Population Cap
FOUNDprint caps uniqueness at 8.3 billion (the world population) because you can't be rarer than "unique among all humans." If the math suggests you're "1 in 50 trillion," FOUNDprint displays that you're statistically unique.

</dl>

---

## Questions or Feedback?

FOUNDprint was created as a solo educational project for a blog post. If something isn't clear or you've found an error, feel free to reach out directly via email: **chris@neal.media**

The complete source code is available at: **https://github.com/mrchrisneal/foundprint**

---

*FOUNDprint is open source software licensed under AGPL-3.0.*
