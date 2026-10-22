# 🐾 POC — Dog Box Planner: Visual Dashboard per Pensione Cani

## 🎯 Obiettivo
Creare una **mappa visiva interattiva e strutturata** per rappresentare i box e i cani ospitati in una pensione, utile all’amministratore per:
- visualizzare graficamente la disposizione dei box e dei cani;
- spostare i cani con drag & drop tra box;
- mantenere i dati sincronizzati e strutturati (es. `dog → box_id`);
- rispettare la **planimetria reale** della struttura.

L’applicazione sarà **solo lato admin**, focalizzata su UX, estetica e semplicità.

---

## 🧩 Stack Tecnologico Consigliato

| Componente | Tecnologia | Note |
|-------------|-------------|------|
| **Frontend** | React + TypeScript | Base solida e flessibile |
| **Visualizzazione** | `@xyflow/react` (React Flow) | UI moderna e interattiva |
| **Styling** | TailwindCSS / ShadCN | Per UI rapida e responsive |
| **Gestione Stato** | React State / Zustand | Per gestire posizione cani e box |
| **Persistenza** | API Laravel / LocalStorage | Per salvare le assegnazioni |
| **Backend (facoltativo)** | Laravel REST API | Per dati strutturati e sincronizzazione |

---

## 🎨 Visualizzazione Strutturata (React Flow)

### Concetto base
- Ogni **box** è un nodo React Flow, posizionato secondo coordinate `x, y`;
- Ogni **cane** è associato al box tramite `box_id`;
- L’amministratore può **trascinare un cane** da un box all’altro;
- Al rilascio, viene aggiornato il dato strutturato nel backend.

### Struttura Dati
```json
{
  "boxes": [
    { "id": "box-1", "name": "Box 1", "x": 100, "y": 200 },
    { "id": "box-2", "name": "Box 2", "x": 400, "y": 200 }
  ],
  "dogs": [
    { "id": "dog-1", "name": "Asuna", "box_id": "box-1" },
    { "id": "dog-2", "name": "Loki", "box_id": "box-2" }
  ]
}
```

### Esempio Nodo Personalizzato
```tsx
export const BoxNode = ({ data }) => (
  <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg shadow">
    <h3 className="font-bold">{data.name}</h3>
    <ul>
      {data.dogs.map(dog => (
        <li
          key={dog.id}
          className="bg-white text-sm p-1 mt-1 rounded cursor-grab"
          draggable
          onDragStart={e => e.dataTransfer.setData('dogId', dog.id)}
        >
          🐾 {dog.name}
        </li>
      ))}
    </ul>
  </div>
)
```

---

## 🧲 Funzioni Magnetiche (Snap & Attraction)

React Flow non ha snapping nativo, ma puoi implementarlo facilmente con logica di distanza:

### Evidenziare il box più vicino
```tsx
function handleDogDrag(dogNode) {
  boxes.forEach(box => {
    const dx = dogNode.position.x - box.position.x;
    const dy = dogNode.position.y - box.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 80) highlightBox(box.id);
    else unhighlightBox(box.id);
  });
}
```

### Snap automatico al rilascio
```tsx
function handleDogDrop(dogNode) {
  const nearestBox = boxes
    .map(b => ({ ...b, dist: Math.hypot(dogNode.position.x - b.position.x, dogNode.position.y - b.position.y) }))
    .sort((a, b) => a.dist - b.dist)[0];

  if (nearestBox.dist < 100) {
    moveDogToBox(dogNode.id, nearestBox.id);
    setNodes(nodes => nodes.map(n => n.id === dogNode.id ? { ...n, position: nearestBox.position } : n));
  }
}
```

### Effetti visivi e animazioni
- Highlight box attivo con classe `ring-2 ring-c-primary`;
- Transizione fluida di snap con **Framer Motion**:
```tsx
<motion.div animate={{ scale: data.isHighlighted ? 1.05 : 1 }} transition={{ type: 'spring', stiffness: 300 }}>
```

Risultato: quando un cane si avvicina, il box si illumina e “lo chiama”, e al rilascio lo accoglie al centro.

---

## 🗺️ Planimetria Reale

Puoi rispettare la disposizione fisica della pensione salvando le coordinate dei box nel database:
- Ogni `box` ha `x`, `y`, `width`, `height`;
- React Flow posiziona i nodi esattamente in quei punti;
- Puoi anche aggiungere **un’immagine planimetrica come sfondo**, con layer CSS o custom renderer.

---

## 📊 Analisi delle Difficoltà

| Aspetto | Difficoltà | Descrizione |
|----------|-------------|-------------|
| **Setup React + Flow** | 🟢 Facile | Installazione e setup rapidi |
| **Gestione Drag/Drop** | 🟢 Facile | Supportato nativamente |
| **Snap Magnetico** | 🟠 Medio | Richiede calcolo distanza manuale |
| **Posizionamento Planimetrico** | 🟠 Medio | Serve calibrare coordinate |
| **Zoom/Pan + Mobile** | 🟢 Facile | Integrato di default |
| **Persistenza API Laravel** | 🟡 Medio | Facile da implementare |
| **Performance** | 🟢 Ottima | Fluido anche con 50+ nodi |

---

## 💰 Costi e Servizi

Tutte le librerie e tool sono **gratuiti e open-source**:

| Servizio / Libreria | Costo | Licenza |
|----------------------|-------|----------|
| React | Gratis | MIT |
| React Flow | Gratis | MIT |
| TailwindCSS | Gratis | MIT |
| Zustand (opzionale) | Gratis | MIT |
| Laravel (API backend) | Gratis | MIT |

Nessun servizio a pagamento richiesto. Il progetto può vivere su **Vercel, Netlify o hosting Laravel locale**.

---

## 📱 Possibili Estensioni Future

- Snap magnetico migliorato (drag assistito);
- Stato del box (libero, occupato, manutenzione);
- Modal di dettaglio cliccando su cane;
- Mini-map panoramica con zoom;
- Sincronizzazione API in tempo reale (Pusher opzionale);
- Colorazioni dinamiche per categorie di cani;
- Import/Export JSON layout.

---

## 🧠 Conclusione
Il POC **Dog Box Planner** con **React Flow** è la soluzione ideale per rappresentare dati strutturati (box ↔ cani) in modo visivo e interattivo.

Grazie alle funzioni magnetiche, alla planimetria reale e alla facilità di integrazione con Laravel, offre un’esperienza gestionale fluida, moderna e completamente gratuita.

> 🔸 In breve: React Flow ti consente di costruire una mappa intelligente dove i box “chiamano” i cani e la pensione prende vita visualmente.

