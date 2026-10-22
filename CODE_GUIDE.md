# 📚 Guida al Codice - Dog Box Planner

> Questa guida spiega nel dettaglio come funziona il codice.

## 📍 Dove Iniziare a Leggere il Codice

### Entry Point (punto di partenza)

1. **`index.html`** - Il browser carica questo file per primo
2. **`src/main.tsx`** - Inizializza React e monta l'app
3. **`src/App.tsx`** - QUI INIZIA LA LOGICA! 👈 Leggi questo file per primo

## 🗂️ File Principali Spiegati

### `src/App.tsx` - Il Cervello dell'Applicazione

Questo è il componente principale. Contiene:

#### **1. State (Lo stato dell'applicazione)**
```typescript
const [boxes, setBoxes] = useState<Box[]>([]);
```
- `boxes`: array che contiene tutti i box (gabbie)
- `setBoxes`: funzione per modificare l'array boxes
- `useState<Box[]>([])`: inizializza con array vuoto `[]`

**Perché usiamo useState?**
React deve sapere quando i dati cambiano per aggiornare l'interfaccia. `useState` crea una variabile "reattiva" che quando cambia, ri-renderizza la UI.

```typescript
// ❌ SBAGLIATO - React non vede il cambiamento
let boxes = [];
boxes.push(newBox);  // UI non si aggiorna!

// ✅ GIUSTO - React vede il cambiamento
const [boxes, setBoxes] = useState([]);
setBoxes([...boxes, newBox]);  // UI si aggiorna!
```

#### **2. useEffect - Caricamento Dati all'Avvio**
```typescript
useEffect(() => {
  async function loadData() {
    await DB.initDatabase();      // 1. Carica database da localStorage
    setBoxes(DB.getBoxes());      // 2. Prendi tutti i box
    setDogs(DB.getDogs());        // 3. Prendi tutti i cani
  }
  loadData();
}, []); // [] = esegui solo al primo caricamento
```

**Cos'è useEffect?**
- Hook che esegue codice dopo il render del componente
- `[]` = dependency array vuoto = esegui solo UNA volta all'inizio
- Perfetto per caricare dati da API o database

#### **3. useCallback - Ottimizzazione Performance**
```typescript
const moveDogToBox = useCallback((dogId, boxId) => {
  // ... logica ...
}, [boxes, dogs]); // Ri-crea la funzione solo se boxes o dogs cambiano
```

**Perché useCallback?**
- Evita di ricreare la funzione ad ogni render
- Migliora le performance
- Le funzioni vengono ricreate solo se le dipendenze (`[boxes, dogs]`) cambiano

#### **4. Flusso Drag & Drop**

**PASSO 1: L'utente inizia a trascinare un cane**
```typescript
// In BoxNode.tsx o Sidebar
onDragStart={(e) => {
  e.dataTransfer.setData('dogId', dog.id);  // Salva ID in memoria temporanea
}}
```

**PASSO 2: L'utente rilascia il cane su un box**
```typescript
// In BoxNode.tsx
onDrop={(e) => {
  const dogId = e.dataTransfer.getData('dogId');  // Recupera ID
  onDogDrop(dogId, boxId);  // Chiama la funzione passata da App.tsx
}}
```

**PASSO 3: moveDogToBox viene eseguita**
```typescript
const moveDogToBox = (dogId, boxId) => {
  // 1. Trova il box di destinazione
  const targetBox = boxes.find(b => b.id === boxId);

  // 2. Controlla se il box è pieno
  if (targetBox.capacity) {
    const currentDogs = dogs.filter(d => d.box_id === boxId).length;
    if (currentDogs >= targetBox.capacity) {
      alert("Box pieno!");  // Blocca l'operazione
      return;
    }
  }

  // 3. Aggiorna il database
  DB.updateDogBoxId(dogId, boxId);

  // 4. Ricarica i dati e aggiorna l'UI
  setDogs(DB.getDogs());
}
```

#### **5. Come i Box diventano Nodi React Flow**

