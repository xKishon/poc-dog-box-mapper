# 🏗️ Architettura Dog Box Planner

> Diagrammi e spiegazioni visive dell'architettura

## 📊 Struttura Generale

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              React Application                     │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │           App.tsx (State Manager)            │ │ │
│  │  │  • boxes[]                                   │ │ │
│  │  │  • dogs[]                                    │ │ │
│  │  │  • moveDogToBox()                            │ │ │
│  │  └──────────────┬───────────────────────────────┘ │ │
│  │                 │                                  │ │
│  │       ┌─────────┼─────────┐                        │ │
│  │       │         │         │                        │ │
│  │       ▼         ▼         ▼                        │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                 │ │
│  │  │BoxNode │ │BoxNode │ │Sidebar │                 │ │
│  │  │(Box A) │ │(Box B) │ │(Dogs)  │                 │ │
│  │  └────────┘ └────────┘ └────────┘                 │ │
│  │       │         │         │                        │ │
│  │       └─────────┼─────────┘                        │ │
│  │                 │                                  │ │
│  │                 ▼                                  │ │
│  │         ┌──────────────┐                           │ │
│  │         │  React Flow  │                           │ │
│  │         │  (Rendering) │                           │ │
│  │         └──────────────┘                           │ │
│  └─────────────────┬────────────────────────────────┘ │
│                    │                                   │
│                    ▼                                   │
│  ┌──────────────────────────────────────────────────┐ │
│  │        services/db.ts (SQLite)                   │ │
│  │  • initDatabase()                                │ │
│  │  • getBoxes(), getDogs()                         │ │
│  │  • addBox(), updateDog()                         │ │
│  │  • saveToLocalStorage()                          │ │
│  └─────────────────┬────────────────────────────────┘ │
│                    │                                   │
│                    ▼                                   │
│  ┌──────────────────────────────────────────────────┐ │
│  │           localStorage                           │ │
│  │  Key: "dogBoxDb"                                │ │
│  │  Value: SQLite database (binary → JSON)         │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Flusso Dati (Data Flow)

### Unidirezionale: Props Down, Events Up

```
┌─────────────────────────────────────────────┐
│              App.tsx (Parent)               │
│  boxes = [{...}, {...}]                     │
│  dogs = [{...}, {...}]                      │
│                                             │
│  moveDogToBox = (dogId, boxId) => {...}    │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┼─────────┐
         │  PROPS  │  PROPS  │
         │  ⬇️     │  ⬇️     │
         │         │         │
    ┌────▼───┐ ┌──▼────┐ ┌──▼────┐
    │BoxNode │ │BoxNode│ │Sidebar│
    │  (A)   │ │  (B)  │ │       │
    │        │ │       │ │       │
    │ props: │ │props: │ │props: │
    │ • dogs │ │• dogs │ │• dogs │
    │ • onD..│ │• onD..│ │• onD..│
    └────┬───┘ └───┬───┘ └───┬───┘
         │         │         │
         │ EVENTS  │ EVENTS  │ EVENTS
         │  ⬆️     │  ⬆️     │  ⬆️
         └─────────┼─────────┘
                   │
         onDogDrop(dogId, boxId)
                   │
         ┌─────────▼──────────┐
         │   moveDogToBox()   │
         │   (in App.tsx)     │
         └────────────────────┘
```

**Regola d'Oro:**
- **Dati scendono** (padre → figlio) tramite **props** ⬇️
- **Eventi salgono** (figlio → padre) tramite **callbacks** ⬆️

## 🗄️ Database Schema

