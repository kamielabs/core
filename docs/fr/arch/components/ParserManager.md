# 🧱 ParserManager

## Description

`ParserManager` est le manager du runtime chargé de résoudre la ligne de commande selon une stratégie strictement déterministe.

Son rôle est d’interpréter les tokens fournis au CLI en respectant :

* leur position
* la phase courante de résolution
* le mode actif du runtime

Le parser suit une logique **strictement de gauche à droite**, sans backtracking ni réinterprétation.

Il constitue la brique syntaxique du core : il ne décide pas de la logique métier, mais transforme l’entrée CLI en données exploitables par les autres managers du runtime.

---

## But

Le `ParserManager` sert à analyser la ligne de commande de manière stable, prévisible et cohérente avec le mode d’exécution courant.

Il permet de :

* résoudre les flags globaux
* résoudre les noms de modules et d’actions
* résoudre les flags de module et d’action
* isoler les arguments restants
* signaler les incohérences de parsing sans casser brutalement le flow

Son objectif est de fournir au runtime une lecture syntaxique fiable du CLI, sur laquelle les managers suivants pourront s’appuyer.

---

## Pourquoi ce manager existe

Le core a besoin d’une brique spécialisée pour interpréter la ligne de commande.

Cette responsabilité ne doit pas être mélangée :

* à la résolution du bootstrap
* à la configuration des stages
* à la résolution des globals
* à la logique des modules ou du métier

`ParserManager` existe donc pour isoler toute la logique de parsing dans une phase dédiée, avec des règles strictes et un comportement homogène dans tous les modes du core.

Cela permet de garantir :

* un parsing déterministe
* un modèle simple à raisonner
* un comportement stable
* une séparation claire entre syntaxe CLI et logique runtime

---

## Portée

En v0.1, `ParserManager` est responsable de :

* consommer les tokens du CLI dans l’ordre
* résoudre les flags selon leur scope
* identifier les modules et les actions
* séparer les arguments bruts
* respecter les transitions de phase
* stocker le contexte de parsing
* remonter les anomalies sous forme d’issues ou d’événements selon l’état actuel du core

Il ne fait pas :

* de logique métier
* de résolution d’environnement
* de validation métier des valeurs
* de mutation du runtime global
* de réinterprétation implicite après parsing

Son périmètre est strictement centré sur la **lecture syntaxique du CLI**.

---

## Choix de conception — Flags à token unique

Le CLI impose un modèle strict de flags à token unique.

Cela signifie :

* ✅ les flags doivent inclure leur valeur dans le même token (`--flag=value`)
* ❌ les flags multi-tokens (`--flag value`) ne sont volontairement pas supportés

Ce choix garantit :

* un parsing déterministe
* une exécution en un seul passage
* aucune ambiguïté
* un comportement cohérent dans tous les modes

C’est un compromis volontaire pour privilégier la prévisibilité plutôt que le confort.

---

## Principes de résolution

Le parser suit des règles strictement déterministes :

* les arguments sont traités strictement de gauche à droite
* chaque token est interprété en fonction de sa position
* le comportement dépend du mode actif
* aucun backtracking ni réinterprétation n’est effectué

Autrement dit :

> une fois un token consommé dans une phase donnée, il n’est jamais rejoué dans une autre.

---

## Gestion des tokens

Le parser traite l’entrée comme une séquence linéaire de tokens.

Chaque token :

* est consommé exactement une fois
* est interprété selon la phase courante
* n’est jamais reclassé rétroactivement

L’interprétation dépend donc toujours du couple :

* phase active
* mode runtime

---

## Tokens spéciaux

### `--` (séparateur de phase)

Le token `--` agit comme un **séparateur de phase**, et non comme un arrêt global du parsing.

### Comportement

Lorsque `--` est rencontré :

* le parser arrête immédiatement la phase de parsing en cours
* il passe ensuite à la phase suivante
* le parsing reste strictement de gauche à droite

### Exemple — Ignorer les flags globaux

```bash
cli --global -- module action args
```

→ `--` arrête la phase des flags globaux
→ `module` est interprété comme le nom du module

### Exemple — Forcer des arguments bruts

```bash
cli module action -- --arg1 --arg2
```

→ `--` arrête la phase des flags d’action
→ `--arg1` et `--arg2` sont traités comme des arguments bruts, pas comme des flags

### Cas d’usage

* autoriser des arguments commençant par `-`
* contrôler explicitement les transitions de phase
* éviter les ambiguïtés entre flags et arguments

### Garanties

* `--` n’affecte que la phase en cours
* il ne réinterprète jamais les tokens précédents
* il préserve le caractère déterministe du parsing

---

## Comportement des flags

### Règles générales

* les formats court (`-f`) et long (`--flag`) sont supportés
* chaque flag doit définir un nom long, utilisé comme clé au runtime
* les flags ne sont supportés que sous forme de token unique :

  * ✅ `--flag=value`
  * ❌ `--flag value`

### Groupement des flags courts

Les flags courts peuvent être groupés :

```bash
-fab
```

Chaque caractère est alors interprété comme un flag individuel.

### Flags avec valeur

Si un flag court nécessite une valeur :

* il doit être le dernier flag du groupe
* il doit être utilisé seul ou en fin de groupe

Exemples :

```bash
# valides
-fab
-fa -b=value
-fb=value

# invalide
-fba=value
```

