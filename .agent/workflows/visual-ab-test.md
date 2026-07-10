---
description: Workflow A/B Testing pour modifications visuelles du Hero Section
---

# Workflow : Visual A/B Testing

## Principe Fondamental

À **CHAQUE** modification visuelle demandée, le processus est :

```
┌─────────────────────────────────────────────────────────┐
│  1. AVANT modification :                                │
│     HeroVariant.tsx (actuel) → copier → HeroOriginal.tsx │
│                                                         │
│  2. APRÈS modification :                                │
│     HeroVariant.tsx reçoit les changements              │
│                                                         │
│  3. COMPARAISON :                                       │
│     ORIGINAL = Avant  |  VARIANT = Après               │
│                                                         │
│  4. CHOIX (utilisateur) :                              │
│     - "original" → annuler, revenir à Original          │
│     - "variant" ou rien → continuer avec Variant       │
└─────────────────────────────────────────────────────────┘
```

---

## Étapes AUTOMATIQUES à chaque demande de modification

### Étape 1 : Sauvegarder l'état actuel dans Original
```
Copier le contenu EXACT de HeroVariant.tsx vers HeroOriginal.tsx
(Changer seulement le nom de la fonction: HeroVariant → HeroOriginal)
```

### Étape 2 : Appliquer la modification demandée
```
Modifier UNIQUEMENT HeroVariant.tsx selon la demande
```

### Étape 3 : Notifier l'utilisateur
```
Indiquer de rafraîchir et comparer via le Design Lab
```

### Étape 4 : Attendre le choix
```
- Si utilisateur dit "original" → Annuler, copier Original vers Variant
- Si utilisateur dit "variant" OU ne dit rien → Continuer avec Variant
- Variant devient la nouvelle base pour le prochain cycle
```

---

## Règles Strictes

1. **JAMAIS** avoir Original et Variant identiques après une modification
2. **TOUJOURS** synchroniser AVANT de modifier
3. **PAR DÉFAUT** on continue avec Variant si l'utilisateur ne précise pas
