# 🐾 Dog Box Planner - Sistema di Gestione Pensione per Cani

## 📖 Descrizione

Dog Box Planner è un'applicazione web interattiva per la gestione di una pensione per cani. Permette di visualizzare e gestire i box e i cani ospitati attraverso un'interfaccia visuale drag & drop.

## ✨ Funzionalità Principali

### 🏠 Gestione Box
- **Creazione box**: Aggiungi nuovi box con nome, descrizione, colore personalizzato e capacità massima
- **Modifica box**: Modifica le proprietà di un box esistente
- **Eliminazione box**: Rimuovi un box (i cani al suo interno vengono spostati automaticamente tra i "non assegnati")
- **Spostamento box**: Trascina i box sulla mappa per riorganizzarli visivamente
- **Capacità limitata**: Imposta un limite massimo di cani per box (es. max 3 cani)
- **Validazione capacità**: Il sistema impedisce di inserire più cani del limite consentito

### 🐕 Gestione Cani
- **Creazione cani**: Aggiungi nuovi cani con le seguenti informazioni:
  - Nome (obbligatorio)
  - Razza
  - Proprietario
  - Numero di telefono
  - Immagine (convertita automaticamente in base64 per il salvataggio)
  - Data e ora di check-in
  - Data e ora di check-out
  - Note aggiuntive
- **Modifica cani**: Modifica tutti i dettagli di un cane
- **Eliminazione cani**: Rimuovi cani non assegnati dalla sidebar
- **Drag & Drop**: Sposta i cani tra box trascinandoli direttamente sulla mappa
- **Rimozione da box**: Rimuovi un cane da un box per riportarlo tra i "non assegnati"

### 📋 Sidebar Cani Non Assegnati
- **Toggle on/off**: Apri/chiudi la sidebar con il pulsante in alto a destra
- **Ricerca**: Filtra i cani per nome in tempo reale
- **Lista scrollabile**: Visualizza tutti i cani non ancora assegnati a un box
- **Scrollbar personalizzata**: Tema arancione coordinato con l'applicazione
- **Drag & Drop**: Trascina i cani dalla sidebar direttamente nei box
- **Azioni rapide**: Modifica o elimina cani direttamente dalla sidebar

### 💾 Persistenza Dati
- **Database SQLite**: Tutti i dati sono salvati in un database SQLite (sql.js) nel browser
- **LocalStorage**: Il database viene automaticamente salvato in localStorage
- **Salvataggio manuale**: Pulsante dedicato per forzare il salvataggio
- **Caricamento automatico**: I dati vengono ricaricati automaticamente all'apertura dell'app

### 🗺️ Navigazione
- **MiniMappa**: Mappa navigabile in basso a destra per orientarsi
- **Zoom e Pan**: Controlla la vista con i controlli React Flow
- **Trascinamento canvas**: Click destro per spostare la vista

## 🛠️ Stack Tecnologico

- **React 18.3.1**: Framework principale
- **TypeScript**: Type safety e migliore developer experience
- **Vite 6.0.3**: Build tool veloce e moderno
- **TailwindCSS 3.4.0**: Framework CSS utility-first
- **React Flow (@xyflow/react)**: Libreria per nodi e grafici interattivi
- **Framer Motion**: Animazioni fluide per i modali
- **sql.js**: Database SQLite nel browser
- **HTML5 Drag & Drop API**: Trascinamento nativo

## 📁 Struttura del Progetto

```
dog-box-mapper/
├── src/
│   ├── components/          # Componenti React
│   │   ├── BoxNode.tsx      # Componente singolo box (nodo React Flow)
│   │   ├── AddBoxModal.tsx  # Modal per aggiungere box
│   │   ├── EditBoxModal.tsx # Modal per modificare box
│   │   ├── AddDogModal.tsx  # Modal per aggiungere cani
│   │   └── EditDogModal.tsx # Modal per modificare cani
│   ├── services/            # Servizi e logica business
│   │   └── db.ts            # Service per database SQLite
│   ├── types.ts             # Definizioni TypeScript
│   ├── App.tsx              # Componente principale (ENTRY POINT React)
│   ├── main.tsx             # Entry point applicazione
│   └── index.css            # Stili globali
├── public/                  # File statici
├── index.html               # HTML principale (ENTRY POINT HTML)
├── package.json             # Dipendenze e scripts
├── tsconfig.json            # Configurazione TypeScript
├── vite.config.ts           # Configurazione Vite
└── tailwind.config.js       # Configurazione TailwindCSS
```

## 🚀 Come Funziona - Guida per Junior

### 1️⃣ Entry Point dell'Applicazione

L'applicazione parte da **3 file principali in ordine**:

#### `index.html` (Entry Point HTML)
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="root"></div>           <!-- Container React -->
    <script type="module" src="/src/main.tsx"></script>  <!-- Carica React -->
  </body>
</html>
```

#### `src/main.tsx` (Entry Point JavaScript/React)
```typescript
// Questo file monta l'applicazione React nel DOM
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Trova l'elemento con id="root" e ci monta dentro <App />
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### `src/App.tsx` (Entry Point Logico)
Questo è il componente principale dove vive tutta la logica dell'applicazione.

### 2️⃣ Flusso di Esecuzione

