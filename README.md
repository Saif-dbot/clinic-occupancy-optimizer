# MediPlan - Optimisation des rendez-vous medicaux et reduction du no-show

MediPlan est une plateforme de gestion des rendez-vous medicaux orientee performance operationnelle.

Le projet cible 3 objectifs metier:
- reduire le taux de no-show,
- augmenter le taux d occupation des praticiens,
- reaffecter rapidement les creneaux annules via liste d attente.

## Pourquoi ce projet

Dans les centres de consultation, les absences patients et les annulations tardives creent:
- des pertes de revenu,
- des trous dans les agendas,
- une charge supplementaire pour le secretariat.

MediPlan repond a ce probleme avec des workflows operationnels clairs, des KPI actionnables et un socle technique evolutif.

## Fonctionnalites principales

### Frontend (Next.js)
- Authentification demo par role (admin, secretaire, medecin, client).
- Dashboard KPI (no-show, occupation, reaffectation, alertes).
- Gestion des rendez-vous (creation, annulation, confirmation, no-show).
- Agenda visuel multi-praticiens.
- Centre de risque (cas a haut risque no-show).
- Gestion de la liste d attente.
- Journal d audit.

### Backend OFS (FastAPI)
- `POST /appointments`
- `PATCH /appointments/{id}/cancel`
- `POST /waitlist/{siteId}/enqueue`
- `GET /dashboard/kpi`
- `POST /risk-score/recompute/{appointmentId}`

Regles metier clefs deja implementees:
- prevention du double booking,
- score no-show calcule et historise,
- plan d actions rappels selon niveau de risque,
- reouverture du slot et proposition a la liste d attente a l annulation,
- journal d audit sur les actions critiques.

## Architecture

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind.
- Backend: FastAPI + Pydantic.
- Persistance backend actuelle: in-memory (seed au demarrage).
- Schema cible de donnees: PostgreSQL (deja modele dans `db/schema_v1.sql`).

## Structure du repo

```text
.
|- app/                    # UI Next.js (routes App Router)
|- components/             # composants UI
|- contexts/               # contexte auth/session
|- lib/                    # mock API + donnees mock
|- backend/
|  |- app/                 # API FastAPI
|  |- requirements.txt
|  |- README.md
|- db/
|  |- schema_v1.sql        # schema SQL cible
|- docs/                   # cadrage metier, KPI, architecture, backlog
|- README.md               # ce fichier
```

## Demarrage rapide

### 1) Prerequis

- Node.js 20+
- pnpm
- Python 3.10+

### 2) Lancer le frontend

Depuis la racine du projet:

```bash
pnpm install
pnpm dev
```

Frontend disponible sur `http://localhost:3000`.

### 3) Lancer le backend

Dans un autre terminal (depuis la racine du projet):

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Backend disponible sur:
- API docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Comptes demo (frontend)

Mot de passe demo: `demo`

- `admin@clinique.fr`
- `secretaire@clinique.fr`
- `medecin@clinique.fr`
- `client@clinique.fr`

## Roles backend (RBAC stage actuel)

Le backend simule les roles via le header `x-role`:
- `admin`
- `secretaire`
- `client`

Exemple:

```bash
curl -H "x-role: admin" http://localhost:8000/dashboard/kpi
```

## Documentation projet

- Cadrage metier: `docs/etape1_cadrage_metier.md`
- Matrice KPI: `docs/etape1_matrice_kpi.md`
- Architecture technique: `docs/etape1_architecture_technique.md`
- Backlog de lancement: `docs/etape1_backlog_sprint0.md`
- OFS backend: `docs/ofs_backend.md`
- Schema SQL cible: `db/schema_v1.sql`

## Etat actuel et prochaine etape

Etat actuel:
- Frontend fonctionnel avec donnees/mock API.
- Backend OFS en FastAPI avec logique metier de base.
- Fondations metier, KPI et schema SQL deja definis.

Prochaine etape prioritaire:
- brancher le frontend sur les endpoints FastAPI,
- remplacer le store in-memory par PostgreSQL,
- ajouter workers de rappels et tests d integration.
