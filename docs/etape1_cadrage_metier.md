# Etape 1 - Cadrage metier (S1-S2)

## 1) Objectif produit
Construire une plateforme de gestion des rendez-vous medicaux qui:
- reduit le taux de no-show,
- augmente le taux d occupation des praticiens,
- reaffecte rapidement les creneaux annules,
- mesure l impact business avec des KPI clairs.

## 2) Perimetre V1
### In scope
- Agenda multi-sites et multi-praticiens.
- Reservation, annulation et report de rendez-vous.
- Rappels automatiques email et SMS.
- Scoring no-show v0 (regles + historique simple).
- Liste d attente et proposition automatique de creneaux liberes.
- Tableau de bord operationnel (KPI quotidiens).

### Out of scope (phase suivante)
- Facturation et tiers payant.
- Teleconsultation video integree.
- Integrations avancees SIH (HL7/FHIR complet).
- Optimisation no-show par modele ML avance en production multi-sites.

## 3) Acteurs et besoins
- Patient: reserver vite, recevoir des rappels, reprogrammer facilement.
- Secretaire: remplir les creneaux, gerer les annulations, prioriser les actions.
- Medecin: visualiser son planning fiable et limiter les trous de consultation.
- Admin de centre: suivre KPI, regler les parametres de no-show, auditer les actions.

## 4) Parcours critiques
### Parcours A - Reservation standard
1. Le patient choisit site, specialite, praticien et creneau.
2. Le systeme verifie disponibilite et cree le rendez-vous.
3. Le patient recoit confirmation et rappel programme.

Critere d acceptation:
- un creneau ne peut pas etre reserve deux fois,
- le rendez-vous doit avoir un identifiant unique,
- le rappel doit etre planifie dans les 60 secondes.

### Parcours B - Annulation et reaffectation
1. Le patient annule depuis son espace.
2. Le creneau passe en etat libre.
3. La liste d attente est interrogee selon priorite et compatibilite.
4. Le premier candidat recoit une proposition avec expiration.

Critere d acceptation:
- la proposition expire automatiquement,
- le creneau est bloque pendant la fenetre de reponse,
- si refus/expiration, proposer au patient suivant.

### Parcours C - Gestion des rendez-vous a risque
1. Chaque rendez-vous recoit un score no-show.
2. Si score eleve, action automatique (double rappel, confirmation active, appel).
3. Les cas critiques apparaissent en tete de file pour la secretaire.

Critere d acceptation:
- tout score doit etre historise,
- toute action declenchee doit etre tracable dans un journal.

## 5) Regles no-show initiales (v0)
Score entre 0 et 100.

Variables de depart:
- historique_absences_patient (0-40),
- delai_prise_rdv (0-15),
- type_creneau (matin/tardif) (0-10),
- canal_confirmation (0-10),
- delai_depuis_derniere_visite (0-10),
- specialite/site (0-15).

Seuils et actions:
- 0-39: rappel standard (J-2).
- 40-69: double rappel (J-2 et J-1) + demande de confirmation.
- 70-100: rappel prioritaire + appel secretaire + candidat de backup liste attente.

## 6) Exigences non fonctionnelles
- Disponibilite cible: 99.5%.
- Temps de reponse API P95: < 400 ms sur operations courantes.
- Trafic cible initial: 10000 rendez-vous/mois.
- Journalisation de toutes les operations critiques.

## 7) Conformite et securite
- RGPD: minimisation des donnees et finalite explicite.
- Chiffrement TLS en transit et chiffrement au repos.
- Controle d acces par role (RBAC).
- Journal d audit immutable pour actions sensibles.

## 8) Risques principaux et mitigation
- Qualite des donnees insuffisante: imposer validation des formulaires + regles de nettoyage.
- Adoption faible des rappels: A/B testing des messages et horaires.
- Surcharge equipe secretariat: automatiser priorisation et scripts d appel.
- Incidents de disponibilite: supervision proactive + alertes + plan de reprise.

## 9) Definition of Done de l etape 1
- KPI valides et baseline definie.
- Parcours metier signes par les parties prenantes.
- Schema de donnees V1 approuve.
- Regles no-show V0 testables en pre-production.
- Backlog priorise pour S3-S5 (MVP).
