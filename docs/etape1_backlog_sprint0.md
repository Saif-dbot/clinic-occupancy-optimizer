# Backlog de lancement - Etape 1 vers MVP

## Priorite globale
- P0: indispensable pour MVP.
- P1: tres important pour pilote.
- P2: optimisation.

## Sprint 0 (S1-S2) - Cadrage et fondations

### User stories metier
1. [P0] En tant qu admin, je peux configurer les sites et specialites.
   - Critere: un site actif peut etre associe a plusieurs praticiens.

2. [P0] En tant que secretaire, je peux ouvrir des creneaux par praticien.
   - Critere: les creneaux se chevauchant sont refuses.

3. [P0] En tant que patient, je peux reserver un rendez-vous disponible.
   - Critere: reservation atomique et confirmation immediate.

4. [P0] En tant que systeme, je calcule un score no-show sur chaque rendez-vous.
   - Critere: score stocke avec facteurs et version de modele.

5. [P1] En tant que secretaire, je vois les rendez-vous a risque en priorite.
   - Critere: tri decroissant par risque dans le dashboard.

6. [P1] En tant qu admin, je consulte les KPI no-show et occupation.
   - Critere: vue quotidienne et hebdomadaire par site.

### Taches techniques
1. [P0] Definir schema DB V1 et contraintes d integrite.
2. [P0] Creer contrats API pour rendez-vous et annulations.
3. [P0] Mettre en place RBAC de base (admin/secretaire/medecin).
4. [P1] Integrer service de notifications (email + SMS).
5. [P1] Creer jobs asynchrones de rappels.
6. [P1] Exposer endpoint dashboard KPI V1.
7. [P2] Ajouter traces detaillees pour analytics no-show.

## Definition of Ready (DoR)
- User story decrite avec criteres d acceptation.
- Dependances identifiees.
- Donnees d entree connues.
- KPI impacte precise.

## Definition of Done (DoD)
- Tests unitaires passes.
- Tests integration passes.
- Journal audit ajoute pour actions critiques.
- Documentation API mise a jour.
- Demo fonctionnelle validee par metier.

## Planning execution recommande
- Daily 15 min (tech + metier).
- Revue hebdo KPI et blocages.
- Demo de fin de sprint sur parcours A, B, C.
