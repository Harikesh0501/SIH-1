"use client";

import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

/**
 * Institutional Government Modal Dialog
 * Accessible, responsive, with mobile fullscreen adaptation and ESC key closing.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className,
  showCloseButton = true,
}) {
  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    '2xl': "max-w-5xl",
    full: "max-w-[95vw] h-[90vh]",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl border border-slate-200 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh] modal-fullscreen-mobile animate-in fade-in zoom-in-95 duration-150",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, className, ...props }) {
  return (
    <div
      className={cn("px-6 py-4 border-b border-slate-100 bg-slate-50/50 pr-12", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalTitle({ children, className, ...props }) {
  return (
    <h2
      className={cn("text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function ModalDescription({ children, className, ...props }) {
  return (
    <p
      className={cn("text-xs text-slate-500 mt-1 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function ModalBody({ children, className, ...props }) {
  return (
    <div
      className={cn("p-6 overflow-y-auto flex-1 text-sm text-slate-700 leading-relaxed", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalFooter({ children, className, ...props }) {
  return (
    <div
      className={cn("px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Modal;
