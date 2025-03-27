"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { toggleNotifications, updateNotificationPreferences } from "../actions";

interface NotificationPreferencesProps {
  notificationEmail: string | null;
  userEmail: string;
  notificationsEnabled: boolean;
}

export default function NotificationPreferences({
  notificationEmail,
  userEmail,
  notificationsEnabled,
}: NotificationPreferencesProps) {
  const router = useRouter();
  const [email, setEmail] = useState(notificationEmail || userEmail);
  const [enabled, setEnabled] = useState(notificationsEnabled);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [toggleMessage, setToggleMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Guardar los valores originales para poder resetear el formulario
  const defaultValues = {
    email: notificationEmail || userEmail,
  };

  const resetForm = () => {
    setEmail(defaultValues.email);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Ya no enviamos el estado enabled en este formulario
      const result = await updateNotificationPreferences(email, enabled);

      if (result.success) {
        setMessage({
          text: "Email updated successfully!",
          type: "success",
        });
        router.refresh();
      } else {
        setMessage({
          text: result.error || "Failed to update email",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (newState: boolean) => {
    setToggleLoading(true);
    setToggleMessage(null);

    try {
      const result = await toggleNotifications(newState);

      if (result.success) {
        setEnabled(newState);
        setToggleMessage({
          text: newState
            ? "Notifications enabled successfully!"
            : "Notifications disabled successfully!",
          type: "success",
        });
        router.refresh();
      } else {
        setToggleMessage({
          text: result.error || "Failed to update notification status",
          type: "error",
        });
      }
    } catch (error) {
      setToggleMessage({
        text: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setToggleLoading(false);
    }
  };

  // Verificar si los valores actuales son diferentes de los por defecto
  const hasChanges = email !== defaultValues.email;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-sm text-gray-600 mb-3">
        <strong>Email Notifications</strong>
        <p className="mt-1">
          We&apos;ll send you email notifications when your scrobbler encounters
          issues that require your attention, like when your YouTube Music
          headers need updating.
        </p>
      </div>

      {/* Control de activación independiente */}
      <div className="mb-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              disabled={toggleLoading}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="enabled"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Enable email notifications
            </label>
          </div>
          {toggleLoading && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
        </div>

        {toggleMessage && (
          <div
            className={`mt-2 p-2 text-sm rounded-md ${
              toggleMessage.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toggleMessage.text}
          </div>
        )}
      </div>

      {/* Formulario para el email */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Notification Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
              placeholder="your@email.com"
              required
            />
            <button
              type="button"
              onClick={() => setEmail(defaultValues.email)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
              title="Reset to default value"
              disabled={email === defaultValues.email}
            >
              Reset
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Make sure your email is up to date to receive important
            notifications about your scrobbling service.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Email"}
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-2 p-2 text-sm rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {defaultValues.email !== userEmail && (
          <div className="mt-1 text-xs text-gray-500">
            Default notification email: {userEmail}
          </div>
        )}
      </form>
    </div>
  );
}
