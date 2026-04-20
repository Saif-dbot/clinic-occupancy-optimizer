# Presentation: comment l application fonctionne et plan de modification page par page

## 1) Vision rapide

MediPlan est une application web de gestion des rendez-vous medicaux orientee reduction du no-show.

Le projet est compose de:
- un frontend Next.js (interface utilisateur),
- un backend FastAPI (API metier),
- une couche de donnees mock cote frontend pour la demo actuelle.

## 2) Architecture actuelle

### 2.1 Frontend
- Point d entree global: app/layout.tsx
- Page de connexion: app/page.tsx
- Layout protege (app authentifiee): app/(app)/layout.tsx
- Navigation et shell: components/layout/app-shell.tsx
- Donnees de demo: lib/mock-api.ts + lib/mock-data.ts
- Session/role: contexts/app-context.tsx

### 2.2 Backend
- API FastAPI: backend/app/main.py
- Endpoints OFS:
  - POST /appointments
  - PATCH /appointments/{id}/cancel
  - POST /waitlist/{siteId}/enqueue
  - GET /dashboard/kpi
  - POST /risk-score/recompute/{appointmentId}

## 3) Flux fonctionnel (comment ca marche)

1. L utilisateur arrive sur la page de connexion (app/page.tsx).
2. Le contexte applicatif valide le login demo via mockUsers (contexts/app-context.tsx).
3. Une fois authentifie, l utilisateur est redirige vers /dashboard.
4. Le layout app/(app)/layout.tsx protege les routes (si non authentifie, retour /).
5. Chaque page appelle aujourd hui lib/mock-api.ts pour charger/modifier les donnees.
6. La navigation est pilotee par le role dans components/layout/app-shell.tsx.

## 4) Pages et responsabilites

1. app/page.tsx: connexion + quick login demo
2. app/(app)/dashboard/page.tsx: vue operationnelle globale
3. app/(app)/appointments/page.tsx: operations rendez-vous
4. app/(app)/agenda/page.tsx: planning visuel jour/semaine
5. app/(app)/waitlist/page.tsx: reaffectation des creneaux
6. app/(app)/risk-center/page.tsx: traitement des risques no-show
7. app/(app)/kpi/page.tsx: analyse KPI et tendances
8. app/(app)/audit/page.tsx: tracabilite des actions
9. app/(app)/settings/page.tsx: parametrage des regles/metriques

## 5) Plan de modification page par page

Objectif global: migrer progressivement des mocks frontend vers le backend FastAPI, sans casser l experience UI.

### Etape A - Fondations (avant les pages)
1. Creer une couche client API unique (lib/api-client.ts).
2. Ajouter une variable d environnement NEXT_PUBLIC_API_BASE_URL.
3. Definir un mode fallback mock pour la demo (si backend indisponible).

### Etape B - Modification page par page (ordre recommande)

1. Page connexion (app/page.tsx)
- Etat actuel: auth 100% mock.
- A faire:
  - garder login demo mais preparer branchement auth reelle ensuite,
  - gerer redirection si deja authentifie.

2. Dashboard (app/(app)/dashboard/page.tsx)
- A faire:
  - brancher KPI et alertes sur GET /dashboard/kpi,
  - conserver chart et cartes existantes.

3. Rendez-vous (app/(app)/appointments/page.tsx)
- A faire:
  - brancher creation/annulation/confirmation via API backend,
  - conserver filtres et tableau UI.

4. Agenda (app/(app)/agenda/page.tsx)
- A faire:
  - brancher la vue planning sur les slots et appointments backend,
  - garder le mode jour/semaine et les filtres existants.

5. Waitlist (app/(app)/waitlist/page.tsx)
- A faire:
  - brancher envoi d offre et acceptation/refus,
  - synchroniser les compteurs de cartes.

6. Risk center (app/(app)/risk-center/page.tsx)
- A faire:
  - brancher recompute no-show,
  - brancher actions de rappels et confirmations.

7. KPI, Audit, Settings
- KPI: brancher metriques backend avec alertes.
- Audit: brancher flux backend d audit logs.
- Settings: brancher sauvegarde des regles et seuils.

## 6) Premiere modification deja demarree

La page de connexion a ete amelioree pour rediriger automatiquement vers /dashboard si l utilisateur est deja authentifie.

Fichier modifie:
- app/page.tsx

## 7) Critere de validation par page

Pour chaque page migree:
1. UI identique ou meilleure.
2. Donnees chargees depuis backend en priorite.
3. Fallback mock optionnel en dev.
4. Gestion des erreurs reseau (toast + etat vide).
5. Role et permissions respectes.

## 8) Prochaine action immediate

Commencer la page 2 (Dashboard):
1. creer un adaptateur de donnees dashboard,
2. connecter GET /dashboard/kpi,
3. mapper le format API vers le format attendu par les composants KPI/graphs.
