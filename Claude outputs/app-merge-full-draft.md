# Two apps into one, built to hold the third

Rupeezy · Consumer app
Sole designer · One PM, seven engineers · November 2024 to August 2025

---

## The short version

Rupeezy sold two products through two apps. A trading app that carried 97% of company revenue, and a separate mutual fund app.

Then a SEBI regulation took roughly 75% of trading revenue in five months. Mutual funds stopped being extra income and became the only other business we had. Merging stopped being optional, and it had six weeks.

The agreed answer was a mode switch between the two products. I shipped it. Placing that switch is what showed me it could only ever hold two, and a third product was already being discussed. So I built the model that would hold any number of them. It was agreed, parked while the company absorbed the regulation, and built after I left. It is live in Rupeezy today.

---

# Part one. The switch

## A banner in our own app, pointing at our other app

*[before / after slider]*

Rupeezy has been a stockbroker since 2003 and digital since 2017. Around 125 people, two products, two separate apps.

Rupeezy Trade held stocks and F&O. I owned it end to end. Rupeezy Invest held mutual funds, and it was much smaller.

Neither app could show a whole portfolio. To answer "how am I doing", a user opened both and added the two totals up himself.

And the Trade app carried a banner for Rupeezy Invest. We were using our own product to send our own users to a second download.

> That banner is the business problem, sitting in production, in our own app.

*[am-trade-home.webp]*

---

## Then a rule set the date

Diversifying into mutual funds had been the plan for years. It was never urgent enough to start.

**1 October 2024.** SEBI announces new rules for index derivatives. Bigger contracts, one weekly expiry per exchange, extra margin on expiry day. The stated aim is to push small retail traders out of F&O.

**November 2024.** Design work begins.

**20 November 2024.** First tranche goes live. Minimum contract value rises to ₹15 lakh, and each exchange keeps weekly expiry on one index only.

**15 January 2025.** Phase one ships.

**1 February 2025.** Second tranche goes live. Option premium is now collected upfront from buyers.

**March 2025.** Trading revenue is down about 75%.

> Source: I pulled this in Firebase myself, March 2025 against September and October 2024, the months before the rules. Percentages only. It is the one number on this page I measured rather than was told.

*[sebi-tweet.png]*

In October 2024 Zerodha's founder estimated the rules would hit about 60% of all F&O trades.

One product carried 97% of the revenue, and the regulator had just come for it. That is not concentration. That is exposure.

Mutual funds were no longer additional revenue. They were the only other business we had.

---

## The market had already moved

I went through how other brokers handled more than one product.

Groww, Angel One, Upstox and Paytm Money all sold stocks, F&O and mutual funds inside a single app. Angel One had folded mutual funds into its trading app back in 2023.

Our users had noticed the same thing. From the Play Store reviews:

> "Every other broker has one app, so why do I need two?"

So the question was never whether to merge. It was how fast, and what to build first.

---

## What I had to work with

I never spoke to a user about this project. Everything I knew about behaviour came second hand.

Play Store reviews, where people were already asking why they needed two apps. In-app feedback. Firebase, for how people moved between the two products.

I was the only designer on it, working with one PM, seven engineers, and a design manager who assigned and reviewed the work.

*[what I had instead diagram]*

---

## Two phases, and the first one had six weeks

**For the business.** Sell to both sides of our own user base. Build every compliance change and every campaign once instead of twice.

**For the user.** One place where all the money lives. One number that says how you are doing, without opening a second app.

The plan had two phases. Phase one would put Invest inside Trade with a mode switch between the two, the pattern food delivery apps use to move between food and groceries. Phase two would refine it once it was live.

I did not argue with that. With revenue falling every week, a switch was the right fast answer. Ship the thing that works, then make it better.

---

## Where the switch lives was my call

I ran three iterations.

*[am-entry-points-v2.svg]*

**Rejected. Top navigation.** The top bar already carried indices, search and notifications. Putting the switch there meant redesigning screens we were not otherwise touching.

**Rejected. A floating button on Home.** It can only live on one screen. A user three levels deep inside a stock would have to come all the way back out to change product.

**Chosen. Bottom navigation.** Present on every screen, so the switch is one tap away from wherever the user already is. It disturbed the existing layout least.

