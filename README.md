# Chem-Clues

[![Framework](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

![image atl](https://github.com/seaman0012/chem-clues/blob/c456105743584a02d4be1db47838eeea48b3a98f/showcase.png)

Interactive web platform for dispense clue.  

## Core 

*   **Query:** User can query their profile instantly by entering their Student ID.
*   **M:N Relationship:** Handle complex Many-to-Many relationships (e.g., one freshman linked to multiple seniors).
*   **Real-Time Countdown Clocks:** Client-side countdown timers ticking down to the next clue.

---

### Environment Configuration
To run this project, clone the repo and create a `.env.local` file containing your server credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

