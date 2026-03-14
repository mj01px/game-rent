<div align="center">

<br/>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=30&pause=1000&color=FFFFFF&center=true&vCenter=true&width=500&lines=+Game+Rent;Rent.+Play.+Return." alt="Typing SVG" />
</a>

<br/>

<p>
  <img src="https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-007ACC?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/>
</p>

</div>

<br/>

---

## `~/about`

```ts
const gameRent = {
  type:        "Full-Stack Web Application",
  backend:     ["Python", "Django 6", "Django REST Framework", "JWT", "SQLite"],
  frontend:    ["React 19", "TypeScript", "Vite", "Tailwind CSS", "Axios"],
  features:    ["Game catalog", "Digital rentals", "Activation keys", "Admin panel", "Email flow"],
  author:      "Mauro Junior · github.com/mj01px",
} as const;
```

**Game Rent** is a full-stack platform where users can rent digital games for a fixed period and receive activation keys instantly. Built with a RESTful Django API and a React + TypeScript frontend, it includes a complete admin dashboard for managing the entire catalog, users, and refund requests.

```
game-rent/
├── game-rent-api/     # Django REST API  →  http://localhost:8000
└── game-rent-app/     # React Frontend  →  http://localhost:5173
```

---

## `~/features`

<table>
  <tr>
    <td valign="top" width="50%">
      <b>👤 Users</b><br/><br/>
      <ul>
        <li>Register & login with email verification</li>
        <li>Catalog with search, filters & sorting</li>
        <li>Favorites synced to account</li>
        <li>Cart with duration selector — <code>1w · 2w · 1mo</code></li>
        <li>Checkout — Card, Pix & PayPal</li>
        <li>Activation keys delivered on payment</li>
        <li>Rental history & refund requests</li>
        <li>Profile — avatar, username, email & password</li>
      </ul>
    </td>
    <td valign="top" width="50%">
      <b>🛠️ Admins</b><br/><br/>
      <ul>
        <li>Full game CRUD with key management</li>
        <li>Complete rentals overview</li>
        <li>User management & password reset</li>
        <li>Refund approval / rejection</li>
      </ul>
      <br/>
      <b>📧 Email Flow</b><br/><br/>
      <ul>
        <li>Account email verification on register</li>
        <li>Email & password change confirmation</li>
        <li>Admin-triggered password reset</li>
      </ul>
    </td>
  </tr>
</table>

---

## `~/getting-started`

### Backend

```bash
cd game-rent-api

# Setup
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux / macOS

# Install & run
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver     # → http://localhost:8000
```

### Frontend

```bash
cd game-rent-app
npm install && npm run dev     # → http://localhost:5173
```

---

## `~/environment`

Create `.env` inside `game-rent-api/`:

```env
# Django
SECRET_KEY=your_secret_key_here
DEBUG=True

# URLs
FRONTEND_URL=http://localhost:5173

# Email — Brevo SMTP
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your_smtp_password
DEFAULT_FROM_EMAIL=noreply@gamerent.com
```

> **Tip:** generate a secure `SECRET_KEY` with:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

## `~/stack`

<div align="center">

| Layer | Technologies |
|-------|-------------|
| **Backend** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white) ![DRF](https://img.shields.io/badge/DRF-ff1709?style=flat-square&logo=django&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) |
| **Database** | ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) |
| **Email** | ![Brevo](https://img.shields.io/badge/Brevo_SMTP-0B996E?style=flat-square&logo=sendinblue&logoColor=white) |

</div>

---

<div align="center">
  <br/>
  <sub>
    Built by <a href="https://github.com/mj01px"><strong>Mauro Junior</strong></a>
    &nbsp;·&nbsp;
    <a href="https://www.linkedin.com/in/mauroapjunior/">LinkedIn</a>
  </sub>
  <br/><br/>
</div>
