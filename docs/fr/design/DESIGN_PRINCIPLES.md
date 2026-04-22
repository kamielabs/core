# 🧠 Principes du core

## 1. Runtime déterministe

Le CLI est entièrement déterministe :

* aucun backtracking
* aucune ambiguïté dans le parsing
* résolution en un seul passage

---

## 2. Séparation stricte des phases

Le système est structuré en trois phases :

* init (déclarative)
* hooks (mutation contrôlée)
* runtime (exécution)

Chaque phase possède ses propres règles et limites strictes.

---

## 3. Immutabilité du runtime

* Les managers produisent des données figées
* Le runtime est modifiable uniquement via des services contrôlés
* Le runtime final est entièrement immuable

---

## 4. Explicite plutôt que magique

* Aucun comportement implicite
* Aucune résolution cachée
* Tout est déclaré et prévisible

---

## 5. Extensibilité par conception

* Le core est minimal et strict
* Les comportements sont étendus via les hooks et les tools
* Aucune logique métier n’est codée en dur

---

## 6. Modèle de parsing à token unique

* Les flags doivent être autonomes (`--flag=value`)
* Aucun parsing multi-tokens
* Garantit un comportement déterministe

---

## Résumé

Le core est conçu pour être :

* prévisible
* extensible
* strictement encadré

Pour les détails d’implémentation, se référer à la documentation des managers et des services.

---
