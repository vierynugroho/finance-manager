# Finance Manager

Aplikasi web pengelolaan keuangan pribadi yang lengkap dengan fitur tracking income/expense, dashboard analytics, dan visualisasi data.

## ✨ Features

### Core Features
- 🔐 **Authentication System** - Login & Register dengan NextAuth.js
- 📊 **Dashboard Analytics** - Overview keuangan dengan charts interaktif
- 💰 **Transaction Management** - Catat pemasukan dan pengeluaran
- 🏷️ **Category Management** - Kategorisasi transaksi dengan warna custom
- 🌓 **Dark/Light Theme** - Theme switcher dengan next-themes
- ⚙️ **Settings** - Profile management

### Dashboard Features
- Summary cards (Total Income, Expense, Balance)
- Line chart untuk monthly trend (6 bulan terakhir)
- Pie chart untuk expenses by category
- Recent transactions list

### Transaction Features
- Add/Edit/Delete transactions
- Filter by type (Income/Expense)
- Category selection
- Date & description
- Pagination support

### Category Features
- Create custom categories
- Color picker untuk visual organization
- Separate income & expense categories
- Delete with validation

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## 📦 Installation

1. **Dependencies sudah terinstall**

2. **Setup PostgreSQL Database**

Pastikan PostgreSQL sudah terinstall dan running. Buat database baru:
```bash
createdb finance_db
```

Atau gunakan psql:
```sql
CREATE DATABASE finance_db;
```

3. **Configure Environment Variables**

File `.env` sudah ada. Update kredensial database jika berbeda:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

Generate secret key untuk production:
```bash
openssl rand -base64 32
```

4. **Setup Database dengan Prisma**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio untuk melihat data
npx prisma studio
```

5. **Run Development Server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🚀 Usage

### First Time Setup

1. **Register Account**
   - Akses `/register`
   - Buat akun dengan email, password, dan nama

2. **Login**
   - Login dengan kredensial yang sudah dibuat

3. **Setup Categories**
   - Pergi ke menu "Categories"
   - Buat kategori untuk income (misal: Salary, Freelance, Investment)
   - Buat kategori untuk expense (misal: Food, Transport, Utilities, Entertainment)

4. **Add Transactions**
   - Pergi ke menu "Transactions"
   - Klik "Add Transaction"
   - Isi detail transaksi dan pilih kategori
   - Data akan otomatis muncul di dashboard

## 📱 Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard dengan analytics
- `/transactions` - Transaction management
- `/categories` - Category management
- `/settings` - Profile settings

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Colorful & Modern** - Gradient backgrounds dan smooth transitions
- **Dark Mode Support** - Automatic theme switching
- **Interactive Charts** - Hover tooltips dan visual feedback

## 🗄️ Database Schema

### User
- id, name, email, password, image, currency
- Relations: categories[], transactions[]

### Category
- id, name, type (INCOME/EXPENSE), color, icon
- Relations: user, transactions[]

### Transaction
- id, amount, description, date, type (INCOME/EXPENSE)
- Relations: user, category

## 🔒 Security

- Passwords di-hash dengan bcrypt
- Session management dengan JWT
- Protected routes dengan middleware
- SQL injection protection via Prisma

## 🎯 Future Enhancements

- Export data to CSV/Excel
- Budget planning & alerts
- Recurring transactions
- Multi-currency support
- Financial reports & insights
- Transaction attachments

## 📄 License

MIT License

---

Built with ❤️ using Next.js, Prisma, and shadcn/ui
