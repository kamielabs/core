# Dépendances

Ce document liste toutes les dépendances externes utilisées dans le projet,
ainsi que leur statut de validation et leurs contraintes.

---

## Philosophie

Ce projet suit une politique de dépendances stricte :

- Dépendances externes minimales
- Revue manuelle du code source avant toute intégration
- Verrouillage des versions (aucune mise à jour implicite)
- Préférence pour des bibliothèques déterministes et auditables

---

## Liste des dépendances

### ulid (v3.0.2)

- Source : <https://github.com/ulid/javascript>
- Licence : MIT

#### Utilisation

Utilisée pour générer des identifiants uniques dans le système d’événements.

#### Validation

Le code source de cette version a été revu manuellement afin de garantir :

- Absence de dépendances externes ou cachées
- Aucun comportement dynamique ou dangereux
- Implémentation JavaScript/Typescript pure
- Aucun effet de bord réseau ou système de fichiers
- La fonction interne `detectRoot()` utilise `any`
  - Portée : interne uniquement, non exposée
  - Aucune fuite de type vers le core
  - Aucun effet de bord ni mutation globale
    → Accepté

#### Politique

- La version est strictement verrouillée à `3.0.2`
- Aucune mise à jour automatique (`^` et `~` sont interdits)
- Toute mise à jour doit passer par :
  - une revue manuelle
  - une mise à jour de la validation dans ce document

---

## Dépendances d’exécution

### Node.js

- Environnement d’exécution
- Aucun code externe embarqué n’est utilisé en dehors des APIs standards

---

## Résumé

Le projet limite volontairement sa surface de dépendances afin de garantir :

- Prédictibilité
- Sécurité
- Maintenabilité sur le long terme