```sql
┌────────────────────────────────────────┐
│             TABLE: boxes               │
├────────────┬───────────┬───────────────┤
│   Column   │   Type    │  Description  │
├────────────┼───────────┼───────────────┤
│ id         │ TEXT      │ PK (box-xxx)  │
│ name       │ TEXT      │ Nome box      │
│ description│ TEXT      │ Descrizione   │
│ x          │ REAL      │ Posizione X   │
│ y          │ REAL      │ Posizione Y   │
│ capacity   │ INTEGER   │ Capacità max  │
│ color      │ TEXT      │ Colore (#hex) │
└────────────┴───────────┴───────────────┘
                  │
                  │ 1:N relationship
                  │
                  ▼
┌────────────────────────────────────────┐
│             TABLE: dogs                │
├────────────┬───────────┬───────────────┤
│   Column   │   Type    │  Description  │
├────────────┼───────────┼───────────────┤
│ id         │ TEXT      │ PK (dog-xxx)  │
│ name       │ TEXT      │ Nome cane     │
│ breed      │ TEXT      │ Razza         │
│ box_id     │ TEXT      │ FK → boxes.id │
│            │           │ (NULL = non   │
│            │           │  assegnato)   │
│ owner      │ TEXT      │ Proprietario  │
│ phone      │ TEXT      │ Telefono      │
│ image      │ TEXT      │ Base64        │
│ check_in   │ TEXT      │ ISO datetime  │
│ check_out  │ TEXT      │ ISO datetime  │
│ notes      │ TEXT      │ Note          │
└────────────┴───────────┴───────────────┘

Relationship:
- 1 box può avere N cani
- 1 cane appartiene a 0 o 1 box
- ON DELETE SET NULL: se elimini un box, i cani diventano "non assegnati"
```

## 🎨 Component Hierarchy

```
App
├── ReactFlow
│   ├── Background
│   ├── Controls
│   ├── MiniMap
│   └── Nodes (generati da boxes)
│       ├── BoxNode (box 1)
│       │   └── DogCards
│       ├── BoxNode (box 2)
│       │   └── DogCards
│       └── BoxNode (box N)
│           └── DogCards
│
├── Sidebar (cani non assegnati)
│   ├── SearchBar
│   └── DogList
│       ├── DogCard
│       └── DogCard
│
├── AddBoxModal
├── EditBoxModal
├── AddDogModal
└── EditDogModal
```

## 🔁 State Management Pattern

```
┌─────────────────────────────────────────────┐
│         Centralized State (App.tsx)         │
│                                             │
│  const [boxes, setBoxes] = useState([])    │
│  const [dogs, setDogs] = useState([])      │
│                                             │
│  Perché centralizzato?                      │
│  • BoxNode ha bisogno di dogs              │
│  • Sidebar ha bisogno di dogs              │
│  • Entrambi devono condividere gli stessi  │
│    dati → state nel padre comune (App)     │
└─────────────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
      BoxNode     BoxNode     Sidebar
     (usa dogs) (usa dogs)  (usa dogs)
```

**Alternative NON usate in questo progetto:**
- Redux (troppo complesso per un POC)
- Context API (non necessario, props drilling limitato)
- Zustand/Jotai (non necessari per questa dimensione)

## 🎯 Drag & Drop Flow

```
FASE 1: DRAG START
┌──────────────┐
│  DogCard     │
│  draggable   │  User starts dragging
└──────┬───────┘
       │
       ▼
  onDragStart(e)
       │
       ▼
  e.dataTransfer.setData('dogId', dog.id)
       │
       │  [dogId stored in memory]
       │
       ▼

FASE 2: DRAG OVER
┌──────────────┐
│   BoxNode    │  User drags over box
└──────┬───────┘
       │
       ▼
  onDragOver(e)
       │
       ▼
  e.preventDefault()  ← IMPORTANTE!
       │
       ▼
  e.dropEffect = 'move'
       │
       ▼

FASE 3: DROP
┌──────────────┐
│   BoxNode    │  User releases mouse
└──────┬───────┘
       │
       ▼
  onDrop(e)
       │
       ▼
  dogId = e.dataTransfer.getData('dogId')
       │
       ▼
  onDogDrop(dogId, boxId)  ← Callback to App
       │
       ▼
  App.moveDogToBox(dogId, boxId)
       │
       ├─→ Check capacity
       │   └─→ if full: alert + return
       │
       ├─→ DB.updateDogBoxId(dogId, boxId)
       │   └─→ UPDATE dogs SET box_id = ?
       │
       ├─→ DB.saveToLocalStorage()
       │
       └─→ setDogs(DB.getDogs())
           └─→ React re-render
               └─→ UI updated!
```

## 🔄 React Flow Integration

