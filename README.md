# Sustain-Tech 2026: Tactical Decision Simulation System

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

**Sustain-Tech 2026** is a high-concurrency, real-time multiplayer tactical decision simulation platform developed for the **Annual Research Symposium 2026**.

---

## 🏛️ System Architecture & Engineering

This software system and decision engine was designed, architected, and developed by:

### **OneX Universe (Pvt) Ltd**
*Enterprise Software, Simulation Engines & Tactical Multi-Agent Platforms*

---

## ⚡ Core Platform Capabilities

- **Turn-Based Simulation Engine**: 10 sequential operational decision cycles with cascading scenario state evaluations and trade-off matrices.
- **Resource Equilibrium Matrix**: Multi-variable constraint modeling optimizing operational resources, budget allocations, and resilience metrics under pressure.
- **Real-Time Multiplayer Concurrency Guard**: Distributed session synchronization with atomic optimistic state locks, supporting 200+ concurrent players simultaneously.
- **Practice Gaming Challenge**: Zero-login client-side sandbox featuring 3 interactive decision stages with instant analytical debriefings.
- **Forensic Audit & Telemetry Suite**: Live tournament leaderboard, administrative investigations, and automated anti-tampering verification.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 6.0+ (Local or MongoDB Atlas)

### Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   ```

3. **Seed Database:**
   ```bash
   npx tsx scripts/seed.ts
   npx tsx scripts/seedConfig.ts
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 Copyright & Attribution

Designed and Engineered by **OneX Universe (Pvt) Ltd** for the **Annual Research Symposium 2026**.  
All rights reserved.
