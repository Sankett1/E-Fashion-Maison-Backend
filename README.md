# E-Fashion MAISON — Backend API

Express + MongoDB REST API for E-Fashion Maison.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev   # → http://localhost:5000
```

## API Endpoints

### Auth `/api/auth`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login, returns JWT |
| POST | `/logout` | No | Clear cookie |
| GET | `/me` | Yes | Get current user |
| PUT | `/update-profile` | Yes | Update name/phone |
| PUT | `/change-password` | Yes | Change password |
| PUT | `/avatar` | Yes | Upload avatar |
| POST | `/address` | Yes | Add address |
| DELETE | `/address/:id` | Yes | Remove address |

### Products `/api/products`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | No | List products (filters, pagination) |
| GET | `/featured` | No | Featured products |
| GET | `/:id` | No | Single product |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/review` | Yes | Add review |
| PUT | `/:id/wishlist` | Yes | Toggle wishlist |

### Orders `/api/orders`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | Yes | Create order |
| GET | `/my-orders` | Yes | My orders |
| GET | `/:id` | Yes | Order by ID |
| PUT | `/:id/pay` | Yes | Mark paid |
| GET | `/admin/all` | Admin | All orders |
| GET | `/admin/stats` | Admin | Order stats |
| PUT | `/:id/status` | Admin | Update status |

### Admin `/api/admin`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/dashboard` | Admin | Stats + recent orders |
| GET | `/users` | Admin | All users |
| PUT | `/users/:id` | Admin | Update role |
| DELETE | `/users/:id` | Admin | Deactivate user |
| GET | `/revenue-chart` | Admin | Revenue by month |

## MongoDB Models

- **User** — name, email, password (bcrypt), role (user/admin), addresses, wishlist
- **Product** — name, price, category, sizes, colors, images (Cloudinary), reviews
- **Order** — items, shippingAddress, payment, status, amounts

## Coupon Codes
- `MAISON10` — 10% off any order

## Seed Data
```bash
node utils/seed.js   # Seeds sample products
```
