# Billing & Credits

CodeXplain now ships with a transparent billing layer designed for teams that want to recover OpenAI spend from end users. The platform supports two usage modes:

1. **Bring-your-own key** – users attach their personal OpenAI API key and every AI request is proxied through their quota. No platform credits are consumed.
2. **Hosted credits** – when a user does not supply an API key, CodeXplain falls back to the shared OpenAI account and charges prepaid credits that you sell through Stripe.

## Wallet & Credit Packs

- Every account automatically receives a **wallet**. Balances, lifetime purchases, and lifetime consumption are persisted in the `user_credit_wallets` table.
- Credits are debited at the end of every OpenAI completion. The system converts tokens → credits using `BILLING_TOKENS_PER_CREDIT` (default `1000` tokens per credit).
- You can configure **credit packs** (name, amount, price) in the database. By default the backend seeds Starter, Builder, and Pro packs.
- Transactions are immutable ledger entries. They include the repository/file that consumed credits so users can reconcile spend.

## Stripe Checkout Flow

1. Configure the following backend environment variables:

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx   # optional, useful for docs/UI messaging
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CHECKOUT_SUCCESS_URL=https://app.example.com/billing/success
STRIPE_CHECKOUT_CANCEL_URL=https://app.example.com/billing/cancel
BILLING_TOKENS_PER_CREDIT=1000
BILLING_ESTIMATED_COST_PER_CREDIT_CENTS=150
```

2. From Stripe’s dashboard create a “Checkout Session Completed” webhook and point it at `/billing/stripe/webhook`. Use the webhook secret above.
3. (Optional) Create one-time Prices in Stripe and store the `stripe_price_id` on each credit pack. If omitted, the backend dynamically creates checkout line items from pack metadata.

When a user purchases a pack:

1. The frontend calls `POST /billing/checkout` with the selected pack id.
2. FastAPI creates a Checkout Session, stores it in `stripe_checkout_sessions`, and returns the hosted Stripe URL.
3. Stripe sends a `checkout.session.completed` webhook. The backend validates the signature, marks the session as completed, and deposits credits into the user’s wallet.

## Enforcement in Repository Processing

- Repository uploads now perform a **402 Payment Required** check: the user must either have an active personal API key or at least 1 credit in their wallet.
- During processing, the documentation pipeline records the tokens used per function/class/summary and debits credits in real time. If the wallet reaches zero mid-run the file is marked as failed with an actionable error.
- Repository and file responses now include `tokens_used`, `credits_charged`, and aggregate totals so the frontend can display cost breakdowns.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/billing/packs` | List the currently available credit packs |
| `GET` | `/billing/wallet` | Return wallet balance, tokens-per-credit, and API-key status |
| `GET` | `/billing/transactions` | Paginated ledger (latest 50 transactions) |
| `POST` | `/billing/checkout` | Start a Stripe Checkout session for a pack |
| `POST` | `/billing/stripe/webhook` | Webhook handler for Stripe events |

## Frontend Experience

- The dashboard now shows the current balance, usage history, and a CTA to connect a personal OpenAI key.
- Users can buy credits via Stripe Checkout in a new tab. After purchase webhooks deposit credits automatically—no manual refresh required.
- When a 402 error is returned (e.g., trying to upload without credits) the UI surfaces a clear message plus links to billing/settings.

## Troubleshooting

- **Webhook delivers twice**: The backend stores checkout sessions and only deposits credits the first time it sees `checkout.session.completed`.
- **Credits not updating**: Check the Stripe webhook secret and ensure the `/billing/stripe/webhook` endpoint is reachable over HTTPS.
- **Custom currency**: Update the `currency` field on each credit pack and Stripe checkout line items will inherit it automatically.

For more details see the backend API references and the configuration guide.

