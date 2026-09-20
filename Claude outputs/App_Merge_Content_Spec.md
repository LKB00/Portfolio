# App Merge case study · content spec

Everything on this page is final copy. Design around it. Nothing here needs rewriting, and nothing here should be invented, expanded or "improved" with extra claims.

---

## 1. Rules that cannot be broken

| Rule | Why |
|---|---|
| No em-dashes anywhere. En-dashes only in date ranges (Nov 2024 – Aug 2025) | House style |
| Every number must keep its source line | If a number appears without its source, cut the number |
| Say "agreed and deferred". Never "I disagreed", "I was right", "I won" | The two-axis model was never rejected, it was parked for capacity |
| "97%" appears twice on the whole page, no more | It is a fact about the company, not an achievement |
| Never claim user interviews, usability testing, or product A/B tests | None were done |
| Do not name Zerodha | No reasoning was done at the time about why their two-app choice did not apply |
| Use "Investeezy", not "Rupeezy Invest" | The screenshots show Investeezy, so the copy matches the pictures |

**Words to use:** navigation model, entry point, default state, product row, journey, migration, cross-sell, trade-off, constraint.
**Words to avoid:** seamless, holistic, user-centric, ideation, empathy map, double diamond, leveraged, delightful, deep dive, synergy.

---

## 2. Brand colours, sampled from your own screenshots

| Hex | What it is | Use for |
|---|---|---|
| `#064BD3` | Rupeezy Trade blue | The trading app, the journey row, primary accent |
| `#570DD8` | Investeezy violet | The mutual fund app, the product row |
| `#FFB86A` | Amber | Highlights, source markers |
| `#EF3F3F` | Market red | The regulation, losses |
| `#4DC37B` | Market green | Gains, if needed |

The story is two apps becoming one. Two colours merging is the cheapest true idea available.

---

## 3. Assets, and where each one belongs

| File | Section |
|---|---|
| `merge-before-2400.webp` | 01 Before. Four screens of the old trading app |
| `merge-after-2400.webp` | 01 After, or the closing section |
| `am-trade-home.webp` | 01, the single Home screen with the Investeezy banner |
| `sebi-tweet.png` | 02, Nithin Kamath's estimate |
| `sebi-news-1.png` | 02, press coverage of the rules |
| `am-entry-points-v2.svg` | 04, the three explorations for where the switch lives |
| `AM-B-1.svg` | 05, the best asset you own. A full device mockup showing both navigation rows at once |
| `AM-B-2.svg` | Optional, the My Account screen |
| `am-home-after.png` | 06, Home breaks the pattern |
| `am-portfolio-tabs.webp` | 07, the KYC default tab |
| `am-banner-dismissible.png` | 08, migration stage one |
| `am-banner-nondismissible.png` | 08, migration stage two |

---

## 4. The page

### HERO

**Eyebrow:** Rupeezy · Consumer app · 2024

**Headline:** The switch that could only hold two

**Two brand chips:**
- Rupeezy Trade · stocks, F&O
- Investeezy · mutual funds

**Lede:** Two apps, two brands, one customer who could never see everything he owned. I was asked for a switch between them and I shipped it on the deadline. **Placing it is what showed me the model that had to replace it.**

**Meta:** Role · Sole designer · Team · 1 PM, 7 engineers · Timeline · Nov 2024 – Aug 2025 · Live today · Stocks, F&O, commodities

---

### 01 · BEFORE

**Eyebrow:** Before
**Heading:** Two apps. One customer. Neither showed the whole picture.

Rupeezy Trade held stocks and F&O. Investeezy held mutual funds. To answer "how am I doing", you opened both and added the totals up yourself.

And the trading app carried an advert for the other one, in Investeezy's violet, with a button that took you out of the app to a second download.

**Annotations on `merge-before-2400.webp`:**
1. Mutual funds, advertised as a separate download · position 17% across, 73.5% down
2. A pill in the corner pointing at the same app · 9.2% across, 81% down
3. No combined total. Home opens by asking you to buy stocks · 17% across, 36.5% down
4. Watchlist. A trader's word, in an app we needed first-time investors to use · 57% across, 82.2% down

---

### 02 · THE RULE

**Eyebrow:** Chapter two · October 2024
**Big number:** 75%
**Under it:** of trading revenue, gone in five months

**Body:** A regulator decided small retail traders should be priced out of F&O. Ninety-seven percent of what Rupeezy earned came through that one product. Selling mutual funds had been the plan for years. It was never urgent enough to start. Then a date was set.

