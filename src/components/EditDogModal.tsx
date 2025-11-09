import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dog } from '../types';

interface EditDogModalProps {
  isOpen: boolean;
  dog: Dog | null;
  onClose: () => void;
  onSave: (dogId: string, updates: Partial<Dog>) => void;
}

export default function EditDogModal({ isOpen, dog, onClose, onSave }: EditDogModalProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | undefined>(undefined);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');

  // Update form when dog changes
  useEffect(() => {
    if (dog) {
      setName(dog.name);
      setBreed(dog.breed || '');
      setOwner(dog.owner || '');
      setPhone(dog.phone || '');
      setCurrentImage(dog.image);
      setImageFile(null);
      setCheckIn(dog.check_in || '');
      setCheckOut(dog.check_out || '');
      setNotes(dog.notes || '');
    }
  }, [dog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dog) return;

    // Convert new image to base64 if present
    let imageBase64: string | undefined = currentImage;
    if (imageFile) {
      imageBase64 = await fileToBase64(imageFile);
    }

    onSave(dog.id, {
      name: name.trim(),
      breed: breed.trim() || undefined,
      owner: owner.trim() || undefined,
      phone: phone.trim() || undefined,
      image: imageBase64,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setCurrentImage(undefined);
    setImageFile(null);
  };

  if (!dog) return null;

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
              Modifica Cane
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Required */}
              <div>
                <label htmlFor="dog-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dog-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Max"
                />
              </div>

              {/* Breed - Optional */}
              <div>
                <label htmlFor="dog-breed" className="block text-sm font-medium text-gray-700 mb-1">
                  Razza
                </label>
                <input
                  type="text"
                  id="dog-breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. Golden Retriever"
                />
              </div>

              {/* Owner - Optional */}
              <div>
                <label htmlFor="dog-owner" className="block text-sm font-medium text-gray-700 mb-1">
                  Proprietario
                </label>
                <input
                  type="text"
                  id="dog-owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome proprietario"
                />
              </div>

              {/* Phone - Optional */}
              <div>
                <label htmlFor="dog-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono
                </label>
                <input
                  type="tel"
                  id="dog-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es. 123-456-7890"
                />
              </div>

              {/* Image - Optional */}
              <div>
                <label htmlFor="dog-image" className="block text-sm font-medium text-gray-700 mb-1">
                  Foto
                </label>
                <input
                  type="file"
                  id="dog-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(currentImage || imageFile) && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : currentImage}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Rimuovi foto
                    </button>
                  </div>
                )}
              </div>

              {/* Check-in Date - Optional */}
              <div>
                <label htmlFor="dog-check-in" className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Ora Entrata
                </label>
                <input
                  type="datetime-local"
                  id="dog-check-in"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Check-out Date - Optional */}
              <div>
                <label htmlFor="dog-check-out" className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Ora Uscita
                </label>
                <input
                  type="datetime-local"
                  id="dog-check-out"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes - Optional */}
              <div>
                <label htmlFor="dog-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  id="dog-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note aggiuntive sul cane..."
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
