# Workflow Git — Publication d'un Release Candidate

## Vue d'ensemble

Ce document décrit le workflow officiel utilisé pour préparer et publier un Release Candidate (RC).

Le workflow étend le processus standard basé sur Pull Requests en ajoutant les étapes nécessaires au tagging et à la publication d'une release candidate.

---

## Règle Importante

Avant toute création de commit, de branche ou de Pull Request, toujours vérifier la branche actuellement utilisée.

Le workflow de release se termine volontairement sur :

```txt
main
```

Par conséquent, la branche de développement suivante doit toujours être créée explicitement.

Vérification recommandée :

```bash
git status
```

ou :

```bash
git branch --show-current
```

Ne jamais supposer la branche courante.

---

## Workflow Standard d'une RC

### 1. Vérifier la Branche Courante

```bash
git status
```

Résultat attendu :

```txt
Sur la branche main
```

---

### 2. Créer une Branche de Préparation

Exemple :

```bash
git checkout -b chore/v0.1.0-rc.3
```

---

### 3. Implémenter les Modifications

Effectuer les modifications nécessaires :

* code
* tests
* RFCs
* changelogs
* documentation technique

---

### 4. Préparer les Fichiers

```bash
git add -A
```

---

### 5. Créer le Commit

Exemple :

```bash
git commit -m "fix(core): resolve stage path expansion and defaults ordering"
```

---

### 6. Publier la Branche

```bash
git push -u origin chore/v0.1.0-rc.3
```

---

### 7. Créer la Pull Request

Créer une Pull Request vers :

```txt
main
```

Attendre la validation puis effectuer le merge.

---

## Publication du Release Candidate

Une fois la Pull Request mergée :

---

### 8. Revenir sur Main

```bash
git checkout main
```

---

### 9. Synchroniser Main

```bash
git pull
```

Résultat attendu :

```txt
Votre branche est à jour avec 'origin/main'
```

Le dépôt local doit impérativement contenir le commit de merge avant la création du tag.

---

### 10. Vérifier l'État du Dépôt

```bash
git status
```

Résultat attendu :

```txt
Sur la branche main
Votre branche est à jour avec 'origin/main'

rien à valider, la copie de travail est propre
```

---

### 11. Créer le Tag de Release Candidate

Exemple :

```bash
git tag -a v0.1.0-rc.3 -m "Release Candidate 3"
```

---

### 12. Publier le Tag

```bash
git push origin v0.1.0-rc.3
```

---

### 13. Générer le Package

Construire les artefacts de publication à partir du commit taggé.

Exemple :

```bash
pnpm pack
```

ou toute commande spécifique au projet.

---

## Résultat Final

L'état final du dépôt est :

```txt
main
↓
Pull Request mergée
↓
Commit taggé
↓
Release Candidate publiée
```

Le dépôt reste volontairement positionné sur :

```txt
main
```

après la publication du tag.

Ce comportement est voulu afin d'obliger la création explicite de la branche suivante.

---

## Cycle de Release Candidate Suivant

Lorsqu'une nouvelle RC est nécessaire :

```bash
git status
git checkout -b chore/v0.1.0-rc.4
```

Ne jamais continuer le développement directement sur :

```txt
main
```

Toujours créer une branche dédiée au nouveau cycle de stabilisation.

---

## Résumé Visuel

```txt
main
↓
git checkout -b chore/vX.Y.Z-rc.N
↓
développement
↓
commit
↓
push
↓
Pull Request
↓
merge
↓
git checkout main
↓
git pull
↓
git tag
↓
git push origin <tag>
↓
package
↓
fin du cycle
```