Phase one shipped on 15 January 2025. Six weeks after design started, and two weeks before the second tranche of rules took effect.

---

# The hinge

I was placing the switch in the bottom bar when I saw what it could not do.

A switch holds two things.

Commodities were already being discussed.

---

# Part two. The model

## Two directions, not two products

Stocks and mutual funds are not two different jobs. They are two ways of doing the same one, which is putting money somewhere and watching what it does.

Two directions run through the app. What you own, and what you are doing with it. Call them axes.

**The journey axis.** Home, Explore, Orders, Portfolio. What you are doing right now.

**The product axis.** Stocks, F&O, Mutual funds. What you are doing it with.

Tap either row, and the one you did not touch holds still. Adding a fourth product changes one row and nothing else.

*[two-axis interactive model]*

A switch fixes one axis permanently. Every product after the second becomes a new mode, or a menu doing a switch's job.

---

## I built it instead of describing it

The difference between a switch and two axes is hard to hear and easy to see. So I stopped explaining it and built a working prototype instead. Tap either axis, watch the other hold still.

> If I cannot convince people with words, the problem is usually the format, not the argument.

---

## Getting it into the roadmap

I showed the two-axis screens to the design team first. What I had built, why, and where the switch would stop holding.

Then to a VP Product and a Director. Everyone saw it.

Capacity was the constraint. The regulation had put work into every team's pipeline, the switch was live and working, and this meant real engineering effort on top of that.

So it was agreed, and deferred. Phase two, when there was room.

---

## Ten navigation slots became five

One bottom bar for the journey, one product bar on top.

The vocabulary had to change with it. **Position** is F&O language. You hold a position and you close it. A fund investor holds investments, for years. **Watchlist** is a trader's habit. You watch a stock because you are waiting on a price, while fund investors browse and compare.

*[am-home-after.png]*

---

## Home breaks the pattern, on purpose

**The call.** Whether Home follows the same product-tab pattern as every other screen.

**Considered.** Give Home the same product bar. Consistent with Explore, Orders and Portfolio, and the user always knows which product they are in.

**Chose.** No tabs on Home. Every product visible at once.

**Cost.** One screen breaks the pattern, and Home becomes the only place where scope is not explicit.

The reason is the whole point of the merge. With tabs, a trader on Home only ever sees stocks. The merge exists so they see funds too.

So Home carries one number for everything you hold, IPO and NFO side by side so neither product is the guest, and first-timer language. Hybrid, ELSS, invest with ₹100. Words a beginner recognises.

---

## Where a first-timer lands

*[am-portfolio-tabs.webp]*

**The call.** Which product tab a first-time user lands on.

**Considered.** Always default to Stocks. Simple, and right for most users.

**Chose.** Use the intent captured at KYC. Someone who said they came to invest lands on Mutual Funds. Stocks only when intent is unknown.

**Cost.** The fallback still favours traders, so a fund investor who skipped the question starts in the wrong place.

---

## Moving people without shocking them

KYC was already unified, so accounts linked automatically. No re-verification, no documents.

*[am-banner-dismissible.png / am-banner-nondismissible.png]*

**One. Dismissible.** A sheet inside Rupeezy Invest announcing the move, closable, for one month.

**Two. Non-dismissible.** After a month, the same sheet with no close button. The only action left is downloading the merged app.

**Three. Removed.** The app leaves the stores. At this point the sheet is not in the app. It is the app.

A hard cutover would have been faster. In a money app, something that suddenly stops working reads as broken, not as an upgrade.

---

# What is live now

The two-axis model is live in Rupeezy today, across stocks, F&O and commodities. Commodities arrived after I left.

> Source: I opened the current app and checked.

Mutual funds sits in the app too, reached by a switch in the bottom bar rather than by the product tabs.

I left in August 2025, before any of this was built.

---

## What I would do differently

**No user testing.** I never spoke to a user about this one. The decisions came from the business, the data and my own reasoning.

**No measurement plan.** We did not agree what this should move before we shipped, so I cannot tell you whether cross-sell improved.

---

## What I can claim

**Navigation.** Three products on one model, live across stocks, F&O and commodities.

**Maintenance.** Four developers to three. Four of the seven engineers had been split two per app.

**Compliance.** Shipped once, not twice.
