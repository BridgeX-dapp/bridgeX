# 🪙 MunaPay Backend

![Architecture Diagram](https://cdn.dorahacks.io/static/files/1990d31322bd16a33e2a1ff4f2880a5a.png)

> For **full documentation** on how MunaPay works and how to integrate it into your project, please visit:  
> [📚 MunaPay Docs](https://zenvid.gitbook.io/muna-pay)

---

## 🚀 Overview

This is the **Node.js + Postgress backend** powering [MunaPay](https://munapay.xyz).  
It handles **payment sessions, API keys, webhooks, merchant onboarding, and real-time event updates**.

---

## 📂 Project Structure

```bash
munapay-backend/
├── src/
│   ├── api/                # Express routes (auth, payments, webhooks, etc.)
│   ├── controllers/        # Business logic for each route
│   ├── routes/             # routes (User, Business, Payment, etc.)
│   ├── services/           # Core services (payment links, checkout, BTC conversion)
│   ├── lib/              # Helpers (validators, logger, error handler)
│   ├── events/             # WebSocket & blockchain event listeners
│   └── index.ts            # App entrypoint
├── tests/                  # Unit & integration tests
├── .env.example            # Example env vars
├── package.json
└── tsconfig.json
```

# ⚙️ Environment Variables

```bash env
PORT=5000
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# BTC conversion + payments
HIRO_API_URL=https://api.hiro.so
BTC_PRICE_API=https://api.coindesk.....

# Webhooks / events
WEBHOOK_SECRET=your_webhook_secret
```

## 📡 API Overview

### Main Routes Exposed

- **POST** `/auth/register` → Register merchant
- **POST** `/auth/login` → Login
- **POST** `/business` → Create/update business info
- **POST** `/payment-links` → Create new payment link
- **GET** `/payments/:id` → Get payment details
- **POST** `/webhooks` → Handle webhook events

👉 Full API docs available at **[Docs](https://zenvid.gitbook.io/muna-pay)**

🤝 Contributing

Contributions are welcome!
Please fork the repo and open a PR.

📜 License

MIT © MunaPay