```
boxes (JS objects)          nodes (React Flow format)
      │                            ▲
      │                            │
      │ map transformation         │
      └────────────────────────────┘

Example:
boxes = [                    nodes = [
  {                            {
    id: 'box-1',                 id: 'box-1',
    name: 'Box A',               type: 'boxNode',
    x: 100,           ═════►     position: { x: 100, y: 50 },
    y: 50,                       data: {
    color: '#ff0',                 name: 'Box A',
    dogs: [...]                    color: '#ff0',
  }                                dogs: [...],
]                                  onDogDrop: fn,
                                   ...
                                 }
                               }
                             ]

React Flow renderizza i nodi usando il componente BoxNode
```

## 💾 Persistence Flow

```
                     WRITE OPERATIONS
                            │
                            ▼
         ┌──────────────────────────────┐
         │  DB operation (add/update)   │
         │  DB.addBox(box)              │
         │  DB.updateDogBoxId(...)      │
         └─────────────┬────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │  db.run("INSERT INTO...")    │
         │  (in-memory SQLite)          │
         └─────────────┬────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │  DB.saveToLocalStorage()     │
         │  • db.export() → Uint8Array  │
         │  • JSON.stringify()          │
         └─────────────┬────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │  localStorage.setItem(...)   │
         │  Key: "dogBoxDb"             │
         └──────────────────────────────┘


                      READ OPERATIONS
                            │
                            ▼
         ┌──────────────────────────────┐
         │  DB.initDatabase()           │
         │  (on app start)              │
         └─────────────┬────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │  localStorage.getItem(...)   │
         │  Returns: JSON string or null│
         └─────────────┬────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
    null? │                         │ JSON string?
          ▼                         ▼
   ┌─────────────┐         ┌───────────────┐
   │Create new DB│         │Parse JSON     │
   │createTables │         │→ Uint8Array   │
   └─────────────┘         └───────┬───────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │new Database() │
                           │(from binary)  │
                           └───────┬───────┘
                                   │
                                   ▼
                      ┌────────────────────────┐
                      │  DB ready to use       │
                      │  getBoxes(), getDogs() │
                      └────────────────────────┘
```

## 🧩 TypeScript Types

```typescript
┌─────────────────────────────────────────┐
│            types.ts                     │
├─────────────────────────────────────────┤
│                                         │
│  interface Box {                        │
│    id: string                           │
│    name: string                         │
│    description?: string  ← optional     │
│    x: number                            │
│    y: number                            │
│    capacity?: number                    │
│    color?: string                       │
│  }                                      │
│                                         │
│  interface Dog {                        │
│    id: string                           │
│    name: string                         │
│    breed?: string                       │
│    box_id: string | null  ← FK or null │
│    owner?: string                       │
│    phone?: string                       │
│    image?: string                       │
│    check_in?: string                    │
│    check_out?: string                   │
│    notes?: string                       │
│  }                                      │
│                                         │
│  interface BoxNodeData {                │
│    // All Box fields +                 │
│    dogs: Dog[]           ← computed     │
│    isHighlighted: boolean               │
│    onDogDrop: Function   ← callbacks    │
│    onDogRemove: Function                │
│    // ...                               │
│  }                                      │
└─────────────────────────────────────────┘
```

## 📦 Build & Deployment

```
Development:
  npm run dev  →  Vite dev server (HMR)
                  ↓
                  localhost:5173

Production:
  npm run build  →  Vite build
                    ↓
                    /dist folder
                    ├── index.html
                    ├── assets/
                    │   ├── index-[hash].js
                    │   └── index-[hash].css
                    └── ...

Deploy to:
  • Vercel (zero config)
  • Netlify (drag & drop)
  • GitHub Pages
  • Any static host
```

## 🔍 Performance Considerations

```
✅ Optimizations used:

1. useCallback
   • Memoizza funzioni
   • Evita re-creazioni inutili
   • Migliora performance dei children

2. React Flow
   • Virtualizzazione nodi
   • Solo i nodi visibili vengono renderizzati

3. Set per lookup
   • O(1) invece di array.find() O(n)
   • Usato in useEffect di sincronizzazione

❌ Not used (non necessario per POC):
   • useMemo (pochi calcoli pesanti)
   • React.memo (pochi re-render inutili)
   • Virtual scrolling sidebar (pochi cani)
```

---

## 📚 Approfondimenti

- **README.md** - Setup e funzionalità complete
- **CODE_GUIDE.md** - Spiegazioni dettagliate del codice
- **QUICK_START.md** - Inizia velocemente

---

💡 **Tip**: Stampa questo file e tienilo a portata di mano mentre leggi il codice!
