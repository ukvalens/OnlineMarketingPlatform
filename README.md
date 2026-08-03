# OnlineMarketingPlatform

Digital Online Marketing Platform — An Online Marketing and Business Promotion Website for Rwanda.

## Tech Stack
- **Frontend** — React.js
- **Backend** — Node.js + Express.js
- **Database** — PostgreSQL
- **Architecture** — Full-Stack Web Application

## Features
- Service catalog with Basic / Standard / Premium packages
- Client registration, authentication, and profile management
- Quote requests and order management with full status workflow
- Project tracking with milestones and deliverables
- In-platform messaging per order
- Online payments via MTN MoMo, Airtel Money, and Card
- Invoice and receipt generation in RWF
- Portfolio and case-study showcase
- Blog / resources section
- Admin dashboard with analytics, audit logs, and CSV exports
- Role-based access control: Visitor, Client, Staff, Editor, Finance, Admin

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm run db:init
npm run db:seed
npm run dev
```

See [backend/README.md](backend/README.md) for full API reference.