```
1. Browser carica index.html
   ↓
2. index.html carica src/main.tsx
   ↓
3. main.tsx carica src/App.tsx e lo monta in #root
   ↓
4. App.tsx esegue useEffect per caricare il database
   ↓
5. Database caricato → boxes e dogs vengono popolati
   ↓
6. React Flow renderizza i box come nodi sulla mappa
   ↓
7. Sidebar mostra i cani non assegnati
   ↓
8. L'utente interagisce (drag, click, edit, etc.)
```

### 3️⃣ Architettura del Codice

#### **State Management** (useState)
```typescript
const [boxes, setBoxes] = useState<Box[]>([]);      // Lista di tutti i box
const [dogs, setDogs] = useState<Dog[]>([]);        // Lista di tutti i cani
const [nodes, setNodes] = useNodesState(nodes);     // Nodi React Flow (rappresentano i box)
const [isSidebarOpen, setIsSidebarOpen] = useState(true);  // Stato sidebar
```

#### **Database Service** (db.ts)
- Inizializza il database SQLite
- Crea le tabelle (boxes, dogs)
- Fornisce funzioni CRUD (Create, Read, Update, Delete)
- Salva/carica da localStorage

#### **Componenti**
- **App.tsx**: Orchestrator principale, gestisce lo stato globale
- **BoxNode.tsx**: Rappresenta un singolo box sulla mappa
- **Modals**: Form per creare/modificare box e cani

#### **React Flow**
- Libreria che gestisce la visualizzazione dei nodi (box)
- Permette drag & drop dei box
- Gestisce zoom, pan e minimap

### 4️⃣ Funzionalità Chiave Spiegate

#### **Come funziona il Drag & Drop dei cani?**

1. **Inizio drag** (da sidebar o da box):
```typescript
onDragStart={(e) => {
  e.dataTransfer.setData('dogId', dog.id);  // Salva l'ID del cane
}}
```

2. **Drop su box**:
```typescript
onDrop={(e) => {
  const dogId = e.dataTransfer.getData('dogId');  // Recupera l'ID
  moveDogToBox(dogId, boxId);  // Sposta il cane nel box
}}
```

3. **Aggiornamento database**:
```typescript
const moveDogToBox = (dogId, boxId) => {
  // 1. Controlla capacità box
  // 2. Aggiorna dog.box_id nel database
  // 3. Ricarica lo state con setDogs()
}
```

#### **Come funziona la persistenza?**

1. **Inizializzazione**:
```typescript
useEffect(() => {
  await DB.initDatabase();        // Carica da localStorage se esiste
  setBoxes(DB.getBoxes());       // Popola lo state React
  setDogs(DB.getDogs());
}, []);
```

2. **Salvataggio**:
```typescript
// Ogni modifica chiama una funzione tipo:
DB.addDog(dog);              // Inserisce nel database SQLite
DB.saveToLocalStorage();      // Salva in localStorage
setDogs(DB.getDogs());       // Aggiorna UI React
```

#### **Come i box diventano nodi React Flow?**

```typescript
const nodes = boxes.map((box) => ({
  id: box.id,
  type: 'boxNode',                    // Usa il componente BoxNode
  position: { x: box.x, y: box.y },  // Posizione sulla mappa
  data: {                            // Dati passati al componente
    ...box,
    dogs: dogs.filter(d => d.box_id === box.id),  // Cani nel box
    onDogDrop: moveDogToBox,         // Funzioni callback
  }
}));
```

### 5️⃣ Tecniche React Utilizzate

- **useState**: Gestione stato locale
- **useEffect**: Effetti collaterali (caricamento DB)
- **useCallback**: Memoizzazione funzioni per performance
- **Props drilling**: Passaggio dati padre → figlio
- **Conditional rendering**: `{condition && <Component />}`
- **List rendering**: `.map()` per renderizzare array
- **Event handling**: `onClick`, `onDragStart`, `onDrop`

## 📝 Comandi Disponibili

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build di produzione
npm run preview
```

## 🎨 Personalizzazione

### Cambiare il tema colori
Modifica i colori in `tailwind.config.js` e nei componenti (cerca classi tipo `bg-orange-500`, `text-amber-600`, etc.)

### Aggiungere nuovi campi ai cani
1. Aggiungi il campo in `src/types.ts` → `interface Dog`
2. Aggiorna lo schema database in `src/services/db.ts`
3. Aggiungi l'input in `AddDogModal.tsx` e `EditDogModal.tsx`
4. Mostra il dato in `BoxNode.tsx`

### Cambiare l'icona del logo
Modifica l'emoji in `App.tsx` linea ~260

## 🐛 Troubleshooting

### Il database non si salva
- Controlla la console per errori
- Clicca il pulsante "Salva modifiche" in alto a destra
- Verifica che localStorage sia abilitato nel browser

### I cani non si spostano
- Assicurati che il box non sia pieno (controlla capacità)
- Verifica che il drag parta correttamente (cursore deve cambiare)

### La build fallisce
- Verifica di usare TailwindCSS v3.4.0 (non v4)
- Esegui `npm install` per reinstallare le dipendenze

## 📄 Licenza

Questo è un POC (Proof of Concept) per scopi educativi e dimostrativi.

## 🤝 Contribuire

Per migliorare il progetto:
1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/nuova-funzionalita`)
3. Commit delle modifiche (`git commit -m 'Aggiunge nuova funzionalità'`)
4. Push al branch (`git push origin feature/nuova-funzionalita`)
5. Apri una Pull Request

---

Sviluppato con ❤️ e 🐾 per i nostri amici a quattro zampe