```typescript
// Trasforma ogni box in un "nodo" per React Flow
const initialNodes = boxes.map((box) => ({
  id: box.id,                      // ID univoco
  type: 'boxNode',                 // Usa il componente BoxNode
  position: { x: box.x, y: box.y }, // Posizione sulla mappa
  data: {                          // Tutti i dati del box
    ...box,                        // Spread: copia tutte le proprietà del box
    dogs: dogs.filter(d => d.box_id === box.id),  // Solo i cani di questo box
    onDogDrop: moveDogToBox,       // Passa la funzione come props
  }
}));
```

**Cosa significa `...box` (spread operator)?**
```typescript
const box = { id: '1', name: 'Box A', color: '#ff0000' };

// Senza spread
const data = { id: box.id, name: box.name, color: box.color };

// Con spread (più comodo!)
const data = { ...box };  // Copia tutte le proprietà
```

#### **6. Sincronizzazione Automatica con useEffect**

```typescript
useEffect(() => {
  setNodes((currentNodes) => {
    // 1. Aggiorna i nodi esistenti con i nuovi dati
    const updated = currentNodes.map((node) => {
      const box = boxes.find(b => b.id === node.id);
      return {
        ...node,
        data: {
          ...node.data,
          dogs: dogs.filter(d => d.box_id === node.id),  // Aggiorna cani
        }
      };
    });

    // 2. Aggiungi nodi per i nuovi box
    // 3. Rimuovi nodi per i box eliminati

    return updated;
  });
}, [boxes, dogs]);  // Ri-esegui quando boxes o dogs cambiano
```

**Perché questo useEffect?**
Quando aggiungi/modifichi/elimini box o cani, i nodi React Flow devono aggiornarsi automaticamente.

---

### `src/services/db.ts` - Gestione Database

Questo file gestisce TUTTI i dati dell'applicazione.

#### **1. Inizializzazione Database**

```typescript
let db: Database | null = null;  // Variabile globale per il database

export async function initDatabase() {
  const SQL = await initSqlJs({ ... });  // Carica libreria sql.js

  // Controlla se esiste un database salvato in localStorage
  const savedDb = localStorage.getItem('dogBoxDb');

  if (savedDb) {
    // Carica database esistente
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    // Crea nuovo database vuoto
    db = new SQL.Database();
    createTables();  // Crea le tabelle
  }
}
```

**Cos'è sql.js?**
- SQLite che gira nel browser (senza server!)
- Salva i dati in localStorage
- Permette query SQL normali

#### **2. Creazione Tabelle**

