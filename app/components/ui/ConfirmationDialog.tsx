// Confirmation dialog component for critical actions
'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  children
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center">
            {confirmVariant === 'danger' && (
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            )}
            
            <div className={confirmVariant === 'danger' ? 'ml-4' : ''}>
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
            </div>
          </div>
          
          <div className={`mt-2 ${confirmVariant === 'danger' ? 'ml-14' : ''}`}>
            <div className="text-sm text-gray-500">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>

          {children && (
            <div className={`mt-4 ${confirmVariant === 'danger' ? 'ml-14' : ''}`}>
              {children}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Specialized delete confirmation dialog
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  isLoading?: boolean;
  additionalWarning?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading = false,
  additionalWarning
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      message={
        <div>
          <p>Are you sure you want to delete <strong>{itemName}</strong>?</p>
          {additionalWarning && (
            <p className="mt-2 text-red-600 font-medium">{additionalWarning}</p>
          )}
          <p className="mt-2">This action cannot be undone.</p>
        </div>
      }
      confirmLabel={`Delete ${itemType}`}
      confirmVariant="danger"
      isLoading={isLoading}
    />
  );
}

// Hook for managing confirmation dialogs
export function useConfirmation() {
  const confirm = (config: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'primary' | 'danger';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      // This would typically integrate with a global dialog provider
      // For now, we'll use the browser confirm for simplicity
      const result = window.confirm(`${config.title}\n\n${config.message}`);
      resolve(result);
    });
  };

  const confirmDelete = (itemName: string, itemType: string = 'item'): Promise<boolean> => {
    return confirm({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmLabel: `Delete ${itemType}`,
      confirmVariant: 'danger'
    });
  };

  return {
    confirm,
    confirmDelete
  };
}