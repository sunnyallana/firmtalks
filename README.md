# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


FIRMTALKS/
│-- node_modules/
│-- public/
│   ├── firmtalks.svg
│-- server/
│   ├── models/
│   │   ├── discussionModel.js
│   │   ├── likeModel.js
│   │   ├── replyModel.js
│   │   ├── userModel.js
│   ├── routes/
│   │   ├── discussionRoutes.js
│   ├── socket/
│   │   ├── handler.js
│   ├── .env
│   ├── db.js
│   ├── index.js
│-- src/
│   ├── assets/
│   │   ├── firmtalks.svg
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard-charts.jsx
│   │   │   ├── dashboard-stats.jsx
│   │   ├── discussions/
│   │   │   ├── discussion-form.jsx
│   │   ├── layout/
│   │   │   ├── navbar.jsx
│   │   │   ├── theme-toggle.jsx
│   │   ├── ui/
│   │   │   ├── button.jsx
│   ├── lib/
│   │   ├── theme.js
│   │   ├── utils.js
│   ├── pages/
│   │   ├── discussionsPage.jsx
│   │   ├── malwareScannerPage.jsx
│   │   ├── platformStatisticsPage.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│-- .env
│-- .gitignore
│-- eslint.config.js
│-- index.html
│-- package-lock.json
│-- package.json
│-- postcss.config.js
│-- README.md
│-- tailwind.config.js
│-- vite.config.js