```typescript
function createTables() {
  db!.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,      -- ID univoco (es. "box-123")
      name TEXT NOT NULL,       -- Nome del box (es. "Box A")
      description TEXT,         -- Descrizione
      x REAL,                   -- Posizione X sulla mappa
      y REAL,                   -- Posizione Y sulla mappa
      capacity INTEGER,         -- Capacità massima (es. 3 cani)
      color TEXT               -- Colore personalizzato
    )
  `);

  db!.run(`
    CREATE TABLE IF NOT EXISTS dogs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      breed TEXT,
      box_id TEXT,              -- ID del box (NULL se non assegnato)
      owner TEXT,
      phone TEXT,
      image TEXT,               -- Immagine in base64
      check_in TEXT,            -- Data check-in (formato ISO string)
      check_out TEXT,           -- Data check-out
      notes TEXT,
      FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE SET NULL
      -- Quando elimini un box, box_id diventa NULL (cane non assegnato)
    )
  `);
}
```

**Perché `box_id` può essere NULL?**
- Un cane può essere "non assegnato" (nella sidebar)
- `NULL` = "nessun box"

#### **3. Funzioni CRUD**

**CREATE - Aggiungere dati**
```typescript
export function addBox(box: Box) {
  db!.run(
    `INSERT INTO boxes (id, name, description, x, y, capacity, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [box.id, box.name, box.description, box.x, box.y, box.capacity, box.color]
  );
  saveToLocalStorage();  // Salva subito dopo ogni modifica
}
```

**READ - Leggere dati**
```typescript
export function getBoxes(): Box[] {
  const stmt = db!.prepare('SELECT * FROM boxes');
  const boxes: Box[] = [];

  while (stmt.step()) {  // Itera su ogni riga del risultato
    const row = stmt.getAsObject();
    boxes.push({
      id: row.id as string,
      name: row.name as string,
      // ... altri campi
    });
  }

  stmt.free();  // Libera memoria
  return boxes;
}
```

**UPDATE - Modificare dati**
```typescript
export function updateDogBoxId(dogId: string, boxId: string | null) {
  db!.run(
    'UPDATE dogs SET box_id = ? WHERE id = ?',
    [boxId, dogId]
  );
  saveToLocalStorage();
}
```

**DELETE - Eliminare dati**
```typescript
export function deleteBox(boxId: string) {
  db!.run('DELETE FROM boxes WHERE id = ?', [boxId]);
  // I cani nel box diventano automaticamente NULL grazie a ON DELETE SET NULL
  saveToLocalStorage();
}
```

#### **4. Persistenza in localStorage**

```typescript
export function saveToLocalStorage() {
  if (!db) return;

  const data = db.export();  // Esporta database come Uint8Array
  const json = JSON.stringify(Array.from(data));  // Converti in JSON
  localStorage.setItem('dogBoxDb', json);  // Salva in localStorage
}
```

**Cos'è localStorage?**
- Storage del browser che persiste anche dopo la chiusura
- Accetta solo stringhe (quindi usiamo JSON.stringify)
- Max ~5-10MB (dipende dal browser)

---

### `src/components/BoxNode.tsx` - Componente Box

#### **1. Props (Dati ricevuti da App.tsx)**

```typescript
interface BoxNodeProps {
  data: BoxNodeData;  // Tutti i dati passati da App.tsx
}

const BoxNode: React.FC<BoxNodeProps> = ({ data }) => {
  const { name, description, color, capacity, dogs, onDogDrop, ... } = data;
  // Destructuring: estrae le proprietà dall'oggetto
}
```

**Cosa sono le Props?**
- Dati che un componente padre passa al figlio
- Read-only (non modificabili direttamente)
- Flusso unidirezionale: App → BoxNode

```
App.tsx (padre)
  │
  └─> BoxNode.tsx (figlio)
        └─ riceve: name, dogs, onDogDrop, etc.
```

#### **2. Gestione Drag & Drop**

```typescript
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();  // Necessario per permettere il drop
  e.dataTransfer.dropEffect = 'move';  // Cambia cursore
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const dogId = e.dataTransfer.getData('dogId');  // Recupera ID
  onDogDrop(dogId, id);  // Chiama funzione di App.tsx
};
```

**Perché `e.preventDefault()`?**
- Di default, il browser non permette il drop
- `preventDefault()` disabilita il comportamento di default
- Necessario sia in `onDragOver` che in `onDrop`

#### **3. Rendering Condizionale**

```typescript
{dogs.length === 0 ? (
  // Se non ci sono cani, mostra icona vuota
  <div className="...">
    <span>🏠</span>
    <p>Box vuoto</p>
  </div>
) : (
  // Altrimenti, mostra la lista dei cani
  dogs.map(dog => <DogCard key={dog.id} dog={dog} />)
)}
```

**Sintassi Ternaria: `condition ? true : false`**
```typescript
// Equivalente a:
if (dogs.length === 0) {
  return <EmptyBox />;
} else {
  return <DogList />;
}
```

#### **4. List Rendering con .map()**

```typescript
dogs.map((dog) => (
  <div key={dog.id}>  {/* key OBBLIGATORIA per le liste */}
    <p>{dog.name}</p>
  </div>
))
```

**Perché la `key` è importante?**
```typescript
// ❌ Senza key - React non sa quale elemento è cambiato
<div><p>Rex</p></div>
<div><p>Max</p></div>

// ✅ Con key - React traccia ogni elemento
<div key="dog-1"><p>Rex</p></div>
<div key="dog-2"><p>Max</p></div>
```

React usa la `key` per capire:
- Quale elemento è stato aggiunto/rimosso
- Quale elemento è stato modificato
- Migliora le performance

---

### `src/components/AddDogModal.tsx` - Form Modale

#### **1. Gestione Form con State**

```typescript
const [formData, setFormData] = useState({
  name: '',
  breed: '',
  owner: '',
  // ...
});

// Aggiorna un campo specifico
const handleChange = (field: string, value: string) => {
  setFormData({
    ...formData,      // Mantieni gli altri campi
    [field]: value    // Aggiorna solo questo campo
  });
};
```

**Perché `...formData`?**
```typescript
// ❌ SBAGLIATO - Sovrascrive tutto
setFormData({ name: 'Rex' });
// Risultato: { name: 'Rex' } - tutti gli altri campi spariscono!

// ✅ GIUSTO - Aggiorna solo un campo
setFormData({ ...formData, name: 'Rex' });
// Risultato: { name: 'Rex', breed: 'Labrador', ... }
```

#### **2. Gestione Immagini**

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;  // Immagine in base64
    setFormData({ ...formData, image: base64 });
  };
  reader.readAsDataURL(file);  // Converti file → base64
};
```

**Cos'è base64?**
- Codifica che trasforma file binari in testo
- Permette di salvare immagini come stringa nel database
- Esempio: `data:image/png;base64,iVBORw0KGgoAAAANS...`

#### **3. Submit Form**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();  // Previeni il refresh della pagina

  if (!formData.name.trim()) {
    alert('Il nome è obbligatorio');
    return;
  }

  onAddDog(formData);  // Chiama funzione di App.tsx
  onClose();           // Chiudi il modale
};
```

