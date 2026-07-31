# BubOps

BubOps is a multi-tenant SaaS platform for laundry businesses, built for the Auth0 x Stripe hackathon.

## Live Application

https://bubops-new.vercel.app

## Stripe Projects Stack

https://projects.dev/s#v1:Auth0~client

Stripe Projects was used to initialize the project and provision the Auth0 client.

## Stripe Integration

BubOps uses Stripe for subscription billing:

- Stripe Checkout
- Stripe Billing Portal
- Stripe webhooks
- Recurring monthly subscriptions
- Test-mode payment processing

### BubOps Pro

- Price: $49 per month
- Monthly order limit: 1,000 orders
- Stripe Price ID: `price_1Tz0GP78iDMgijfRTnbg9FKD`
- Product: `BubOps Pro`

### Payment Flow

1. A laundry owner opens the Billing page.
2. BubOps creates a Stripe Checkout Session.
3. Stripe securely collects the payment.
4. Stripe sends a `checkout.session.completed` webhook.
5. BubOps verifies the webhook signature.
6. The tenant is upgraded to the Pro plan.

### Production Webhook

```text
https://bubops-new.vercel.app/api/stripe/webhook
