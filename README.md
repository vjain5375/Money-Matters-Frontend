# Money Matters AI 🪙

[![Live Site](https://img.shields.io/badge/Live-moneymattersai.tech-8B5CF6?style=for-the-badge)](https://moneymattersai.tech)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Money Matters AI** is a premium, AI-powered personal finance and portfolio tracker designed specifically for Indian users. It empowers you to seamlessly monitor your expenses, track budgets, analyze stocks, and leverage machine learning to automate transaction categorization—helping you **know where every rupee goes**.

---

## Key Features 🚀

- **Smart Expense Classifier**: Automatically categorizes transactions (e.g., UPI, card payments) into standard Indian expense categories (Food & Dining, Shopping, Utilities, Investment, etc.) using machine learning.
- **Dynamic Budget Notifications**: Real-time evaluation of monthly spending limits. Displays warnings and alerts directly in the dashboard when you reach 80% or 100% of a budget limit.
- **Stock Analyzer & Portfolio Tracker**: Live stock searches, commodities pricing trackers, personalized Watchlists, and multi-asset Comparison matrices.
- **AI Price Prediction**: Powered by a custom forecasting model that provides actionable price direction analysis and confidence scores for selected stocks.
- **Premium Glassmorphic UI**: High-fidelity dark mode with smooth animations (Framer Motion), modern typography (Plus Jakarta Sans), and responsive layouts built with Ant Design.
- **Secure by Design**: Complete user authentication and row-level database security (RLS) managed via Supabase.

---

## Tech Stack 🛠️

- **Frontend Core**: React 19, Vite (Client Build Tool), React Router v7
- **UI & Layout**: Ant Design, custom CSS styling, Lucide React (vector icons), Framer Motion (micro-animations)
- **Data Visualization**: Recharts (interactive finance charts)
- **Backend Integrations**: Supabase client (DB & Auth), FastAPI server (Stock analysis, AI model predictions)

---

## Local Setup & Installation 💻

To run the frontend locally, follow these steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18+) installed.

### 2. Clone the Repository
```bash
git clone https://github.com/vjain5375/Money-Matters-Frontend.git
cd Money-Matters-Frontend
```

### 3. Setup Environment Variables
Create a local `.env` file in the root of the frontend folder:
```bash
cp .env.example .env
```
Fill in your Supabase connection parameters and Backend service URL endpoints inside the `.env` file:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
VITE_STOCK_API_URL=http://localhost:8001
VITE_API_URL=http://localhost:8001
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Deployment 🌐

### Production Build
To create a minified production bundle:
```bash
npm run build
```
This generates optimized assets in the `/dist` directory, ready to deploy to hosting services like Vercel, Netlify, or AWS.

---

## License 📄
This project is licensed under the MIT License - see the LICENSE file for details.
