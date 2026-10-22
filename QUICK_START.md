# ⚡ Quick Start - Dog Box Planner

> Guida rapida per capire il progetto in 5 minuti

## 🎯 Entry Point - Da Dove Iniziare

### 1. Avvia l'app
```bash
npm install
npm run dev
```
Apri http://localhost:5173/

### 2. Leggi i file in questo ordine

```
📄 index.html          (1° - Entry point HTML)
    ↓
📄 src/main.tsx        (2° - Entry point React)
    ↓
📄 src/App.tsx         (3° - INIZIA QUI! Logica principale) ⭐
    ↓
📄 src/services/db.ts  (4° - Database)
    ↓
📄 src/components/     (5° - Componenti UI)
```

## 📚 File Principali

### 🌟 `src/App.tsx` - IL CERVELLO
**Cosa fa:**
- Gestisce lo STATE globale (boxes, dogs)
- Carica i dati dal database
- Coordina tutti i componenti figli
- Gestisce drag & drop

**Parti chiave da capire:**
```typescript
// 1. STATE - Dati reattivi
const [boxes, setBoxes] = useState<Box[]>([]);
const [dogs, setDogs] = useState<Dog[]>([]);

// 2. CARICAMENTO DATI - All'avvio
useEffect(() => {
  DB.initDatabase();
  setBoxes(DB.getBoxes());
  setDogs(DB.getDogs());
}, []);

// 3. DRAG & DROP - Sposta cane
const moveDogToBox = (dogId, boxId) => {
  DB.updateDogBoxId(dogId, boxId);
  setDogs(DB.getDogs());  // Aggiorna UI
};
```

### 💾 `src/services/db.ts` - DATABASE
**Cosa fa:**
- SQLite nel browser (sql.js)
- Salva/carica da localStorage
- Funzioni CRUD per boxes e dogs

**Funzioni chiave:**
```typescript
initDatabase()      // Carica DB da localStorage
getBoxes()          // Legge tutti i box
getDogs()           // Legge tutti i cani
addBox(box)         // Crea nuovo box
updateDogBoxId()    // Sposta cane in un box
saveToLocalStorage() // Salva tutto
```

### 🎨 `src/components/BoxNode.tsx` - COMPONENTE BOX
**Cosa fa:**
- Visualizza un singolo box sulla mappa
- Gestisce drag & drop dei cani
- Mostra i cani nel box

**Concetto chiave:**
```typescript
// Riceve dati da App.tsx tramite props
const BoxNode = ({ data }) => {
  const { name, dogs, onDogDrop } = data;

  // Quando rilasci un cane qui
  const handleDrop = (e) => {
    const dogId = e.dataTransfer.getData('dogId');
    onDogDrop(dogId, id);  // Chiama funzione di App.tsx
  };
};
```

## 🔄 Flusso Completo: Spostare un Cane

```
USER: Trascina cane da Sidebar → Box A
    ↓
SIDEBAR: onDragStart → salva dogId
    ↓
BOX A: onDrop → recupera dogId
    ↓
BOX A: chiama onDogDrop(dogId, boxId)
    ↓
APP: moveDogToBox() viene eseguita
    ↓
APP: Controlla capacità box
    ↓
DB: UPDATE dogs SET box_id = 'box-a' WHERE id = 'dog-1'
    ↓
DB: saveToLocalStorage()
    ↓
APP: setDogs(DB.getDogs())  ← Aggiorna state
    ↓
REACT: Re-renderizza UI
    ↓
USER: Vede il cane nel Box A!
```

## 🎓 Concetti React da Sapere

### 1. State (dati reattivi)
```typescript
const [value, setValue] = useState(initial);
// Quando chiami setValue(), React aggiorna l'UI
```

### 2. Props (passare dati padre → figlio)
```typescript
// App.tsx (padre)
<BoxNode data={{ name: "Box A", dogs: [...] }} />

// BoxNode.tsx (figlio)
const BoxNode = ({ data }) => {
  const { name, dogs } = data;  // Riceve i dati
};
```

### 3. useEffect (esegui codice dopo il render)
```typescript
useEffect(() => {
  // Codice da eseguire
}, [dependencies]);  // Quando ri-eseguire
```

### 4. Callback (figlio → padre)
```typescript
// App.tsx - passa funzione al figlio
<BoxNode onDogDrop={(dogId, boxId) => moveDogToBox(dogId, boxId)} />

// BoxNode.tsx - chiama la funzione del padre
onDogDrop(dogId, boxId);
```

## 🛠️ Come Modificare

### Aggiungere un campo ai cani (es. "età")

**1. Tipo in `src/types.ts`:**
```typescript
export interface Dog {
  // ... campi esistenti
  age?: number;  // NUOVO
}
```

**2. Database in `src/services/db.ts`:**
```typescript
// In createTables()
CREATE TABLE dogs (
  -- ... colonne esistenti
  age INTEGER  -- NUOVO
)

// In getDogs()
dogs.push({
  // ... campi esistenti
  age: row.age as number | undefined,  // NUOVO
});
```

**3. Form in `AddDogModal.tsx`:**
```typescript
const [formData, setFormData] = useState({
  // ... campi esistenti
  age: '',  // NUOVO
});

// Nel form
<input
  type="number"
  value={formData.age}
  onChange={(e) => handleChange('age', e.target.value)}
  placeholder="Età (anni)"
/>
```

**4. UI in `BoxNode.tsx`:**
```typescript
{dog.age && <div>🎂 {dog.age} anni</div>}
```

## 📖 Documentazione Completa

- **README.md** - Tutte le funzionalità e setup
- **CODE_GUIDE.md** - Guida dettagliata al codice (per junior)
- **QUICK_START.md** - Questo file

## 🐛 Debug Tips

```typescript
// Console.log è tuo amico!
const moveDogToBox = (dogId, boxId) => {
  console.log('Moving:', dogId, 'to', boxId);
  console.log('Current boxes:', boxes);
  // ...
};

// React DevTools (estensione browser)
// Ispeziona componenti, state e props
```

## 🎯 Prossimi Passi

1. **Esplora il codice**: Apri `src/App.tsx` e leggi i commenti
2. **Testa l'app**: Aggiungi box, cani, sposta cani tra box
3. **Modifica qualcosa**: Cambia un colore, aggiungi un campo
4. **Leggi CODE_GUIDE.md**: Per capire in profondità come funziona tutto

---

💡 **Ricorda**: Non aver paura di rompere le cose! È il modo migliore per imparare. 🚀
