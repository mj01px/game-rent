<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=250&color=1A1A1A&text=Game%20Rent&section=header&reversal=false&textBg=false&fontColor=C8F135"/>

  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=22&pause=1000&color=C8F135&background=00000000&width=500&lines=Rent+games.+Play+now.+Return+later.;Full-Stack+Django+%2B+React+Project.;JWT+Auth+%7C+Admin+Panel+%7C+Email+Flow." alt="Typing SVG" />

  <br/>

  <p>
    <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
    <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  </p>
</div>

<br/>

---

## About the Project

```javascript
const gameRent = {
  description: "Digital game rental platform",
  stack: {
    backend:  ["Django 6", "Django REST Framework", "JWT Auth", "SQLite"],
    frontend: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "Axios"],
  },
  features: ["Game catalog", "Rentals with activation keys", "Admin portal", "Email verification"],
  author: "Mauro Junior",
};
```

**Game Rent** is a full-stack application where users can rent digital games for a set period and receive activation keys directly on the platform. It includes a complete admin panel for managing games, users, and refunds.

---

## Project Structure

```
game-rent/
├── game-rent-api/     # Django REST API
└── game-rent-app/     # React Frontend
```

---

## ⚙️ Getting Started

### Backend

```bash
# Clone the repository
git clone https://github.com/mj01px/game-rent.git
cd game-rent/game-rent-api

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

> API available at: `http://localhost:8000`

### Frontend

```bash
cd game-rent-app
npm install
npm run dev
```

> App available at: `http://localhost:5173`

---

## Environment Variables

Create a `.env` file inside `game-rent-api/`:

```env
SECRET_KEY=your_secret_key_here
DEBUG=True
FRONTEND_URL=http://localhost:5173

# Email (Brevo SMTP)
EMAIL_HOST_USER=your_email@brevo.com
EMAIL_HOST_PASSWORD=your_smtp_password
DEFAULT_FROM_EMAIL=noreply@gamerent.com
```
---

## Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center"> For Users</h3>
      <ul>
        <li>Register & login with email verification</li>
        <li>Game catalog with filters and sorting</li>
        <li>Favorites synced to account</li>
        <li>Cart with rental duration selection</li>
        <li>Checkout with Card, Pix & PayPal</li>
        <li>Activation keys delivered after payment</li>
        <li>Rental history & refund requests</li>
        <li>Profile with avatar, username & email change</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center"> For Admins</h3>
      <ul>
        <li>Full game management (create, edit, delete)</li>
        <li>Add and manage activation keys</li>
        <li>View all rentals across users</li>
        <li>User management with password reset</li>
        <li>Approve or reject refund requests</li>
      </ul>
    </td>
  </tr>
</table>

---

##  Tech Stack

<div align="center">

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST-ff1709?style=for-the-badge&logo=django&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

</div>

---

<div align="center">

  ### Built by Mauro Junior

  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mauroapjunior/)
  [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mj01px)

  <img src="https://capsule-render.vercel.app/api?type=waving&height=150&color=1A1A1A&section=footer&reversal=false"/>

</div>
