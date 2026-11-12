"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { buttonVariants } from "@/components/ui/button";

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
    <div>
      <div className="text-sm text-muted-foreground mb-4">
        <p>
          We&apos;ll send you up to 3 email notifications when your scrobbler encounters
          authentication issues that require your attention (like an expired YouTube Music
          cookie). Notifications are sent immediately, then after 2 days, and finally after 5 days.
          After 3 consecutive authentication failures, your account will be automatically paused until you update your credentials.
        </p>
      </div>

      {/* Control de activación independiente */}
      <div className="mb-6 border-b pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              disabled={toggleLoading}
              className="h-5 w-5 rounded border-input accent-[hsl(var(--primary))]"
            />
            <label
              htmlFor="enabled"
              className="ml-3 block text-sm font-medium"
            >
              Enable email notifications
            </label>
          </div>
          {toggleLoading && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>

        {toggleMessage && (
          <div
            className={`mt-2 p-2 text-sm rounded-md ${
              toggleMessage.type === "success"
                ? "bg-success-soft text-success border border-success/30"
                : "bg-danger-soft text-destructive border border-destructive/30"
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
            className="mb-1.5 block text-sm font-medium"
          >
            Notification Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground"
              placeholder="your@email.com"
              required
            />
            <button
              type="button"
              onClick={() => setEmail(defaultValues.email)}
              className="shrink-0 rounded-lg border border-input px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
              title="Reset to default value"
              disabled={email === defaultValues.email}
            >
              Reset
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            This email will receive authentication failure notifications (up to 3 per issue).
            If left blank, we&apos;ll use your account email ({userEmail}).
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className={buttonVariants()}
          >
            {loading ? "Saving..." : "Update Email"}
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={resetForm}
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-2 p-2 text-sm rounded-md ${
              message.type === "success"
                ? "bg-success-soft text-success border border-success/30"
                : "bg-danger-soft text-destructive border border-destructive/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {defaultValues.email !== userEmail && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            Default notification email: {userEmail}
          </div>
        )}
      </form>
    </div>
  );
}