---

## 🔄 Flusso Completo: Aggiungere un Cane

Vediamo cosa succede quando clicchi "Aggiungi Cane":

```
1. USER: Click su "Aggiungi Cane"
   ↓
2. App.tsx: setIsAddDogModalOpen(true)
   ↓
3. AddDogModal: si apre (isOpen={true})
   ↓
4. USER: Compila form e click "Salva"
   ↓
5. AddDogModal: handleSubmit() → onAddDog(formData)
   ↓
6. App.tsx: addNewDog() viene chiamata
   ↓
7. App.tsx: Crea ID univoco: `dog-${Date.now()}-${random}`
   ↓
8. App.tsx: Chiama DB.addDog(dog)
   ↓
9. db.ts: INSERT INTO dogs VALUES (...)
   ↓
10. db.ts: saveToLocalStorage()
    ↓
11. App.tsx: setDogs(DB.getDogs())  // Aggiorna state
    ↓
12. React: Re-renderizza l'UI con il nuovo cane
    ↓
13. USER: Vede il cane nella sidebar!
```

---

## 🎯 Concetti React Chiave

### 1. **Unidirectional Data Flow** (Flusso Dati Unidirezionale)

```
App.tsx (state centrale)
  │
  ├─> BoxNode (riceve dogs, onDogDrop)
  │     │
  │     └─> Non può modificare dogs direttamente
  │          Deve chiamare onDogDrop() che modifica lo state in App
  │
  └─> Sidebar (riceve dogs, setEditingDogId)
        └─> Non può modificare dogs direttamente
```

**Regola d'Oro:**
- I dati scendono (padre → figlio) tramite props
- Gli eventi salgono (figlio → padre) tramite callback

### 2. **Immutability** (Immutabilità)

```typescript
// ❌ SBAGLIATO - Muta l'array direttamente
const newDogs = dogs;
newDogs.push(newDog);
setDogs(newDogs);  // React non rileva il cambiamento!

// ✅ GIUSTO - Crea nuovo array
setDogs([...dogs, newDog]);  // React rileva il cambiamento!
```

**Perché?**
React confronta i riferimenti (reference) degli oggetti:
```typescript
const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a === b);  // true - stesso riferimento!

const c = [...a];
console.log(a === c);  // false - riferimento diverso!
```

### 3. **Lifting State Up** (Sollevare lo State)

Se due componenti devono condividere dati, lo state va nel padre comune:

```
App.tsx ← STATE QUI (boxes, dogs)
  ├─> BoxNode (usa dogs)
  └─> Sidebar (usa dogs)
```

Non puoi passare dati tra "fratelli" (BoxNode ↔ Sidebar), devi passare per il padre (App).

---

## 🛠️ Tool e Librerie Usate

