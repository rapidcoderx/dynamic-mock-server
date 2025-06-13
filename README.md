# 🌊 Dynamic Mock Server

A sleek, modern mock server with a liquid-glass UI and dynamic API capabilities. Configure and simulate API responses easily for local testing, demos, or prototyping – all with a beautiful frontend and modular backend.

---

## ✨ Features

- 🧱 Create and register mocks with:
  - Unique name
  - Path, HTTP method
  - Optional headers (as JSON)
  - Custom response body (as JSON)
- 📦 File-based mock storage (`mockStore.json`)
- 👁️ Modal-based mock viewer with full details
- 🎨 Liquid glass theme UI using Tailwind CSS
- 🔌 Dynamic `apiPrefix` support (config-driven)
- 🛠️ Dev logs and validations for request matching
- 🧩 Modular architecture (`routes/`, `utils/`, `storageStrategy/`)

---

## 🛠️ Project Structure

```
/server
  ├── index.js                # Entry point
  ├── routes/
  │   └── mocks.js            # Register, list, match mocks
  ├── utils/
  │   ├── matcher.js          # Mock matching logic
  │   └── storageStrategy.js  # File-based storage logic

/public
  ├── index.html              # Liquid Glass frontend
  └── favicon.svg             # App icon
```

---

## 🚀 Getting Started

### 1. Install & Run

```bash
npm install
npm run dev
```

### 2. Access App

Open: [http://localhost:8080](http://localhost:8080)

---

## 🧪 Testing Mocks

### ✅ Via UI
- Add a mock via form.
- View all mocks in modal.
- Inspect details using "View" button.

### 📬 Via Postman (Coming up!)
- Collection will include:
  - GET, POST, PUT, DELETE samples
  - Header-matched mocks

### 🔧 Via HTTPie (Coming up!)
Example:

```bash
http POST http://localhost:8080/api/user x-mock-type:success
```

---

## ✅ Progress So Far

- [x] Node.js server with Express
- [x] Mock creation, listing, and matching
- [x] Liquid glass UI (Tailwind CSS)
- [x] Modal-based mock inspection
- [x] File-based mock storage
- [x] Dynamic config fetch (`/api/config`)
- [x] API structure and logs for debug

---

## 🧩 Pending (To Be Done)

- [ ] ✅ Auto-generate Postman collection from saved mocks
- [ ] ✅ Generate corresponding `httpie` test commands
- [ ] ✨ Add support for wildcard paths (e.g., `/api/user/*`)
- [ ] ✨ Allow query param-based mock resolution
- [ ] 🔐 Add dev/prod toggle for CORS & security middleware

---

## 🔮 Future Phases

### 📚 Phase 2: Persistence & Security
- DB support (SQLite, then Postgres)
- JWT-based admin panel
- Encrypted mock storage

### 🧠 Phase 3: Smart Mocks
- AI-based response suggestions
- Delay simulation, dynamic values (timestamp, UUIDs, etc.)
- Request history and logging panel

---

## 💡 Ideas for MVP+ Showcase

- 🔗 Export/import mocks
- 📊 Analytics of hit/mock usage
- 🧰 CLI tool to manage mocks (add/remove/reset)
- 📜 Swagger/OpenAPI to mock converter

---

Built with ❤️ by [Your Name] – feel free to fork, star, and extend!
