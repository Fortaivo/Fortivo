// Simple toast notification system
let toastContainer: HTMLDivElement | null = null;

function createToastContainer() {
  if (toastContainer) return;
  
  toastContainer = document.createElement('div');
  toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
  document.body.appendChild(toastContainer);
}

function createToast(message: string, type: 'success' | 'error' | 'loading') {
  createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `
    px-4 py-2 rounded-lg shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-green-500 text-white' : ''}
    ${type === 'error' ? 'bg-red-500 text-white' : ''}
    ${type === 'loading' ? 'bg-indigo-500 text-white' : ''}
  `;
  toast.textContent = message;

  toastContainer?.appendChild(toast);

  if (type !== 'loading') {
    setTimeout(() => {
      toast.remove();
      if (toastContainer?.children.length === 0) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 3000);
  }

  return toast;
}

export const toast = {
  success: (message: string) => createToast(message, 'success'),
  error: (message: string) => createToast(message, 'error'),
  loading: (message: string) => createToast(message, 'loading'),
  dismiss: (toast: HTMLDivElement) => toast.remove(),
};