### React Flow
```typescript
<ReactFlow
  nodes={nodes}              // Array di nodi da visualizzare
  nodeTypes={nodeTypes}      // Mappa tipo → componente
  onNodesChange={...}        // Quando i nodi cambiano (drag, etc.)
  nodesDragHandle=".drag-handle"  // Solo elementi con questa classe sono trascinabili
/>
```

### Framer Motion
```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}  // Stato iniziale
      animate={{ opacity: 1, scale: 1 }}    // Animazione entrata
      exit={{ opacity: 0, scale: 0.9 }}     // Animazione uscita
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### TailwindCSS
```typescript
// Classi utility invece di CSS custom
<div className="bg-orange-500 text-white rounded-lg p-4 shadow-lg">
  // bg-orange-500 = background: #f97316
  // text-white = color: white
  // rounded-lg = border-radius: 0.5rem
  // p-4 = padding: 1rem
  // shadow-lg = box-shadow: ...
</div>
```

---

## 💡 Tips per Modificare il Codice

### Aggiungere un nuovo campo ai cani

**1. Aggiorna il tipo in `src/types.ts`:**
```typescript
export interface Dog {
  // ... campi esistenti
  weight?: number;  // NUOVO CAMPO
}
```

**2. Aggiorna il database in `src/services/db.ts`:**
```typescript
// In createTables()
db!.run(`
  CREATE TABLE IF NOT EXISTS dogs (
    -- ... colonne esistenti
    weight REAL  -- NUOVO CAMPO
  )
`);

// In getDogs()
dogs.push({
  // ... campi esistenti
  weight: row.weight as number | undefined,  // NUOVO CAMPO
});

// In addDog() e updateDog()
// Aggiungi weight alla query INSERT/UPDATE
```

**3. Aggiorna i form in `AddDogModal.tsx` e `EditDogModal.tsx`:**
```typescript
// Aggiungi al formData state
const [formData, setFormData] = useState({
  // ... campi esistenti
  weight: '',  // NUOVO CAMPO
});

// Aggiungi input nel form
<input
  type="number"
  value={formData.weight}
  onChange={(e) => handleChange('weight', e.target.value)}
  placeholder="Peso (kg)"
/>
```

**4. Mostra il campo in `BoxNode.tsx`:**
```typescript
<div>
  <span>⚖️</span>
  <span>{dog.weight} kg</span>
</div>
```

---

## 🐛 Debugging Tips

### Console.log è tuo amico!

```typescript
const moveDogToBox = (dogId, boxId) => {
  console.log('Moving dog:', dogId, 'to box:', boxId);  // DEBUG

  const targetBox = boxes.find(b => b.id === boxId);
  console.log('Target box:', targetBox);  // DEBUG

  // ... resto del codice
};
```

### React DevTools

Installa l'estensione "React Developer Tools" su Chrome/Firefox per:
- Ispezionare i componenti
- Vedere lo state e le props
- Tracciare i re-render

### Errori Comuni

**1. "Cannot read property 'x' of undefined"**
```typescript
// ❌ box potrebbe essere undefined
const name = box.name;

// ✅ Check prima
const name = box?.name;  // Optional chaining
const name = box ? box.name : 'N/A';  // Ternario
```

**2. "Objects are not valid as a React child"**
```typescript
// ❌ Non puoi renderizzare oggetti direttamente
<div>{dog}</div>

// ✅ Renderizza le proprietà
<div>{dog.name}</div>
```

**3. "Each child in a list should have a unique key prop"**
```typescript
// ❌ Manca la key
dogs.map(dog => <div>{dog.name}</div>)

// ✅ Aggiungi key univoca
dogs.map(dog => <div key={dog.id}>{dog.name}</div>)
```

---

## 📚 Risorse per Approfondire

- **React Docs**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **React Flow**: https://reactflow.dev/
- **TailwindCSS**: https://tailwindcss.com/docs
- **MDN Web Docs**: https://developer.mozilla.org/

---

💡 **Consiglio Finale**: Non aver paura di sperimentare! Modifica il codice, rompi le cose, e impara dai tuoi errori. È così che si diventa bravi sviluppatori! 🚀
