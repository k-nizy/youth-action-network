# How to Run the YAN Platform

Follow these simple steps to start the platform on your local machine.

## Option 1: Automatic (Recommended)
Double-click the **`run-yan.bat`** file in the root folder.
- This will open two separate windows: one for the **Backend** and one for the **Frontend**.
- It will also automatically install any missing dependencies (node_modules) for you.

## Option 2: Manual (If the .bat file has issues)
If you prefer running it manually, follow these steps:

### 1. Start the Backend
1. Open a terminal/command prompt.
2. Navigate to the `backend` folder: `cd backend`
3. Run the server: `npm run dev`
   - *Backend will be active at [http://localhost:5000](http://localhost:5000)*

### 2. Start the Frontend
1. Open a **second** terminal/command prompt.
2. Navigate to the root folder (where this file is).
3. Run the frontend server: `npx serve frontend -l 8001`
   - *Frontend will be active at [http://localhost:8001](http://localhost:8001)*
   - *Important: do **not** use `-s` here. SPA mode rewrites `admin.html`/`profile.html`/`applicant.html` to extensionless paths and breaks dashboard routing.*

---

## Troubleshooting
- **Port already in use**: If you see an error saying a port is busy, close any existing terminal windows or restart your computer.
- **Missing modules**: If the "node_modules" folder is missing, run `npm install` in both the root and the `backend` folder.
