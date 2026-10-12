import { Message as DbMessage } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { forbidden, notFound } from "../lib/http";
import { isAdmin } from "../middleware/auth";
import { AuthUser, Message, MessageStatus, UserSummary } from "../types";
import { publish } from "../lib/events";

const include = { user: { select: { id: true, username: true, email: true } } } as const;

const toMessage = (message: DbMessage & { user: UserSummary | null }): Message => ({
  ...message,
  status: message.status as MessageStatus,
});

class MessagesService {
  async getAll(): Promise<Message[]> {
    const messages = await prisma.message.findMany({ include, orderBy: { createdAt: "desc" } });
    return messages.map(toMessage);
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: "desc" },
    });
    return messages.map(toMessage);
  }

  async getById(id: string, requester: AuthUser): Promise<Message> {
    const message = await prisma.message.findUnique({ where: { id }, include });
    if (!message) throw notFound("Message not found");
    if (message.userId !== requester.userId && !isAdmin(requester)) throw forbidden();
    return toMessage(message);
  }

  async create(input: { subject: string; content: string }, userId: string): Promise<Message> {
    const message = await prisma.message.create({
      data: { ...input, userId, status: "UNREAD" },
      include,
    });
    return this.announce(toMessage(message));
  }

  /** Contact form: a message from a guest without an account. */
  async createPublic(input: { name: string; email: string; subject: string; content: string }): Promise<Message> {
    const message = await prisma.message.create({ data: { ...input, status: "UNREAD" }, include });
    return this.announce(toMessage(message));
  }

  private announce(message: Message) {
    publish("message.created", {
      id: message.id,
      subject: message.subject,
      from: message.user?.username ?? message.name,
    });
    return message;
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message> {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) throw notFound("Message not found");
    const message = await prisma.message.update({ where: { id }, data: { status }, include });
    return toMessage(message);
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) throw notFound("Message not found");
    await prisma.message.delete({ where: { id } });
  }
}

export const messagesService = new MessagesService();