**Timeline:**

| Date | Event |
|---|---|
| 1 Oct 2024 | SEBI announces new rules for index derivatives. |
| 20 Nov 2024 | First set goes live. The smallest contract you can buy rises to ₹15 lakh. |
| 15 Jan 2025 | **Phase one ships.** |
| 1 Feb 2025 | Second set goes live. Option premium has to be paid upfront. |
| Mar 2025 | Trading revenue is down about **75%**. |

**Source line, must stay attached to the 75%:**
I pulled this in Firebase myself. March 2025 against September and October 2024, the months before the rules. Percentages only. It is the one number on this page I measured rather than was told.

**Three cost cards:**

| Figure | Label | Body |
|---|---|---|
| 0 | Cross-sell | A fund investor could not buy a stock. A trader could not start an SIP. |
| 2× | Every release | Two developers per app, four of the seven engineers, shipping every rule change twice. |
| 97% | One product line | That is not concentration. That is exposure. |

**Closing line:** Mutual funds were no longer extra income. They were the only other business we had.

---

### 03 · THE MARKET, AND WHAT I HAD

**Eyebrow:** The market
**Heading:** Everyone else was already on one app.

Groww, Angel One, Upstox and Paytm Money all sold stocks, F&O and mutual funds inside a single app. Angel One had folded funds in back in 2023.

**Pull quote:** "Every other broker has one app, so why do I need two?"
**Attribution:** From the Play Store reviews

**Sub-block · What I had instead of users:**
I never spoke to a customer about this project. Everything I knew was second hand: Play Store reviews, in-app feedback, and Firebase for how people moved between the two products. I read it. I did not ask for it.

---

### 04 · THE BRIEF, AND THE THREE EXPLORATIONS

**Eyebrow:** Chapter three
**Heading:** The answer was a switch, and it had six weeks.

Put Invest inside Trade with a switch between them. It is the pattern food delivery apps use to move between food and groceries. Refine it once it was live. I did not argue. Revenue was falling every week, and shipping something beats perfecting nothing.

**Two goals:**
- **For the business.** Sell to both halves of our own customer base, and build every rule change once instead of twice.
- **For the customer.** One place where all the money lives, and one number that says how you are doing.

**Heading:** Where the switch lived was my call.
*(Use `am-entry-points-v2.svg` large)*

| | |
|---|---|
| **Rejected** | **Top navigation.** The top bar already carried indices, search and alerts. Putting it there meant redesigning screens we were not otherwise touching. |
| **Rejected** | **A floating button on Home.** It lives on one screen. Somebody three levels inside a stock would have to come all the way out to change product. |
| **Chose** | **Bottom navigation.** On every screen, so the switch is one tap from wherever you already are. |

**Closing:** **Phase one shipped on 15 January 2025.** Six weeks after design started, two weeks before the second set of rules.

---

### THE TURN · give this its own full-width moment

I was placing the switch in the bottom bar when I saw what it could not do.

A switch holds two things. Commodities were already being discussed.

---

### 05 · THE MODEL

**Eyebrow:** Chapter four
**Heading:** Two directions, not two products.

You put money somewhere, and you watch what it does. Stocks and mutual funds are not two jobs. They are two ways of doing one.

So two things run through the app at the same time. **What you own**, and **what you are doing with it.** Give each one its own row, and the app holds as many products as you like. A switch cannot, because a switch has two sides.

*(This is where `AM-B-1.svg` belongs. It is the only asset that shows both rows in one real screen.)*

**Optional interaction, if you want to build it.** A phone with two rows. Tapping the product row leaves the journey row untouched and vice versa. Then a button that adds a fourth product: the product row gains one item and nothing else moves. Then the same thing in switch mode, where adding a third product has nowhere to go.

Beat captions if you build it:
1. Give each direction its own row.
2. Change what you own. The other row has not moved.
3. Change what you are doing. Now the first row holds still.
4. Add a fourth product. One row gained an item. Nothing else moved.
5. Now try that with a switch. There is nowhere to put a third.

---

### 06 · SELLING IT

**Heading:** I built it instead of explaining it.

The difference between a switch and two rows is hard to hear and easy to see. So I stopped talking and made a working prototype.

**Pull quote:** If I cannot convince people with words, the problem is usually the format, not the argument.

I showed it to the design team, then a VP Product and a Director. Everyone agreed it was the right direction. There was no room for it. The regulation had filled every team's queue, the switch was live and doing its job, and this needed real engineering on top. **So it was agreed, and it was parked.**

