"use client";

import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

// Esta variable controla si se muestra o no la alerta en todas las páginas
export const SHOW_IMPLEMENTATION_NOTICE = true;

const ImplementationNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Carga con un pequeño retraso para permitir que la página se renderice primero
    const timer = setTimeout(() => {
      if (SHOW_IMPLEMENTATION_NOTICE) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 max-w-sm bg-blue-100 border border-blue-500 text-blue-700 p-4 rounded-lg shadow-lg z-50 animate-fade-in-up"
      role="alert"
      style={{
        animation: "fadeIn 0.5s",
        zIndex: 9999,
      }}
    >
      <div className="flex justify-between items-start">
        <p className="font-medium">Implementation Notice</p>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-700 hover:text-blue-900 focus:outline-none"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <p className="mt-2">
        We are currently implementing our pricing structure. During this period,
        all users have access to 5-minute update intervals. We&apos;ll notify
        you when the pricing tiers are fully implemented.
      </p>
    </div>
  );
};

// Agrega una animación de aparición
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ImplementationNoticeWithStyles: React.FC = () => {
  return (
    <>
      <style jsx global>
        {styles}
      </style>
      <ImplementationNotice />
    </>
  );
};

export default ImplementationNoticeWithStyles;
