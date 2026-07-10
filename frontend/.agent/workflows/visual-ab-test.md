---
description: Workflow A/B Testing pour modifications visuelles d'une section
---

# Workflow A/B Testing Visuel

Ce workflow permet de tester des modifications visuelles de manière isolée, en comparant une version "Original" et une version "Variant" d'une section.

## Principe

1. **Original** = Version de référence (avant modification)
2. **Variant** = Version modifiée (avec la nouvelle feature)
3. **Comparaison** = L'utilisateur choisit quelle version garder

## Étapes

### 1. Préparer les fichiers

// turbo
Dupliquez le composant à modifier :
```powershell
Copy-Item "src/components/[Section].tsx" -Destination "src/components/[Section]Original.tsx"
Copy-Item "src/components/[Section].tsx" -Destination "src/components/[Section]Variant.tsx"
```

### 2. Ajouter le toggle dans la page

Ajoutez cet état et ce toggle dans votre page :

```tsx
const [sectionVersion, setSectionVersion] = useState<'original' | 'variant'>('original');

{/* Design Lab - Toggle [SectionName] */}
<div className="fixed bottom-6 right-6 z-[9999] bg-asphalt/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
    <span className="text-xs font-bold text-mist">🧪 [SectionName]</span>
    <div className="flex p-1 bg-black/40 rounded-lg mt-2">
        <button onClick={() => setSectionVersion('original')} 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md ${sectionVersion === 'original' ? 'bg-signal text-asphalt' : 'text-mist'}`}>
            ORIGINAL
        </button>
        <button onClick={() => setSectionVersion('variant')} 
            className={`flex-1 py-1.5 text-xs font-bold rounded-md ${sectionVersion === 'variant' ? 'bg-signal text-asphalt' : 'text-mist'}`}>
            VARIANT
        </button>
    </div>
</div>

{/* Section dynamique */}
{sectionVersion === 'original' ? <SectionOriginal /> : <SectionVariant />}
```

### 3. Appliquer les modifications

- Gardez `[Section]Original.tsx` intact (référence)
- Appliquez les changements uniquement dans `[Section]Variant.tsx`

### 4. Comparer et décider

L'utilisateur compare visuellement et répond :
- **"Original"** → Rejeter la modification, passer à la suivante
- **"Variant"** → Accepter la modification

### 5. Si "Variant" accepté

// turbo
Avant d'appliquer une nouvelle modification :
```powershell
Copy-Item "src/components/[Section]Variant.tsx" -Destination "src/components/[Section]Original.tsx" -Force
```

### 6. Finaliser

// turbo
Une fois toutes les modifications terminées :
```powershell
Copy-Item "src/components/[Section]Variant.tsx" -Destination "src/components/[Section].tsx" -Force
Remove-Item "src/components/[Section]Original.tsx"
Remove-Item "src/components/[Section]Variant.tsx"
```

Puis supprimer le Design Lab toggle de la page.

## Bonnes pratiques

- **1 modification par itération** : Ne changez qu'une seule chose à la fois
- **Nommage clair** : Commentez chaque modification (ex: `// M3: Dimmed video`)
- **Synchro fréquente** : Copiez Variant → Original après chaque acceptation
- **Documenter les décisions** : Notez les modifications acceptées/rejetées
