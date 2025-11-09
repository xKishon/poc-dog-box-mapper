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
import BoxNode from './components/BoxNode';
import AddDogModal from './components/AddDogModal';
import AddBoxModal from './components/AddBoxModal';
import EditBoxModal from './components/EditBoxModal';
import EditDogModal from './components/EditDogModal';
import { Dog, Box, BoxNodeData } from './types';
import * as DB from './services/db';

const nodeTypes: NodeTypes = {
  boxNode: BoxNode,
};

function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isAddDogModalOpen, setIsAddDogModalOpen] = useState(false);
  const [isAddBoxModalOpen, setIsAddBoxModalOpen] = useState(false);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize database and load data
  useEffect(() => {
    async function loadData() {
      try {
        await DB.initDatabase();
        setBoxes(DB.getBoxes());
        setDogs(DB.getDogs());
      } catch (error) {
        console.error('Error loading database:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Create nodes from boxes with their dogs
  const initialNodes: Node<BoxNodeData>[] = boxes.map((box) => ({
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Custom onNodesChange to save box positions
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);

    // Update box positions in database when nodes are dragged
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        DB.updateBoxPosition(change.id, change.position.x, change.position.y);
        setBoxes(DB.getBoxes());
      }
    });
  }, [onNodesChange]);

  // Function to save database to localStorage
  const saveDatabase = useCallback(() => {
    setIsSaving(true);
    try {
      DB.saveToLocalStorage();
      setTimeout(() => setIsSaving(false), 500); // Show saved state briefly
    } catch (error) {
      console.error('Error saving database:', error);
      setIsSaving(false);
    }
  }, []);

  // Function to move dog to a box
  const moveDogToBox = useCallback((dogId: string, boxId: string) => {
    // Find the target box
    const targetBox = boxes.find(b => b.id === boxId);
    if (!targetBox) return;

    // Check if box has a capacity limit
    if (targetBox.capacity) {
      // Count current dogs in the box (excluding the dog being moved if it's already there)
      const currentDogsInBox = dogs.filter(d => d.box_id === boxId && d.id !== dogId).length;

      // Check if there's space
      if (currentDogsInBox >= targetBox.capacity) {
        alert(`Il box "${targetBox.name}" è pieno! Capacità massima: ${targetBox.capacity} cani.`);
        return;
      }
    }

    DB.updateDogBoxId(dogId, boxId);
    setDogs(DB.getDogs());
  }, [boxes, dogs]);

  // Function to remove dog from box (unassign)
  const removeDogFromBox = useCallback((dogId: string) => {
    DB.updateDogBoxId(dogId, null);
    setDogs(DB.getDogs());
  }, []);

  // Function to add a new dog
  const addNewDog = useCallback((newDog: Omit<Dog, 'id' | 'box_id'>) => {
    const id = `dog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dog: Dog = {
      ...newDog,
      id,
      box_id: null, // New dogs start unassigned
    };
    DB.addDog(dog);
    setDogs(DB.getDogs());
  }, []);

  // Function to add a new box
  const addNewBox = useCallback((newBox: Omit<Box, 'id'>) => {
    const id = `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const box: Box = {
      ...newBox,
      id,
    };
    DB.addBox(box);
    setBoxes(DB.getBoxes());
  }, []);

  // Function to delete a box
  const deleteBox = useCallback((boxId: string) => {
    DB.deleteBox(boxId);
    setBoxes(DB.getBoxes());
    setDogs(DB.getDogs());
  }, []);

  // Function to update box
  const updateBox = useCallback((boxId: string, name: string, description: string, color: string, capacity?: number) => {
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      DB.updateBox({ ...box, name, description, color, capacity });
      setBoxes(DB.getBoxes());
    }
  }, [boxes]);

  // Function to update dog
  const updateDog = useCallback((dogId: string, updates: Partial<Dog>) => {
    const dog = dogs.find(d => d.id === dogId);
    if (dog) {
      DB.updateDog({ ...dog, ...updates });
      setDogs(DB.getDogs());
    }
  }, [dogs]);

  // Sync nodes with boxes - handle additions and deletions
  useEffect(() => {
    setNodes((currentNodes) => {
      const existingNodeIds = new Set(currentNodes.map(n => n.id));
      const currentBoxIds = new Set(boxes.map(b => b.id));

      // Find new boxes to add
      const newBoxes = boxes.filter(b => !existingNodeIds.has(b.id));

      // Remove deleted nodes
      let updatedNodes = currentNodes.filter(n => currentBoxIds.has(n.id));

      // Update existing nodes
      updatedNodes = updatedNodes.map((node) => {
        const box = boxes.find(b => b.id === node.id);
        if (!box) return node;

        return {
          ...node,
          data: {
            ...node.data,
            name: box.name,
            description: box.description,
            color: box.color,
            capacity: box.capacity,
            dogs: dogs.filter((dog) => dog.box_id === node.id),
            isHighlighted: false,
            onDogDrop: (dogId: string, targetBoxId: string) => moveDogToBox(dogId, targetBoxId),
            onDogRemove: (dogId: string) => removeDogFromBox(dogId),
            onDogEdit: (dogId: string) => setEditingDogId(dogId),
            onBoxEdit: (boxId: string) => setEditingBoxId(boxId),
            onBoxDelete: (boxId: string) => deleteBox(boxId),
          },
        };
      });

      // Add new nodes
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

      return [...updatedNodes, ...newNodes];
    });
  }, [boxes, dogs, setNodes, moveDogToBox, removeDogFromBox, deleteBox]);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              🐾 PawPlan - Dog Box Mapper
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Trascina i cani tra i box o dal pannello laterale per assegnarli
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveDatabase}
              disabled={isSaving}
              className={`px-4 py-2 ${isSaving ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center gap-2 shadow-md`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {isSaving ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                )}
              </svg>
              {isSaving ? 'Salvato!' : 'Salva'}
            </button>
            <button
              onClick={() => setIsAddBoxModalOpen(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Aggiungi Box
            </button>
            <button
              onClick={() => setIsAddDogModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Aggiungi Cane
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          nodesDragHandle=".drag-handle"
          panOnDrag={[1, 2]}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 50, y: 50, zoom: 1 }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data.isHighlighted) return '#3b82f6';
              return '#fbbf24';
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
            position="bottom-right"
          />
        </ReactFlow>
      </div>

      {/* Sidebar with unassigned dogs */}
      <div className="absolute right-4 top-20 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-bold text-gray-800 mb-3">Cani Non Assegnati</h3>
        <div className="space-y-2">
          {dogs.filter((dog) => !dog.box_id).length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Tutti i cani sono assegnati
            </p>
          ) : (
            dogs
              .filter((dog) => !dog.box_id)
              .map((dog) => (
                <div
                  key={dog.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('dogId', dog.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="text-sm p-2 rounded shadow-sm cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-gray-100 hover:shadow-md transition-all"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDogId(dog.id);
                      }}
                      className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors flex-shrink-0"
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
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

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
    </div>
  );
}

export default App;