---

### 07 · TEN SLOTS BECAME FIVE

**Heading:** Ten slots became five.

Two apps meant two bottom bars, five slots each, and the same ideas spelled differently in both.

| Bar | Slots |
|---|---|
| Rupeezy Trade, before | Invest → · Home · Watchlist · Tools · Order · Position |
| Investeezy, before | Home · Explore · SIPs · Orders · Portfolio |
| After, product row | Stocks · F&O · Mutual funds |
| After, journey row | Home · Explore · Tools · Orders · Portfolio |

**Body:** The words changed too. **Position** is F&O language. You open a position and you close it. Somebody buying a fund holds it for years. **Watchlist** is a trader's habit, so it became **Explore**, which is what a first-timer is actually doing.

---

### 08 · TWO DECISIONS

**Decision A · Home breaks the pattern, on purpose.** *(pair with `am-home-after.png`)*

| | |
|---|---|
| The call | Whether Home carries the product row like every other screen. |
| Considered | Give it the row. Consistent, and you always know which product you are in. |
| Chose | No row on Home. Everything at once. With a row, somebody who trades would only ever see stocks there, and the point of the merge is that they see funds too. |
| Cost | One screen breaks the pattern, and Home is the only place the navigation does not tell you what you are looking at. |

Home leads with one number for everything you hold, puts IPO and NFO side by side so neither product is the guest, and uses words a beginner recognises. Hybrid. ELSS. Start with ₹100.

**Decision B · A first-timer lands where they said they wanted to be.** *(pair with `am-portfolio-tabs.webp`)*

| | |
|---|---|
| The call | Which product a first-time user sees first. |
| Considered | Always open on Stocks. Simple, and right for most people. |
| Chose | Use what they told us at sign-up. Somebody who said they came to invest opens on Mutual Funds. Stocks only when we do not know. |
| Cost | The fallback still favours traders, so somebody who skipped that question starts in the wrong place. |

---

### 09 · MIGRATION

**Heading:** We moved people over a month, not overnight.

Sign-up was already shared between the two apps, so accounts linked themselves. Nobody had to verify anything again or upload a document.

| Stage | Title | Body | Asset |
|---|---|---|---|
| One | You can close it | A message inside the old app telling people about the move, with a close button. One month. | `am-banner-dismissible.png` |
| Two | You cannot | The same message, no close button. The only thing left to do is download the new app. | `am-banner-nondismissible.png` |
| Three | It is gone | The old app leaves the stores. | none |

**Closing:** Switching everybody at once would have been faster. In an app that holds your money, something that suddenly stops working reads as broken, not as an upgrade.

---

### 10 · WHAT IS LIVE NOW

**Heading:** The model is live today. It holds a product I never designed for.

Two rows, across stocks, F&O and commodities. Commodities arrived after I left.

Mutual funds is in the app too, reached by a switch in the bottom bar rather than by the product row.

I left in August 2025, before any of this was built.

**Source line:** I opened the current app and checked.

**Two closing columns:**

| What I did not do | What I can claim |
|---|---|
| **No testing with customers.** The decisions came from the business, the data and my own reasoning. | **Three products on one model.** Stocks, F&O and commodities. |
| **No measure agreed up front.** We never said what this should move before shipping, so I cannot tell you whether cross-sell improved. | **Four developers to three.** They had been split two per app. |
| | **Rule changes shipped once**, not twice. |

---

## 5. Things that must never appear

- Any cross-sell percentage. 70% and 17% were both wrong or unverifiable.
- "~30% operational overhead reduction". Self-derived, never measured.
- Any KYC drop-off figure. The 18% to 11% number was a guess.
- "Merged two apps into one app" as a flat claim. It shipped in phases, partly after he left.
- Retention or engagement percentages of any kind.
- Named target customers presented as clients.
- Zerodha.

---

## 6. Facts you may be asked to defend

| Claim | Where it came from |
|---|---|
| ~75% revenue fall | Firebase, pulled by LKB, March 2025 vs Sep–Oct 2024 |
| 97% of revenue in one product | Company figure, used as scale context |
| SEBI dates | SEBI circular SEBI/HO/MRD/TPD-1/P/CIR/2024/132, 1 Oct 2024 |
| Four developers to three | Maintenance team, four of the seven engineers, two per app |
| Model live across three products | LKB opened the current app and checked |
| Mutual funds reached by a switch | Same, first hand |
| Competitors on one app | App Store listings for Groww, Angel One, Upstox, Paytm Money |
