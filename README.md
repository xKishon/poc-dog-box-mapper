# PawPlan - Dog Box Mapper POC

Dashboard visuale interattiva per la gestione dei box e dei cani in una pensione.

## Caratteristiche Implementate

- **Visualizzazione grafica dei box**: Mappa interattiva con React Flow
- **Drag & Drop**: Sposta i cani tra i box trascinandoli
- **Snap magnetico**: I box si illuminano quando un cane si avvicina
- **Animazioni fluide**: Feedback visuale con Framer Motion
- **Sidebar cani non assegnati**: Visualizza e assegna cani senza box
- **Design responsive**: UI moderna con TailwindCSS

## Stack Tecnologico

- **React** 18.3.1 + **TypeScript**
- **Vite** 6.0.3 (build tool)
- **@xyflow/react** (React Flow) - Visualizzazione interattiva
- **Framer Motion** - Animazioni
- **TailwindCSS** v4 - Styling

## Installazione e Avvio

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

L'applicazione sarà disponibile su http://localhost:5173/

## Come Usare

1. **Visualizza i box**: La mappa mostra 5 box (A, B, C, D, E) con i cani assegnati
2. **Sposta un cane**: Clicca e trascina un cane da un box all'altro
3. **Snap magnetico**: Avvicinando il cane a un box, questo si illuminerà in blu
4. **Cani non assegnati**: Nella sidebar destra vedi i cani senza box
5. **Zoom e Pan**: Usa i controlli in basso a sinistra per navigare

## Struttura del Progetto

```
src/
├── components/
│   └── BoxNode.tsx          # Componente nodo box personalizzato
├── types.ts                 # Definizioni TypeScript
├── mockData.ts             # Dati mock (boxes e dogs)
├── App.tsx                 # Componente principale
├── main.tsx               # Entry point
└── index.css              # Stili globali
```

## Dati Mock

Il POC include dati di esempio:
- **5 box** (A, B, C, D, E) con diverse capacità
- **8 cani** con razze diverse, alcuni già assegnati ai box

## Funzionalità Future

- Persistenza con API Laravel o LocalStorage
- Planimetria reale con immagine di sfondo
- Modal dettagli cane al click
- Mini-map panoramica
- Colorazioni dinamiche per categorie
- Export/Import layout JSON
- Stato box (libero, occupato, manutenzione)

## Note di Sviluppo

- **Snap threshold**: 120px (modificabile in App.tsx)
- **Drop threshold**: 150px
- **Animazioni**: Spring con stiffness 300
- Tutti i dati sono mock/hardcoded per il POC

## License

MIT