Si les règles de groupement ne sont pas respectées :

* tout le groupe est ignoré
* le parsing continue avec le token suivant

---

## Résolution des scopes

Les flags sont assignés selon leur position dans la ligne de commande.

La règle est simple :

* avant le module → flags globaux
* entre module et action → flags du module
* après l’action → flags de l’action

Aucune réaffectation implicite n’est effectuée.

Cette règle est fondamentale, car elle garantit que le parsing reste lisible et déterministe.

---

## Comportement de fallback

Le parser ne doit pas faire planter brutalement le runtime sur chaque token invalide.

En v0.1, son comportement de fallback peut notamment consister à :

* ignorer certains tokens invalides
* poursuivre la lecture du flux
* accumuler des issues de parsing
* émettre des warnings ou événements selon le niveau de maturité de la phase concernée

L’objectif est de permettre au runtime de rester robuste, tout en gardant une trace exploitable des anomalies détectées.

---

## Modes de fonctionnement

Le comportement du parser dépend du mode runtime actif.

### 1. Mode action unique

```text
1. globalFlags
2. args
```

Dans ce mode :

* aucun nom de module n’est attendu
* aucun nom d’action n’est attendu
* tous les tokens non-flags sont considérés comme des arguments

### 2. Mode action par défaut

```text
1. globalFlags
2. moduleName
3. actionFlags
4. args
```

Dans ce mode :

* le module définit une `defaultAction`
* aucun nom d’action explicite n’est autorisé
* les flags après le module sont interprétés comme des flags d’action

### 3. Mode actions multiples

```text
1. globalFlags
2. moduleName
3. moduleFlags
4. actionName
5. actionFlags
6. args
```

Dans ce mode :

* le module définit plusieurs actions
* le nom de l’action doit être explicitement fourni
* les flags avant le nom de l’action sont des flags de module
* les flags après le nom de l’action sont des flags d’action

---

## Ce que produit ce manager

Le `ParserManager` produit un contexte de parsing intermédiaire contenant notamment :

* les globals parsés
* le module détecté
* les options de module
* l’action détectée
* les options d’action
* les arguments restants
* les issues éventuelles de parsing

Ce contexte n’est pas encore une exécution métier.

Il constitue la vérité syntaxique sur laquelle les autres managers viennent ensuite s’appuyer.

---

## Rationalité

Le design du parser repose sur une idée simple :

> un CLI sérieux doit être prévisible avant d’être confortable.

C’est pour cette raison que le core refuse :

* le multi-token ambigu pour les flags
* la réinterprétation tardive
* les comportements implicites difficiles à raisonner

Cette approche permet :

* une meilleure stabilité
* une lecture plus simple du flow
* une meilleure testabilité
* un typage plus propre
* une compatibilité plus naturelle avec un runtime en phases

---

## Relations

### Avec `BootstrapManager`

Le parser s’appuie indirectement sur les informations de lancement déjà stabilisées par le bootstrap.

### Avec `StagesManager`

Le stage influence le contexte global du runtime, mais ne modifie pas la logique fondamentale du parsing.

### Avec `GlobalsManager`

Le parser résout les flags globaux pour permettre au `GlobalsManager` de construire les valeurs runtime finales.

### Avec `ModulesManager`

Le parser fournit à `ModulesManager` la lecture syntaxique nécessaire pour résoudre :

* le module
* l’action
* les flags associés
* les arguments

### Avec `EventsManager`

Le parser peut signaler des anomalies ou comportements de fallback via les mécanismes internes prévus par le core.

---

## Exemples

### Mode action unique

```bash
cli --verbose arg1 arg2
```

→ `--verbose` = flag global
→ `arg1 arg2` = arguments

### Mode action par défaut

```bash
cli user --force arg1
```

→ `user` = module
→ `--force` = flag d’action
→ `arg1` = arguments

### Mode actions multiples

```bash
cli user --debug create --force arg1
```

→ `user` = module
→ `--debug` = flag de module
→ `create` = action
→ `--force` = flag d’action
→ `arg1` = arguments

---

## Limitations actuelles

En v0.1, le parser reste volontairement strict et relativement minimaliste.

Les limites assumées incluent notamment :

* absence de support des flags multi-tokens
* fallback encore partiellement piloté par des issues internes
* comportement encore en cours d’harmonisation avec le système d’événements final
* logique volontairement rigide sur la position des tokens

Ces limites sont cohérentes avec l’objectif principal du core : garantir un parsing simple, stable et déterministe.

---

## Évolutions futures

Les évolutions futures pourront notamment concerner :

* l’harmonisation complète entre issues de parsing et événements runtime
* l’amélioration de l’expérience de debug du parsing
* le raffinement éventuel de certains fallback
* l’amélioration de la lisibilité des retours d’erreurs côté utilisateur

Le but restera toutefois inchangé :

* pas de magie
* pas d’ambiguïté
* pas de parsing implicite difficile à raisonner

---

## Conclusion

`ParserManager` est la brique syntaxique du core.

Il ne décide pas du métier, ne résout pas les environnements, et n’exécute aucune action.

Il se concentre sur une seule responsabilité :

> lire la ligne de commande de manière strictement déterministe.

C’est cette simplicité volontaire, combinée à une séparation nette des phases et des scopes, qui en fait une pièce centrale du runtime.

---
