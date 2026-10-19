# mr_trials_1: TrueLine trial store

Mark's practice project for learning the full path from a page built in Claude Code to a live
website with a shopping cart and Stripe checkout. The product, **TrueLine Pro**, is made up. The
real goal is a store for an LLC client (several tool models plus attachments, roughly 6–16
items) that Mark will set up for the LLC's owner.

Mark is not a developer. Explain steps in plain language, one click at a time, and say which
steps he has to do himself (sign-ins, pasting keys, account settings, payments).

## Where everything lives

| What | Where |
| --- | --- |
| Code | `C:\Users\markr\websites\mr_trials_1` = GitHub `twenty-one-mr/mr_trials_1` (public) |
| Branches | `staging` = working copy (the default for edits) · `main` = published site |
| Netlify project | `trueline-pro-trial` in team "Sequoia Team" (`mark-ruggiero21`), Free plan |
| Staging preview (free, test here) | https://staging--trueline-pro-trial.netlify.app |
| Live trial site | https://trueline-pro-trial.netlify.app (auto-publishing is **locked**) |
| Old GitHub Pages copy | https://twenty-one-mr.github.io/mr_trials_1/ (first version, from `main`; no cart) |
| Stripe | Mark's own account "MR Test", **sandbox only** (test mode, fake money) |
| Stripe setup checklist doc | https://claude.ai/code/artifact/87eae1ae-0332-4c9e-85df-5b691396feb6 |
| Walkthrough video | `video/github-pages-walkthrough.mp4` (local only, not in Git) |

## How we work

1. Edit files here, commit, and push to **`staging`**. Netlify builds the preview in ~30 s for free.
2. Mark checks the staging link.
3. Only when Mark says "publish": merge `staging` into `main` and push, then publish that deploy
   in Netlify (Deploys → the new deploy → Publish deploy), since auto-publishing is locked.
   Each production deploy costs **15 of the 300 free monthly credits**, so batch changes.
   Never push to `main` without that go-ahead.

## Files

- `index.html`, `style.css`: the page. `thanks.html`: after-payment page (empties the cart).
- `cart.js`: shop grid + cart drawer. Display prices only.
- `netlify/functions/checkout.mjs`: `POST /api/checkout`. Builds a Stripe Checkout Session
  from its own `CATALOG` (real prices live here). **Keep both CATALOGs in sync.**
  Shipping: Standard $25 (free on $1,000+), Express $60. US addresses only; collects phone.
  Refuses any key that isn't `sk_test_`/`rk_test_`, so no real card can be charged.
- `netlify.toml`: static site, no build step, functions folder.

## Netlify environment variables

- `STRIPE_SECRET_KEY`: Mark's Stripe **test** key (secret; set for Production, Deploy Previews,
  Branch deploys). After changing a variable, push a commit to `staging` to redeploy.
- `STRIPE_AUTOMATIC_TAX`: not set yet. Set to `true` after Stripe Tax is set up in the sandbox.
- Leftover: a variable whose *name* is a pasted test key (a setup mistake). Unused; safe to delete.
- Never ask Mark to paste keys into chat, and never type keys into websites for him.

## Status (as of 2026-10-18)

Done:
- Landing page → GitHub → GitHub Pages; price changed to $499
- Netlify setup with staging previews and locked publishing
- Sample shop: 2 models + 3 attachments, cart, Stripe test checkout
- Test order placed and confirmed working (thank-you page reached)

Open:
- [ ] Turn on Stripe Tax in the sandbox (origin address + a registration, e.g. Massachusetts),
      then set `STRIPE_AUTOMATIC_TAX=true`
- [ ] Delete the misnamed Netlify variable; optionally rotate the Stripe test key (it was
      briefly visible as a variable name), then update `STRIPE_SECRET_KEY`
- [ ] Publish the shop from `staging` to `main` (when Mark says so)
- [ ] Update the checklist doc for the Netlify + cart setup: products table for 6–16 items,
      owner questions (full product/price list; which attachments fit which models)
- [ ] Real store: owner creates the LLC's Stripe account and invites Mark as Administrator
      (or Developer); swap in the owner's **test** key here first; do one real-money purchase
      plus refund only on the final site, right before launch

## Decisions already made

- Netlify over GitHub Pages because the cart needs a server function. Free plan is fine;
  Personal is $9/month if credits run short.
- Payment Links were dropped once there were multiple products; the cart uses Checkout Sessions.
- Owner opens the real Stripe account and uses their own phone for sign-in codes; Mark gets
  his own login as Administrator. Owner enters SSN, EIN and bank details themselves.
- Videos for the real site go on Vimeo or similar, not in this repo.
- Hostinger is on hold; a custom domain can be added later (domain from any registrar).

## Working in sessions

- Start a new Claude Code session per topic, in this folder, so each stays short. Suggested:
  "Stripe Tax in the sandbox", "Plan the real store", "Update the checklist doc".
- The first long session, "TrueLine trial: GitHub → Netlify → Stripe cart", holds the full history.
- When something here changes (status, links, decisions), update this file and push to `staging`.
