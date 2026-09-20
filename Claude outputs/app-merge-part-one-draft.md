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

Rupeezy has been a stockbroker since 2003 and digital since 2017. Around 125 people, and two products sold through two separate apps.

Rupeezy Trade held stocks and F&O. I owned it end to end. Rupeezy Invest held mutual funds, and it was much smaller.

Neither app could show a whole portfolio. To answer "how am I doing", a customer opened both and added the two totals up himself.

And the Trade app carried a banner for Rupeezy Invest. We were using our own product to send our own customers to a second download.

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

In October 2024 Zerodha's founder estimated the rules would hit about 60% of all F&O trades. Our concentration in F&O meant we felt it harder than that.

One product carried 97% of the revenue, and the regulator had just come for it. That is not concentration. That is exposure.

Mutual funds were no longer additional revenue. They were the only other business we had.

---

## The market had already answered this

I went through how other brokers handled more than one product.

Groww, Angel One, Upstox and Paytm Money all sold stocks, F&O and mutual funds inside a single app. Angel One had folded mutual funds into its trading app back in 2023.

Zerodha was the exception, and still is. Kite for trading, Coin for mutual funds, two downloads, on purpose. Their own support page says putting everything in one place would clutter the app with features that only apply to some customers.

It is a real argument. It was not our situation. Zerodha could afford to serve two audiences separately because both of them were already large. We had one large audience and one small one, and we had just lost most of the large one.

Our customers had picked a side anyway. From the Play Store reviews:

> "Every other broker has one app, so why do I need two?"

So the question was never whether to merge. It was how fast, and what to build first.

---

## What I had to work with

I never spoke to a customer about this project. Everything I knew about behaviour came second hand.

Play Store reviews, where people were already asking why they needed two apps. In-app feedback. Firebase, for how people moved between the two products.

I was the only designer on it, working with one PM, seven engineers, and a design manager who assigned and reviewed the work.

*[what I had instead diagram]*

---

## Two phases, and the first one had six weeks

**For the business.** Sell to both sides of our own customer base. Build every compliance change and every campaign once instead of twice.

**For the customer.** One place where all the money lives. One number that says how you are doing, without opening a second app.

The plan had two phases. Phase one would put Invest inside Trade with a mode switch between the two, the pattern food delivery apps use to move between food and groceries. Phase two would refine it once it was live.

I did not argue with that. With revenue falling every week, a switch was the right fast answer. Ship the thing that works, then make it better.

---

## Where the switch lives was my call

I ran three iterations.

*[am-entry-points-v2.svg]*

**Rejected. Top navigation.** The top bar already carried indices, search and notifications. Putting the switch there meant redesigning screens we were not otherwise touching.

**Rejected. A floating button on Home.** It can only live on one screen. A customer three levels deep inside a stock would have to come all the way back out to change product.

**Chosen. Bottom navigation.** Present on every screen, so the switch is one tap away from wherever the customer already is. It disturbed the existing layout least.

Phase one shipped on 15 January 2025, six weeks after design started and six weeks before the second tranche of rules took effect.

---

# The hinge

I was placing the switch in the bottom bar when I saw what it could not do.

A switch holds two things.

Commodities were already being discussed.

---

*Part two follows: the model.*
