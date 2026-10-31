'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { buildWhatsAppDeepLink } from '@/lib/templates';
import type { ReminderType } from '@/lib/types';

interface ReminderItem {
  agreementId: string;
  customerName: string;
  customerPhone: string;
  deviceName: string;
  remainingAmountNaira: number;
  dueDate: string;
  reminderType: ReminderType;
  lastReminderSentAt?: string;
}

export default function WorkerRemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadQueues() {
      try {
        const res = await fetch('/api/worker/queues');
        if (res.ok) {
          const json = await res.json();
          setReminders(json.data.remindersDue);
        }
      } catch {
        setFeedbackMsg('Failed to fetch reminders.');
      } finally {
        setLoading(false);
      }
    }
    void loadQueues();
  }, []);

  async function handleMarkSent(item: ReminderItem) {
    setLoggingId(item.agreementId);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/worker/log-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: item.agreementId,
          reminderType: item.reminderType,
          recipientPhone: item.customerPhone,
          status: 'SENT',
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSentMap((prev) => ({
          ...prev,
          [item.agreementId]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setFeedbackMsg(`WhatsApp reminder for ${item.customerName} logged to WhatsAppReminderLog and AuditLog.`);
      } else {
        setFeedbackMsg(json.error?.message || 'Failed to log reminder.');
      }
    } catch {
      setFeedbackMsg('Network error logging reminder.');
    } finally {
      setLoggingId(null);
    }
  }

  const filteredReminders = reminders.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.reminderType === filterType;
  });

  return (
    <div className="space-y-spacing-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-spacing-3 pb-spacing-4 border-b border-border-default">
        <div>
          <h1 className="text-title-lg font-bold text-text-primary tracking-tight">
            WhatsApp Reminder Checklist
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Manual reminder schedule for active flexi-pay contracts (FR-07). Click to open WhatsApp and log dispatches.
          </p>
        </div>
        <Link
          href="/worker"
          className="inline-flex items-center justify-center px-spacing-4 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-surface-primary text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {feedbackMsg && (
        <div className="p-spacing-4 rounded-radius-md bg-badge-success-subtle text-badge-success-fg border border-badge-success-subtle text-body-sm font-medium">
          {feedbackMsg}
        </div>
      )}

      {/* Schedule Tabs */}
      <div className="flex flex-wrap items-center gap-spacing-2 border-b border-border-subtle pb-spacing-2">
        {['ALL', 'T-7', 'T-3', 'T-1', 'T-0', 'T+1'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterType(tab)}
            className={`px-spacing-3 py-spacing-1.5 rounded-radius-md text-body-sm font-semibold transition-colors ${
              filterType === tab
                ? 'bg-brand-primary text-text-inverse'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'ALL' ? 'All Due Reminders' : tab}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="bg-surface-primary rounded-radius-lg border border-border-default shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-spacing-12 text-center text-text-muted">Loading due reminders...</div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-spacing-12 text-center text-text-muted text-body-sm">
            No customer reminders matching this filter schedule.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredReminders.map((item) => {
              const messageText =
                item.reminderType === 'T-0'
                  ? `Hello ${item.customerName}, today is the due date for your DG Tech Store Flexi-Pay balance of ₦${item.remainingAmountNaira.toLocaleString()} for the ${item.deviceName}. Please visit Shop ATF 03 or complete transfer today. Thank you!`
                  : `Hello ${item.customerName}, this is a friendly reminder from DG Tech Store (Shop ATF 03) that your remaining balance of ₦${item.remainingAmountNaira.toLocaleString()} for your ${item.deviceName} is due on ${new Date(item.dueDate).toLocaleDateString()}. Thank you!`;

              const waLink = buildWhatsAppDeepLink(item.customerPhone, messageText);
              const sentAt = sentMap[item.agreementId] || item.lastReminderSentAt;

              return (
                <div
                  key={item.agreementId}
                  className="p-spacing-4 sm:p-spacing-5 flex flex-col md:flex-row md:items-center md:justify-between gap-spacing-4 hover:bg-surface-secondary transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-spacing-2">
                      <span className="font-bold text-text-primary text-body-md">
                        {item.customerName}
                      </span>
                      <span className="text-caption text-text-muted">
                        ({item.customerPhone})
                      </span>
                      <span className="text-caption font-bold px-spacing-2 py-0.5 rounded-radius-sm bg-badge-warning-subtle text-badge-warning-fg uppercase">
                        {item.reminderType} Reminder
                      </span>
                    </div>
                    <div className="text-body-sm text-text-secondary">
                      Device: <span className="font-semibold text-text-primary">{item.deviceName}</span> • Due: {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-caption text-text-muted">
                      Outstanding: <strong className="text-text-primary font-bold">₦{item.remainingAmountNaira.toLocaleString()}</strong>
                      {sentAt && (
                        <span className="ml-2 text-badge-success-fg font-medium">
                          ✓ Sent today at {sentAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-spacing-3 self-start md:self-auto">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-spacing-3 py-spacing-2 text-body-sm font-semibold rounded-radius-md border border-border-default bg-surface-primary text-text-primary hover:bg-surface-secondary transition-colors inline-flex items-center gap-spacing-1.5"
                    >
                      💬 Open in WhatsApp
                    </a>

                    <button
                      type="button"
                      disabled={loggingId === item.agreementId}
                      onClick={() => handleMarkSent(item)}
                      className="px-spacing-3 py-spacing-2 text-body-sm font-semibold rounded-radius-md bg-brand-primary text-text-inverse hover:bg-brand-hover active:bg-brand-active disabled:bg-surface-disabled transition-colors whitespace-nowrap"
                    >
                      {loggingId === item.agreementId ? 'Logging...' : '✓ Mark as Sent'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
