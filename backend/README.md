# Digital Online Marketing Platform — Backend

Node.js + Express + PostgreSQL REST API

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, SMTP, and MoMo keys
```

### 4. Create database and run schema
```bash
createdb marketing_platform
npm run db:init
npm run db:seed   # seeds admin user + services
```

### 5. Start server
```bash
npm run dev       # development (nodemon)
npm start         # production
```

Server runs on `http://localhost:5000`

---

## Default Admin Credentials (from seed)
- Email: `admin@digitalmarketing.rw`
- Password: `Admin@1234`  ← **Change immediately after first login**

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new client |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| GET | `/api/auth/me` | Auth | Get current user |

### Services
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/services` | Public | List all services + packages |
| GET | `/api/services/:id` | Public | Single service |
| POST | `/api/services` | Admin | Create service |
| PUT | `/api/services/:id` | Admin | Update service |
| POST | `/api/services/:id/packages` | Admin | Upsert package tier |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/orders` | Auth | List orders (own for client) |
| GET | `/api/orders/:id` | Auth | Order detail |
| POST | `/api/orders` | Client | Request quote / place order |
| PATCH | `/api/orders/:id/quote` | Staff/Admin | Submit quote amount |
| PATCH | `/api/orders/:id/confirm` | Client | Accept quote → confirmed |
| PATCH | `/api/orders/:id/status` | Staff/Admin | Update status |
| PATCH | `/api/orders/:id/cancel` | Auth | Cancel order |
| POST | `/api/orders/:id/milestones` | Staff/Admin | Add milestone |
| PATCH | `/api/orders/:id/milestones/:mid` | Staff/Admin | Complete milestone |
| POST | `/api/orders/:id/deliverables` | Staff/Admin | Upload deliverable file |
| PATCH | `/api/orders/:id/deliverables/:did` | Client | Approve/request revision |
| GET | `/api/orders/:id/milestones` | Auth | List milestones |
| GET | `/api/orders/:id/deliverables` | Auth | List deliverables |

### Messages
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/orders/:orderId/messages` | Auth | Get thread |
| POST | `/api/orders/:orderId/messages` | Auth | Send message (+ optional file) |

### Invoices & Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/invoices` | Auth | List invoices |
| GET | `/api/invoices/:id` | Auth | Invoice detail |
| POST | `/api/invoices/:id/pay` | Client | Initiate MoMo/card payment |
| POST | `/api/invoices/:id/pay/callback` | Gateway | MoMo webhook |
| GET | `/api/invoices/:id/receipt` | Auth | Payment receipt |

### Profile
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/profile` | Auth | Get profile |
| PUT | `/api/profile` | Auth | Update profile |
| PUT | `/api/profile/password` | Auth | Change password |

### Portfolio
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/portfolio` | Public | List published items |
| GET | `/api/portfolio/:id` | Public | Single item |
| POST | `/api/portfolio` | Editor/Admin | Create item |
| PUT | `/api/portfolio/:id` | Editor/Admin | Update item |
| DELETE | `/api/portfolio/:id` | Admin | Delete item |

### Blog
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/blog` | Public | List published posts (paginated) |
| GET | `/api/blog/:slug` | Public | Single post |
| POST | `/api/blog` | Editor/Admin | Create post |
| PUT | `/api/blog/:id` | Editor/Admin | Update post |
| DELETE | `/api/blog/:id` | Admin | Delete post |

### Contact & Testimonials
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/contact` | Public | Submit contact form |
| GET | `/api/contact` | Staff/Admin | View submissions |
| GET | `/api/contact/testimonials` | Public | List testimonials |
| POST | `/api/contact/testimonials` | Admin | Add testimonial |
| PUT | `/api/contact/testimonials/:id` | Admin | Update testimonial |
| DELETE | `/api/contact/testimonials/:id` | Admin | Delete testimonial |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users` | Admin | All users |
| PATCH | `/api/admin/users/:id` | Admin | Update role/status |
| DELETE | `/api/admin/users/:id` | Admin | Deactivate user |
| GET | `/api/admin/analytics` | Admin | Summary dashboard data |
| GET | `/api/admin/audit-logs` | Admin | Audit trail |
| GET | `/api/admin/export/clients` | Admin | CSV export |
| GET | `/api/admin/export/orders` | Admin | CSV export |
| GET | `/api/admin/export/payments` | Admin | CSV export |

---

## Order Status Flow
```
requested → quoted → confirmed → in_progress → in_review → completed
                                                          ↘ cancelled (from requested/quoted/confirmed)
```

## Roles
`client` · `staff` · `editor` · `finance` · `admin`
