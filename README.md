# B.R. International School — Admin Portal

A complete, production-ready school administration system built using the MERN stack (MongoDB, Express, React, Node.js). This portal manages student admissions, profile tracking, ID card generation, transfer certificates, and fee collections.

---

## Technical Architecture & Highlights

### 1. Two-Tier Image Compression Strategy
To accommodate both low-bandwidth listing views and crisp print/export templates without redundant storage uploads, all student photos go through a unified upload-time processing utility:

*   **Tier 1: Master Asset (`photo.url`)**
    *   Uploaded via Cloudinary. Caps largest dimension at `1920px` (or `2000px` for scanned documents) with `quality: 'auto:good'` and `fetch_format: 'auto'`.
    *   This master asset is the original quality version used for ID Card printing, Transfer Certificates, Student Details Forms, and full-resolution profile views.
*   **Tier 2: Thumbnail Derivative (`photo.thumbnailUrl`)**
    *   Generated on-the-fly via Cloudinary URL transformation params: `w_150,h_150,c_fill,g_face,q_auto:eco,f_auto`.
    *   Uses Cloudinary's face-detection gravity (`g_face`) so thumbnails remain centered on the student's face.
    *   Saved in MongoDB for lists (Students Table, search widgets) to decrease rendering latencies and bandwidth overhead.

### 2. Atomic Document Numbering (Counter Pattern)
To ensure concurrent requests do not cause duplicate document serials, receipt IDs, or transfer certificate sequences, the portal implements a MongoDB-backed atomic counter pattern utilizing Mongoose's `findOneAndUpdate` with the `$inc` operator:
*   **Student Serial format:** `BRIS-{YEAR}-{seq padded to 4 digits}` (e.g. `BRIS-2026-0001`). The sequence resets or increments per academic year counter key (`student_serial_{academicYear}`).
*   **Fee Receipt format:** `RCPT-{YEAR}-{seq padded to 4 digits}`.
*   **Transfer Certificate format:** `TC-{YEAR}-{seq padded to 4 digits}`.

### 3. Secure Admin Seeding
For security compliance, the portal **does not** expose public user signup endpoints. Admin logins are handled strictly using seeded accounts. The system will look for `ADMIN_EMAIL` and `ADMIN_PASSWORD` inside the server configuration on startup. If these credentials are not set, the server will crash on initialization rather than loading insecure default settings.

---

## Folder Structure

```
br-school-portal/
├── client/                 # React 19 Frontend (Vite, TailwindCSS)
└── server/                 # Express.js Backend (Node.js, MongoDB)
```

---

## Prerequisites
*   Node.js (v18+)
*   npm
*   MongoDB Atlas Account
*   Cloudinary Account

---

## Environment Configuration

Create a `.env` file in the `server/` directory based on the template below:

### `server/.env`
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/br-school
PORT=5000
JWT_SECRET=your_jwt_secret_minimum_32_characters
CLIENT_URL=http://localhost:5173
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_EMAIL=
ADMIN_PASSWORD=

SCHOOL_NAME=
SCHOOL_CODE=
SCHOOL_ADDRESS=
SCHOOL_PHONE_1=
SCHOOL_PHONE_2=
```

---

## Getting Started

### 1. Seeding the First Admin
Ensure you have added `ADMIN_EMAIL` and `ADMIN_PASSWORD` inside your `server/.env` file. On running the backend, the server will automatically detect if the administrator database is empty. If empty, it will seed a new Admin record hashed using `bcryptjs` and output a success confirmation to the logs.

### 2. Running the Backend
```bash
cd server
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 3. Running the Frontend
Copy your school logo asset to the path: `client/public/logo.png`.
```bash
cd client
npm install
npm run dev
```
The client app runs on `http://localhost:5173`.

---

## Custom Printing & PDF Exports
*   **Direct Printing**: Renders via `react-to-print` mapping standard templates directly to browser print views (configured for standard portrait A4 sizes).
*   **PDF Generation**: Uses `html2canvas` combined with `jsPDF` using `scale: 3` to capture clean, high-resolution on-screen visuals into standard PDF vector pages, preserving colors and sharp details.
