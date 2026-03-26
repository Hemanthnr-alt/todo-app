import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
      },
      icon: '🎉',
      duration: 3000,
    });
  },
  
  error: (message) => {
    toast.error(message, {
      style: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
      },
      icon: '❌',
      duration: 4000,
    });
  },
  
  info: (message) => {
    toast(message, {
      style: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
      },
      icon: 'ℹ️',
      duration: 3000,
    });
  },
  
  warning: (message) => {
    toast(message, {
      style: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
      },
      icon: '⚠️',
      duration: 3500,
    });
  },
  
  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px',
        fontSize: '14px',
      },
    });
  },
};

export default showToast;