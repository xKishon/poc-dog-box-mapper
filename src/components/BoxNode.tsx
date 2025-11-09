import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { BoxNodeData } from '../types';

function BoxNode({ data }: NodeProps<BoxNodeData>) {
  const { id, name, description, color, capacity, dogs, isHighlighted, onDogDrop, onDogRemove, onDogEdit, onBoxEdit, onBoxDelete } = data;
  const [isDragOver, setIsDragOver] = useState(false);

  // Default to amber if no color specified
  const boxColor = color || '#fbbf24';

  // Check if box is full
  const isFull = capacity ? dogs.length >= capacity : false;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the box container
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const dogId = e.dataTransfer.getData('dogId');
    if (dogId && dogId !== '') {
      onDogDrop(dogId, id);
    }
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      animate={{
        scale: isDragOver ? 1.05 : 1,
        boxShadow: isDragOver
          ? '0 0 0 3px rgba(59, 130, 246, 0.5)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: `linear-gradient(to bottom right, ${boxColor}20, ${boxColor}40)`,
        borderColor: isDragOver ? '#3b82f6' : boxColor,
      }}
      className={`p-4 border-2 rounded-lg min-w-[280px] max-w-[380px]`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div className="mb-3 box-header drag-handle cursor-move">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-amber-900 break-words">{name}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Capacity indicator */}
            <div className={`flex items-center gap-1 text-xs font-semibold ${isFull ? 'text-red-600' : 'text-amber-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{dogs.length}{capacity ? `/${capacity}` : ''}</span>
            </div>
            {/* Edit/Delete buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBoxEdit(id);
              }}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded p-1 transition-colors"
              title="Modifica box"
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
                if (window.confirm(`Sei sicuro di voler eliminare il box "${name}"? I cani verranno spostati nei non assegnati.`)) {
                  onBoxDelete(id);
                }
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors"
              title="Elimina box"
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
        {description && (
          <p className="text-xs text-amber-600 mb-2 break-words">{description}</p>
        )}
      </div>

      <div className="space-y-1.5">
        {dogs.length === 0 ? (
          <p className="text-xs text-amber-600 italic py-2 box-header">Box vuoto</p>
        ) : (
          dogs.map((dog) => (
            <div
              key={dog.id}
              draggable
              onDragStart={(e: React.DragEvent) => {
                e.dataTransfer.setData('dogId', dog.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="dog-card nodrag text-sm p-2.5 rounded shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white hover:bg-gray-50"
            >
              <div className="flex items-start gap-2">
                {dog.image ? (
                  <img
                    src={dog.image}
                    alt={dog.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="text-xl">🐾</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      {dog.breed && (
                        <p className="text-xs text-gray-500">{dog.breed}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDogEdit(dog.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded p-1 transition-colors"
                        title="Modifica cane"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDogRemove(dog.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-1 transition-colors"
                        title="Rimuovi dal box"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Additional info */}
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {dog.owner && (
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">{dog.owner}</span>
                      </div>
                    )}
                    {dog.phone && (
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span>{dog.phone}</span>
                      </div>
                    )}
                    {(dog.check_in || dog.check_out) && (
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px]">
                          {dog.check_in ? new Date(dog.check_in).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '?'}
                          {' → '}
                          {dog.check_out ? new Date(dog.check_out).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '?'}
                        </span>
                      </div>
                    )}
                    {dog.notes && (
                      <div className="text-gray-500 italic truncate" title={dog.notes}>
                        {dog.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </motion.div>
  );
}

export default memo(BoxNode);
