# SwiftFund Backend

This is the backend for the SwiftFund application, built with Node.js, Express, and MongoDB. It provides APIs for user authentication, email verification, password reset, session management, and user balance management.

---

## Features

### 1. **User Registration**
- **Endpoint**: `POST /api/users/register`
- **Description**: Allows users to register by providing their full name, email, and password.
- **Validation**:
  - Email must be valid.
  - Password must be at least 6 characters long.
- **Process**:
  - Checks if the email is already registered.
  - Hashes the password before saving it to the database.
  - Generates a verification token and sends a verification email to the user.

---

### 2. **Email Verification**
- **Endpoint**: `GET /api/users/verify/:token`
- **Description**: Verifies the user's email using a token sent during registration.
- **Process**:
  - Finds the user by the verification token.
  - Marks the user as verified if the token is valid.
  - Returns an HTML response with a button to redirect to the login page.

---

### 3. **User Login**
- **Endpoint**: `POST /api/users/login`
- **Description**: Authenticates users by verifying their email and password.
- **Validation**:
  - Email must be valid.
  - Password must not be empty.
- **Process**:
  - Checks if the user exists and if the password matches.
  - Ensures the user has verified their email before allowing login.
  - Returns user details and session information.

---

### 4. **Forgot Password**
- **Endpoint**: `POST /api/users/forgot-password`
- **Description**: Sends a password reset link to the user's email.
- **Validation**:
  - Email must be valid.
- **Process**:
  - Generates a reset token and saves it to the user's record with an expiration time.
  - Sends a reset email with a link containing the token.

---

### 5. **Reset Password**
- **Endpoint**: `POST /api/users/reset-password/:token`
- **Description**: Allows users to reset their password using a token.
- **Validation**:
  - Password must be at least 6 characters long.
- **Process**:
  - Verifies the reset token and its expiration.
  - Hashes the new password and updates the user's record.
  - Clears the reset token and expiration fields after a successful reset.

---

### 6. **User Profile Management**
- **Endpoints**:
  - `GET /api/users/profile`: Fetches the authenticated user's profile.
  - `PUT /api/users/profile`: Updates the authenticated user's profile.
- **Description**:
  - Allows users to view and update their profile information.
- **Validation**:
  - Ensures the email is unique when updating.
- **Process**:
  - Fetches or updates the user's profile based on the provided data.

---

### 7. **User Balance Management**
- **Endpoints**:
  - `GET /api/users/balance`: Fetches the authenticated user's balance.
  - `PUT /api/users/balance`: Updates the authenticated user's balance.
- **Description**:
  - Allows users to view and update their account balance.
- **Validation**:
  - Ensures the balance update amount is a valid number and not negative.
- **Process**:
  - Fetches or updates the user's balance based on the provided data.

---

### 8. **Logout**
- **Endpoint**: `POST /api/users/logout`
- **Description**: Logs out the authenticated user by clearing their session.
- **Process**:
  - Clears the session and sends a success response.

---

### 9. **Session Management**
- **Middleware**: `express-session`
- **Description**:
  - Manages user sessions for authenticated routes.
  - Stores session data securely with options for expiration and HTTP-only cookies.

---

### 10. **Error Handling**
- **Middleware**: `errorHandler.js`
- **Description**: Centralized error-handling middleware to catch and handle errors across the application.
- **Process**:
  - Logs the error stack to the console.
  - Returns a JSON response with the error message and status code.

---

### 11. **Email Functionality**
- **Utilities**:
  - `sendVerificationEmail.js`: Sends email verification links to users during registration.
  - `sendResetEmail.js`: Sends password reset links to users who request a password reset.
- **Email Service**: Uses `nodemailer` with Gmail for sending emails.
- **Environment Variables**:
  - `EMAIL_USER`: The email address used to send emails.
  - `EMAIL_PASS`: The password or app-specific password for the email account.

---

### 12. **MongoDB Integration**
- **Database**: MongoDB
- **Model**: `User.js`
  - Fields:
    - `fullname`: User's full name.
    - `email`: User's email address (unique).
    - `password`: User's hashed password.
    - `isAdmin`: Boolean indicating if the user is an admin.
    - `isVerified`: Boolean indicating if the user's email is verified.
    - `verificationToken`: Token for email verification.
    - `resetPasswordToken`: Token for password reset.
    - `resetPasswordExpires`: Expiration time for the reset token.
    - `balance`: User's account balance.
  - **Password Hashing**:
    - Passwords are hashed using `bcrypt` before saving.

---

### 13. **Security**
- **CORS**:
  - Configured to allow requests from the frontend URL (`http://localhost:5173`).
- **Helmet**:
  - Used to set secure HTTP headers.
- **Rate Limiting**:
  - Limits each IP to 100 requests per 15 minutes to prevent abuse.

---

### 14. **Environment Variables**
- **File**: `.env`
- **Variables**:
  - `MONGO_URI`: MongoDB connection string.
  - `PORT`: Port for the server.
  - `EMAIL_USER`: Email address for sending emails.
  - `EMAIL_PASS`: Password or app-specific password for the email account.
  - `BASE_URL`: Backend base URL.
  - `FRONTEND_URL`: Frontend base URL.
  - `SESSION_SECRET`: Secret key for session management.

---

## Project Structure

---

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd swiftfund_backend


2. Install dependencies:
   ```bash
   npm install 

3. Create a .env file in the  root directory and add the following:

4. run the server.js file:
   ```bash
   node server.js


## License
This project is licensed under the MIT License.


## Dependencies
express: Web framework for Node.js.


mongoose: MongoDB object modeling tool.


nodemailer: Email sending utility.


bcryptjs: Password hashing.


dotenv: Environment variable management.


express-validator: Input validation.


helmet: Security middleware.


cors: Cross-Origin Resource Sharing.


express-session: Session management.


express-rate-limit: Rate limiting middleware.
