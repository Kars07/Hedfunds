# SwiftFund Frontend

This is the frontend for the SwiftFund application, a decentralized platform for peer-to-peer lending and borrowing built on the Cardano blockchain. The frontend is developed using **React** , **vite** and **TypeScript** with **TailwindCSS** for styling.

---

## Features

### 1. **User Authentication**
- **Registration**: Users can sign up with their full name, email, and password.
- **Login**: Secure login with email and password.
- **Password Reset**: Users can reset their password via email.
- **Email Verification**: Users must verify their email before accessing the platform.

### 2. **Dashboard**
- **Profile Management**: Users can view and update their profile information.
- **Balance Management**: Users can view and update their account balance.
- **Loan Management**: Borrowers can apply for loans, and lenders can fund them.

### 3. **Interactive UI**
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Animations**: Smooth transitions and hover effects for an engaging user experience.
- **SVG Animations**: Dynamic SVG animations for visual appeal.

### 4. **Blockchain Integration**
- **Smart Contracts**: Loan requests and repayments are handled securely using Cardano smart contracts.
- **Transparency**: All transactions are immutable and auditable on the blockchain.

### 5. **Informational Pages**
- **About**: Learn about the team and the mission of SwiftFund.
- **Docs**: Comprehensive documentation for users and developers.
- **Contact**: Reach out to the SwiftFund team for support or inquiries.

---

## Project Structure

```bash
swiftfund_frontend/
├── public/                          # Static assets (images, videos, fonts)
│   ├── index.html                   # Main HTML file
│   ├── logo.png                     # Logo file (example)
│   └── [other-static-assets]        # Other static files (e.g., videos, fonts)
│
├── src/                             # Source code
│   ├── api/                         # Axios instance for API calls
│   │   └── axiosInstance.js         # API setup (Axios instance for calls)
│   │
│   ├── assets/                      # Images and other assets
│   │   ├── logo.png                 # Image assets (example)
│   │   └── [other-assets]           # Other asset files (icons, etc.)
│   │
│   ├── components/                  # Reusable React components
│   │   ├── Header.tsx               # Example reusable component
│   │   ├── Footer.tsx               # Another reusable component
│   │   └── [other-components]       # Additional reusable components
│   │
│   ├── pages/                       # Page-level components
│   │   ├── HomePage.tsx             # Home page component
│   │   ├── LoginPage.tsx            # Login page component
│   │   ├── RegisterPage.tsx         # Registration page component
│   │   └── [other-pages]            # Other page components (e.g., About, Dashboard)
│   │
│   ├── gradient-text/               # Custom CSS for gradient text
│   │   └── gradientText.css         # Styles for gradient text effect
│   │
│   ├── App.tsx                      # Main application component
│   ├── main.tsx                     # Entry point for the React app
│   ├── index.css                    # Global styles (tailwind + custom CSS)
│   └── [other-js-or-css-files]      # Other files like helpers, hooks, utilities, etc.
│
├── .env                              # Environment variables (API URL, etc.)
├── package.json                      # Dependencies and scripts
├── tailwind.config.js                # TailwindCSS configuration
└── README.md                         # Project documentation

 ```


---

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd swiftfund_frontend


2.  Install dependencies:
    ```bash
    npm install


3. Create a .env file in the root directory and add the following:
   ```bash
   VITE_API_URL=http://localhost:5000


4. Start the development server:
   ```bash
   npm run dev


5. Open the application in your browser at http://localhost:5173




---

## Technologies Used
React: Frontend library for building user interfaces.

Vite: a fast, modern frontend build tool that offers instant startup, lightning-fast hot module replacement, and optimized production builds with minimal configuration.


TailwindCSS: Utility-first CSS framework for styling.


Axios: HTTP client for API requests.


React Router: For routing and navigation.


## Scripts
npm run dev: Start the development server.

npm run build: Build the application for production.

npm run preview: Preview the production build.


## Environment Variables
The following environment variables are used in the project:

REACT_APP_API_URL: The base URL for the backend API.
