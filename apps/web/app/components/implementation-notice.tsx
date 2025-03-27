"use client";

import React from "react";

// Esta variable controla si se muestra o no la alerta en todas las páginas
export const SHOW_IMPLEMENTATION_NOTICE = true;

const ImplementationNotice: React.FC = () => {
  if (!SHOW_IMPLEMENTATION_NOTICE) {
    return null;
  }

  return (
    <div
      className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-8"
      role="alert"
    >
      <p className="font-medium">Implementation Notice</p>
      <p>
        We are currently implementing our pricing structure. During this period,
        all users have access to 5-minute update intervals. We&apos;ll notify
        you when the pricing tiers are fully implemented.
      </p>
    </div>
  );
};

export default ImplementationNotice;
