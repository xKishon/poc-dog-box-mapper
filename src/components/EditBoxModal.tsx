import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '../types';

interface EditBoxModalProps {
  isOpen: boolean;
  box: Box | null;
  onClose: () => void;
  onSave: (boxId: string, name: string, description: string, color: string, capacity?: number) => void;
}

export default function EditBoxModal({ isOpen, box, onClose, onSave }: EditBoxModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#fbbf24');
  const [capacity, setCapacity] = useState('');

  // Update form when box changes
  useEffect(() => {
    if (box) {
      setName(box.name);
      setDescription(box.description || '');
      setColor(box.color || '#fbbf24');
      setCapacity(box.capacity?.toString() || '');
    }
  }, [box]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !box) return;

    const capacityNum = capacity.trim() ? parseInt(capacity) : undefined;
    onSave(box.id, name.trim(), description.trim(), color, capacityNum);
    onClose();
  };

  if (!box) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Modifica Box
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Required */}
              <div>
                <label htmlFor="box-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="box-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Box A"
                />
              </div>

              {/* Description - Optional */}
              <div>
                <label htmlFor="box-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  id="box-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Box per cani di taglia grande"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label htmlFor="box-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Colore
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="box-color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <div
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                    style={{
                      background: `linear-gradient(to right, ${color}20, ${color}40)`,
                      borderColor: color
                    }}
                  >
                    {color}
                  </div>
                </div>
              </div>

              {/* Capacity - Optional */}
              <div>
                <label htmlFor="box-capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacità Massima
                </label>
                <input
                  type="number"
                  id="box-capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Lascia vuoto per nessun limite"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Salva
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
