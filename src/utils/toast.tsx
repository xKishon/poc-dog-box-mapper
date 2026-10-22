import toast from 'react-hot-toast';

// Helper function per conferme con toast
export const confirmWithToast = (message: string, onConfirm: () => void) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3">
        <p className="text-gray-800 font-medium">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              onConfirm();
              toast.dismiss(t.id);
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Conferma
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      icon: '⚠️',
    }
  );
};
