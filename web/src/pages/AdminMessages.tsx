import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Message, MessageStatus } from "../api/types";
import { useAdminMessages } from "../components/Layout";
import { useToast } from "../components/Toasts";
import { formatDate } from "../lib/format";
import { useTitle } from "../lib/useTitle";

const STATUS_LABELS: Record<MessageStatus, string> = {
  UNREAD: "Unread",
  READ: "Read",
  ARCHIVED: "Archived",
};

export function AdminMessages() {
  useTitle("Messages");
  const queryClient = useQueryClient();
  const notify = useToast();
  const [status, setStatus] = useState<MessageStatus | "">("");
  const messages = useAdminMessages();

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) =>
      api(`/messages/${id}`, { method: "PUT", body: { status } }),
    onSuccess: (_, { status }) => {
      notify(status === "ARCHIVED" ? "Message archived." : "Message marked as read.");
      return queryClient.invalidateQueries({ queryKey: ["private", "messages"] });
    },
    onError: (error) => notify(`Could not update the message: ${error.message}`),
  });

  const visible = (messages.data ?? []).filter(
    (message) =>
      status ? message.status === status : message.status !== "ARCHIVED",
  );

  const from = (message: Message) =>
    message.user
      ? `${message.user.username} <${message.user.email}>`
      : `${message.name ?? "Unknown"} <${message.email ?? "no e-mail"}>`;

  return (
    <>
      <h1>Messages</h1>
      <div className="field search">
        <label htmlFor="message-status">Show</label>
        <select
          id="message-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as MessageStatus | "")
          }
        >
          <option value="">Inbox (unread and read)</option>
          {(Object.keys(STATUS_LABELS) as MessageStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      {messages.isPending && <p role="status">Loading messages…</p>}
      {messages.isError && (
        <p className="alert alert-error" role="alert">
          {messages.error.message}
        </p>
      )}
      {messages.data && visible.length === 0 && (
        <p className="empty">No messages here.</p>
      )}
      {visible.length > 0 && (
        <ul className="message-list">
          {visible.map((message) => (
            <li
              key={message.id}
              className={`card message message-${message.status.toLowerCase()}`}
              data-testid="message"
            >
              <article
                className="card-body"
                aria-labelledby={`message-${message.id}`}
              >
                <div className="message-header">
                  <h2 id={`message-${message.id}`}>{message.subject}</h2>
                  <span
                    className={`badge badge-message-${message.status.toLowerCase()}`}
                  >
                    {STATUS_LABELS[message.status]}
                  </span>
                </div>
                <p className="meta">
                  From {from(message)} · {formatDate(message.createdAt)}
                </p>
                <p className="message-content">{message.content}</p>
                <div className="row-actions">
                  {message.status === "UNREAD" && (
                    <button
                      type="button"
                      className="button button-small"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({ id: message.id, status: "READ" })
                      }
                    >
                      Mark as read
                    </button>
                  )}
                  {message.status !== "ARCHIVED" && (
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      disabled={update.isPending}
                      onClick={() =>
                        update.mutate({ id: message.id, status: "ARCHIVED" })
                      }
                    >
                      Archive
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
