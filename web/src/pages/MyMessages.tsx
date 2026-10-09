import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
import type { Message } from "../api/types";
import { formatDate } from "../lib/format";
import { useTitle } from "../lib/useTitle";

const STATUS: Record<Message["status"], string> = {
  UNREAD: "Sent",
  READ: "Read by the hotel",
  ARCHIVED: "Handled",
};

export function MyMessages() {
  useTitle("My messages");
  const messages = useQuery({
    queryKey: ["private", "messages", "mine"],
    queryFn: () =>
      api<DataResponse<Message[]>>("/messages/my-messages").then(
        (response) => response.data,
      ),
  });

  return (
    <>
      <h1>My messages</h1>
      <p>
        <Link to="/contact">Send a new message</Link>
      </p>
      {messages.isPending && <p role="status">Loading messages…</p>}
      {messages.isError && (
        <p className="alert alert-error" role="alert">
          {messages.error.message}
        </p>
      )}
      {messages.data && messages.data.length === 0 && (
        <p className="empty">You have not sent any messages yet.</p>
      )}
      {messages.data && messages.data.length > 0 && (
        <ul className="message-list">
          {messages.data.map((message) => (
            <li key={message.id} className="card" data-testid="message">
              <article
                className="card-body"
                aria-labelledby={`message-${message.id}`}
              >
                <h2 id={`message-${message.id}`}>{message.subject}</h2>
                <p className="meta">
                  {formatDate(message.createdAt)} · {STATUS[message.status]}
                </p>
                <p className="message-content">{message.content}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
