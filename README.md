# ⚡ ERP Frontend (React 19 + TypeScript + Vite 8)

Production-ready enterprise frontend application powered by **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and the **React 19 Compiler**.

---

## 🌟 Architecture & Core Stack

- **⚛️ UI & Core:** [React 19](https://react.dev/) + [React DOM 19](https://react.dev/) with TypeScript.
- **⚡ Bundler & Dev Server:** [Vite 8](https://vitejs.dev/) with next-generation OXC engine.
- **🤖 React Compiler (Auto-Memoization):** Fully integrated via `@rolldown/plugin-babel` and `@vitejs/plugin-react` `reactCompilerPreset()`. Automatic fine-grained memoization with zero manual `useMemo` / `useCallback` boilerplate.
- **🎨 Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with native CSS-first configuration via `@tailwindcss/vite` and `tailwind.config.js`.
- **🧭 Routing:** [React Router v7](https://reactrouter.com/).
- **🌐 Data Fetching & Caching:** [TanStack Query v5](https://tanstack.com/query/latest) + [Axios](https://axios-http.com/).
- **🗃️ State Management:** [Zustand](https://zustand.docs.pmnd.rs/).
- **📄 Contract-Driven Types:** [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) for generating strict TypeScript definitions from schema contracts.
- **🛡️ Code Quality:** ESLint 10 Flat Config (`typescript-eslint`, React Hooks, React Refresh, Prettier Recommended).
- **💅 Formatting:** Prettier 3 with automated Tailwind class sorting (`prettier-plugin-tailwindcss`) and VS Code Format-on-Save.

---

## 📜 Available Scripts

| Command           | Description                                                                        |
| :---------------- | :--------------------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite local development server with Fast Refresh.                        |
| `npm run build`   | Compiles TypeScript (`tsc -b`) and builds production assets into `dist/`.          |
| `npm run preview` | Locally serves the production build.                                               |
| `npm run lint`    | Runs ESLint across the codebase (`eslint .`).                                      |
| `npm run format`  | Runs Prettier to format code and sort Tailwind CSS classes (`prettier --write .`). |
