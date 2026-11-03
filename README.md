# CarePlus - Medical Clinic Booking System

CarePlus is a responsive medical clinic booking system that allows patients to book appointments online and provides an admin dashboard to manage appointments and clinic working hours.

## Features

### Patient Side
- Browse available appointment dates and time slots.
- View real-time appointment availability.
- Book appointments without creating an account.
- Automatically prevent booking already reserved time slots.
- View clinic working hours and available days.

### Admin Dashboard
- Secure admin authentication.
- View and manage patient appointments.
- Confirm, reject, or cancel appointments.
- View appointment statistics.
- Manage weekly clinic working hours.
- Update opening and closing times and appointment slot duration.
- Enable or disable specific working days.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Supabase
  - PostgreSQL Database
  - Supabase Authentication
  - Row Level Security (RLS)
  - Database Functions (RPC)

## Project Structure

```text
medical-clinic-system/
│
├── admin/
│   ├── dashboard.html
│   ├── dashboard.css
│   ├── dashboard.js
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── reset-password.html
│   └── reset-password.js
│
├── assets/
│
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore