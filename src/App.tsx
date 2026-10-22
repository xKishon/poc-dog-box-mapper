/**
 * 🐾 Dog Box Planner - App.tsx
 *
 * QUESTO È IL COMPONENTE PRINCIPALE (entry point logico dell'app)
 *
 * Cosa fa questo file:
 * 1. Gestisce lo STATE globale (boxes, dogs, modali, sidebar)
 * 2. Carica i dati dal database SQLite (localStorage)
 * 3. Trasforma i box in "nodi" React Flow per la visualizzazione
 * 4. Gestisce tutte le operazioni CRUD (Create, Read, Update, Delete)
 * 5. Coordina la comunicazione tra i componenti figli
 *
 * Flusso di esecuzione:
 * index.html → main.tsx → App.tsx (qui!) → Componenti figli (BoxNode, Modali, etc.)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
  useNodesState,
} from '@xyflow/react';
import toast, { Toaster } from 'react-hot-toast';
import BoxNode from './components/BoxNode';
import AddDogModal from './components/AddDogModal';
import AddBoxModal from './components/AddBoxModal';
import EditBoxModal from './components/EditBoxModal';
import EditDogModal from './components/EditDogModal';
import { Dog, Box, BoxNodeData } from './types';
import * as DB from './services/db';
import { confirmWithToast } from './utils/toast';

// Definisce i tipi di nodi personalizzati per React Flow
// Ogni box sarà un nodo di tipo "boxNode" che usa il componente BoxNode
const nodeTypes = {
  boxNode: BoxNode,
} as NodeTypes;

function App() {
  // ==========================================
  // 📦 STATE MANAGEMENT
  // ==========================================
  // State = dati "reattivi" che quando cambiano, aggiornano automaticamente l'UI

  // Liste principali di dati
  const [boxes, setBoxes] = useState<Box[]>([]);      // Tutti i box (gabbie)
  const [dogs, setDogs] = useState<Dog[]>([]);        // Tutti i cani

  // State per gestire i modali (aperti/chiusi)
  const [isAddDogModalOpen, setIsAddDogModalOpen] = useState(false);
  const [isAddBoxModalOpen, setIsAddBoxModalOpen] = useState(false);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);  // null = nessun box in modifica
  const [editingDogId, setEditingDogId] = useState<string | null>(null);  // null = nessun cane in modifica

  // State per UI e UX
  const [isLoading, setIsLoading] = useState(true);        // true = mostra loading screen
  const [isSaving, setIsSaving] = useState(false);         // true = mostra feedback "salvato"
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // true = sidebar visibile
  const [searchQuery, setSearchQuery] = useState('');      // Query di ricerca nella sidebar

  // ==========================================
  // 🚀 INIZIALIZZAZIONE - Carica dati all'avvio
  // ==========================================
  // useEffect con [] = esegui UNA SOLA VOLTA quando il componente viene montato
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Inizializza il database SQLite (carica da localStorage se esiste)
        await DB.initDatabase();

        // 2. Carica tutti i box dal database e aggiorna lo state
        setBoxes(DB.getBoxes());

        // 3. Carica tutti i cani dal database e aggiorna lo state
        setDogs(DB.getDogs());
      } catch (error) {
        console.error('Error loading database:', error);
      } finally {
        // 4. Nascondi schermata di caricamento (sia in caso di successo che errore)
        setIsLoading(false);
      }
    }
    loadData();
  }, []);  // [] = dependency array vuoto = esegui solo al mount del componente

  // ==========================================
  // 🗺️ TRASFORMAZIONE BOX → NODI REACT FLOW
  // ==========================================
  // Trasforma ogni box in un "nodo" che React Flow può visualizzare sulla mappa
  // Ogni nodo include i dati del box + i cani al suo interno + le funzioni callback
  const initialNodes: Node<BoxNodeData>[] = boxes.map((box) => ({
    id: box.id,                          // ID univoco del nodo
    type: 'boxNode',                     // Tipo del nodo → usa il componente BoxNode
    position: { x: box.x, y: box.y },    // Posizione sulla mappa (coordinate pixel)
    data: {                              // Dati passati al componente BoxNode come props
      id: box.id,
      name: box.name,
      description: box.description,
      color: box.color,
      capacity: box.capacity,
      // Filtra solo i cani che appartengono a questo box
      dogs: dogs.filter((dog) => dog.box_id === box.id),
      isHighlighted: false,
      // Callback functions: permettono a BoxNode di comunicare con App
      onDogDrop: (dogId: string, targetBoxId: string) => moveDogToBox(dogId, targetBoxId),
      onDogRemove: (dogId: string) => removeDogFromBox(dogId),
      onDogEdit: (dogId: string) => setEditingDogId(dogId),
      onBoxEdit: (boxId: string) => setEditingBoxId(boxId),
      onBoxDelete: (boxId: string) => deleteBox(boxId),
    },
  }));

  // Hook di React Flow per gestire lo state dei nodi
  // setNodes = funzione per aggiornare i nodi
  // onNodesChange = handler predefinito per cambiamenti (drag, select, etc.)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // ==========================================
  // 🎯 GESTIONE DRAG & DROP DEI BOX
  // ==========================================
  // Handler personalizzato che salva la posizione dei box quando vengono trascinati
  const handleNodesChange = useCallback((changes: any) => {
    // 1. Applica i cambiamenti ai nodi (gestito da React Flow)
    onNodesChange(changes);

    // 2. Salva nel database quando l'utente finisce di trascinare un box
    changes.forEach((change: any) => {
      // Controlla se è un cambio di posizione E il drag è finito
      if (change.type === 'position' && change.position && change.dragging === false) {
        // Salva la nuova posizione nel database
        DB.updateBoxPosition(change.id, change.position.x, change.position.y);
        // Aggiorna lo state per riflettere le modifiche
        setBoxes(DB.getBoxes());
      }
    });
  }, [onNodesChange]);

  // ==========================================
  // 💾 SALVATAGGIO MANUALE
  // ==========================================
  // Funzione chiamata quando l'utente clicca il pulsante "Salva"
  // useCallback = memoizza la funzione per evitare ri-creazioni inutili
  const saveDatabase = useCallback(() => {
    setIsSaving(true);  // Mostra feedback visuale "salvando..."
    try {
      DB.saveToLocalStorage();  // Esporta database in localStorage
      setTimeout(() => setIsSaving(false), 500); // Mostra "salvato!" per 500ms
    } catch (error) {
      console.error('Error saving database:', error);
      setIsSaving(false);
    }
  }, []);

  // ==========================================
  // 🐕 SPOSTAMENTO CANI TRA BOX
  // ==========================================
  // Funzione chiamata quando si fa drop di un cane su un box
  // useCallback ottimizza le performance evitando di ricreare la funzione ad ogni render
  // [boxes, dogs] = dependency array: ricrea la funzione solo quando boxes o dogs cambiano
  const moveDogToBox = useCallback((dogId: string, boxId: string) => {
    // 1. Trova il box di destinazione
    const targetBox = boxes.find(b => b.id === boxId);
    if (!targetBox) return;  // Se il box non esiste, interrompi

    // 2. VALIDAZIONE CAPACITÀ: controlla se c'è spazio nel box
    if (targetBox.capacity) {
      // Conta i cani già presenti nel box
      // Esclude il cane che stiamo spostando (nel caso fosse già in questo box)
      const currentDogsInBox = dogs.filter(d => d.box_id === boxId && d.id !== dogId).length;

      // Se il box è pieno, blocca l'operazione e avvisa l'utente
      if (currentDogsInBox >= targetBox.capacity) {
        toast.error(`Il box "${targetBox.name}" è pieno! Capacità massima: ${targetBox.capacity} cani.`, {
          duration: 4000,
          icon: '🚫',
        });
        return;  // Interrompi la funzione
      }
    }

    // 3. Aggiorna il database: imposta box_id del cane
    DB.updateDogBoxId(dogId, boxId);

    // 4. Ricarica i cani dal database e aggiorna lo state
    // Questo causa un re-render dell'UI con i dati aggiornati
    setDogs(DB.getDogs());
  }, [boxes, dogs]);  // Dipendenze: la funzione viene ricreata se boxes o dogs cambiano

  // ==========================================
  // 🔄 ALTRE OPERAZIONI SUI CANI
  // ==========================================

  // Rimuove un cane dal box (lo riporta tra i "non assegnati")
  const removeDogFromBox = useCallback((dogId: string) => {
    DB.updateDogBoxId(dogId, null);  // null = non assegnato
    setDogs(DB.getDogs());           // Aggiorna UI
  }, []);

  // Aggiunge un nuovo cane al database
  // Omit<Dog, 'id' | 'box_id'> = Dog senza i campi 'id' e 'box_id' (vengono generati qui)
  const addNewDog = useCallback((newDog: Omit<Dog, 'id' | 'box_id'>) => {
    // Genera un ID univoco combinando timestamp + stringa random
    // Esempio: "dog-1234567890-a1b2c3d4e"
    const id = `dog-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const dog: Dog = {
      ...newDog,         // Spread: copia tutti i campi da newDog (name, breed, owner, etc.)
      id,                // Aggiungi l'ID generato
      box_id: null,      // I nuovi cani partono "non assegnati"
    };

    DB.addDog(dog);      // Salva nel database
    setDogs(DB.getDogs()); // Aggiorna UI
  }, []);

  // ==========================================
  // 📦 OPERAZIONI SUI BOX
  // ==========================================

  // Aggiunge un nuovo box
  const addNewBox = useCallback((newBox: Omit<Box, 'id'>) => {
    // Genera ID univoco per il box
    const id = `box-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const box: Box = {
      ...newBox,  // Copia tutti i campi (name, description, x, y, etc.)
      id,
    };
    DB.addBox(box);
    setBoxes(DB.getBoxes());
  }, []);

  // Elimina un box
  const deleteBox = useCallback((boxId: string) => {
    DB.deleteBox(boxId);
    setBoxes(DB.getBoxes());  // Aggiorna lista box
    setDogs(DB.getDogs());    // Aggiorna anche i cani (potrebbero essere diventati "non assegnati")
  }, []);

  // Modifica un box esistente
  const updateBox = useCallback((boxId: string, name: string, description: string, color: string, capacity?: number) => {
    const box = boxes.find(b => b.id === boxId);  // Trova il box da modificare
    if (box) {
      // Merge dei vecchi dati con i nuovi
      DB.updateBox({ ...box, name, description, color, capacity });
      setBoxes(DB.getBoxes());
    }
  }, [boxes]);

  // Modifica un cane esistente
  // Partial<Dog> = oggetto con alcuni campi di Dog (non tutti obbligatori)
  const updateDog = useCallback((dogId: string, updates: Partial<Dog>) => {
    const dog = dogs.find(d => d.id === dogId);
    if (dog) {
      // Merge: mantieni i vecchi campi, sovrascrivi solo quelli in 'updates'
      DB.updateDog({ ...dog, ...updates });
      setDogs(DB.getDogs());
    }
  }, [dogs]);

  // Elimina un cane
  const deleteDog = useCallback((dogId: string) => {
    DB.deleteDog(dogId);
    setDogs(DB.getDogs());
  }, []);

  // ==========================================
  // 🔄 SINCRONIZZAZIONE AUTOMATICA NODI ↔ BOX
  // ==========================================
  // Questo useEffect si attiva ogni volta che boxes o dogs cambiano
  // Sincronizza i nodi React Flow con i dati dei box e dei cani
  useEffect(() => {
    setNodes((currentNodes) => {
      // Crea Set per lookup O(1) invece di array.find() O(n)
      const existingNodeIds = new Set(currentNodes.map(n => n.id));
      const currentBoxIds = new Set(boxes.map(b => b.id));

      // 1. Trova i box nuovi che non hanno ancora un nodo
      const newBoxes = boxes.filter(b => !existingNodeIds.has(b.id));

      // 2. Rimuovi i nodi per i box che sono stati eliminati
      let updatedNodes = currentNodes.filter(n => currentBoxIds.has(n.id));

      // 3. Aggiorna i nodi esistenti con i dati più recenti
      //    Questo è importante quando modifichi un box o sposti cani
      updatedNodes = updatedNodes.map((node) => {
        const box = boxes.find(b => b.id === node.id);
        if (!box) return node;  // Se per qualche motivo il box non esiste, mantieni il nodo com'è

        // Crea un nuovo oggetto nodo con i dati aggiornati
        return {
          ...node,  // Mantieni le proprietà del nodo (id, type, position)
          data: {
            ...node.data,  // Mantieni le altre proprietà di data
            // Aggiorna con i dati più recenti dal box
            name: box.name,
            description: box.description,
            color: box.color,
            capacity: box.capacity,
            // Aggiorna la lista dei cani (potrebbero essere cambiati!)
            dogs: dogs.filter((dog) => dog.box_id === node.id),
            isHighlighted: false,
            // Ricrea le callback (necessario per avere i reference aggiornati)
            onDogDrop: (dogId: string, targetBoxId: string) => moveDogToBox(dogId, targetBoxId),
            onDogRemove: (dogId: string) => removeDogFromBox(dogId),
            onDogEdit: (dogId: string) => setEditingDogId(dogId),
            onBoxEdit: (boxId: string) => setEditingBoxId(boxId),
            onBoxDelete: (boxId: string) => deleteBox(boxId),
          },
        };
      });

      // 4. Crea nodi per i box nuovi
      const newNodes: Node<BoxNodeData>[] = newBoxes.map((box) => ({
        id: box.id,
        type: 'boxNode',
        position: { x: box.x, y: box.y },
        data: {
          id: box.id,
          name: box.name,
          description: box.description,
          color: box.color,
          capacity: box.capacity,
          dogs: dogs.filter((dog) => dog.box_id === box.id),
          isHighlighted: false,
          onDogDrop: (dogId: string, targetBoxId: string) => moveDogToBox(dogId, targetBoxId),
          onDogRemove: (dogId: string) => removeDogFromBox(dogId),
          onDogEdit: (dogId: string) => setEditingDogId(dogId),
          onBoxEdit: (boxId: string) => setEditingBoxId(boxId),
          onBoxDelete: (boxId: string) => deleteBox(boxId),
        },
      }));

      // 5. Restituisci array finale: nodi aggiornati + nodi nuovi
      // Spread operator: [...array1, ...array2] = concatena i due array
      return [...updatedNodes, ...newNodes];
    });
  }, [boxes, dogs, setNodes, moveDogToBox, removeDogFromBox, deleteBox]);
  // Dipendenze: ri-esegui questo effect quando uno di questi valori cambia

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-neutral-50 to-stone-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐾</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-700 mx-auto mb-4"></div>
          <p className="text-slate-800 font-semibold text-lg">Caricamento Dog Box Planner...</p>
          <p className="text-slate-600 text-sm mt-2">Preparando i box per i nostri amici a quattro zampe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-stone-50 via-neutral-50 to-stone-100 relative">
      {/* Logo/Title in top-left */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <h1 className="text-3xl font-bold text-slate-800 drop-shadow-md flex items-center gap-2">
          <span className="text-4xl">🐾</span>
          Dog Box Planner
        </h1>
      </div>

      {/* Action buttons in top-right */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`group relative p-4 ${isSidebarOpen ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-700 hover:text-white'} rounded-full transition-all shadow-lg hover:shadow-xl border border-slate-200`}
          title="Cani non assegnati"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Cani non assegnati
          </span>
        </button>
        <button
          onClick={saveDatabase}
          disabled={isSaving}
          className={`group relative p-4 ${isSaving ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-700 hover:text-white'} rounded-full transition-all shadow-lg hover:shadow-xl border border-slate-200`}
          title="Salva modifiche"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {isSaving ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            )}
          </svg>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {isSaving ? 'Salvato!' : 'Salva modifiche'}
          </span>
        </button>
        <button
          onClick={() => setIsAddBoxModalOpen(true)}
          className="group relative p-4 bg-white text-slate-700 hover:bg-slate-700 hover:text-white rounded-full transition-all shadow-lg hover:shadow-xl border border-slate-200"
          title="Aggiungi box"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Aggiungi box
          </span>
        </button>
        <button
          onClick={() => setIsAddDogModalOpen(true)}
          className="group relative p-4 bg-white text-slate-700 hover:bg-slate-700 hover:text-white rounded-full transition-all shadow-lg hover:shadow-xl border border-slate-200"
          title="Aggiungi cane"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Aggiungi cane
          </span>
        </button>
      </div>

      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          panOnDrag={[1, 2]}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 50, y: 50, zoom: 1 }}
        >
          <Background color="#cbd5e1" gap={20} size={1.5} />
          <Controls className="bg-white/95 rounded-xl shadow-lg border-2 border-slate-200" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as BoxNodeData;
              return (data.color as string) || '#64748b';
            }}
            maskColor="rgba(248, 250, 252, 0.8)"
            position="bottom-right"
            className="bg-white/95 rounded-xl shadow-lg border-2 border-slate-200"
            zoomable
            pannable
          />
        </ReactFlow>
      </div>

      {/* Sidebar with unassigned dogs */}
      {isSidebarOpen && (
        <div className="absolute right-6 top-24 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-5 max-w-xs border-2 border-slate-200 transition-all">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h3 className="font-bold text-slate-800 text-lg">Cani Non Assegnati</h3>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Search bar */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca cane..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 text-sm"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            {dogs.filter((dog) => !dog.box_id && dog.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <span className="text-4xl block mb-2">🔍</span>
                    <p className="text-sm text-gray-500 font-medium">
                      Nessun cane trovato
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-5xl block mb-2">🎉</span>
                    <p className="text-sm text-slate-700 font-medium">
                      Tutti i cani sono assegnati!
                    </p>
                  </>
                )}
              </div>
            ) : (
              dogs
                .filter((dog) => !dog.box_id && dog.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((dog) => (
                <div
                  key={dog.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('dogId', dog.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="text-sm p-3 rounded-xl shadow-md cursor-grab active:cursor-grabbing bg-white hover:bg-slate-50 hover:shadow-lg transition-all border-2 border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    {dog.image ? (
                      <img
                        src={dog.image}
                        alt={dog.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="text-base">🐾</span>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{dog.name}</p>
                      {dog.breed && (
                        <p className="text-xs text-gray-500">{dog.breed}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDogId(dog.id);
                        }}
                        className="text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-all shadow-sm hover:shadow"
                        title="Modifica cane"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmWithToast(
                            `Sei sicuro di voler eliminare "${dog.name}"?`,
                            () => deleteDog(dog.id)
                          );
                        }}
                        className="text-red-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-full p-1.5 transition-all shadow-sm hover:shadow"
                        title="Elimina cane"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Box Modal */}
      <AddBoxModal
        isOpen={isAddBoxModalOpen}
        onClose={() => setIsAddBoxModalOpen(false)}
        onAddBox={addNewBox}
      />

      {/* Add Dog Modal */}
      <AddDogModal
        isOpen={isAddDogModalOpen}
        onClose={() => setIsAddDogModalOpen(false)}
        onAddDog={addNewDog}
      />

      {/* Edit Box Modal */}
      <EditBoxModal
        isOpen={editingBoxId !== null}
        box={boxes.find(b => b.id === editingBoxId) || null}
        onClose={() => setEditingBoxId(null)}
        onSave={updateBox}
      />

      {/* Edit Dog Modal */}
      <EditDogModal
        isOpen={editingDogId !== null}
        dog={dogs.find(d => d.id === editingDogId) || null}
        onClose={() => setEditingDogId(null)}
        onSave={updateDog}
      />

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '2px solid #e2e8f0',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
