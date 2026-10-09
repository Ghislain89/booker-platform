import { AuthUser, Message, MessageStatus } from "../types";
import { messagesService } from "../services/messages";

class MessagesController {
  getAll(): Promise<Message[]> {
    return messagesService.getAll();
  }

  getUserMessages(userId: string): Promise<Message[]> {
    return messagesService.getUserMessages(userId);
  }

  getById(id: string, requester: AuthUser): Promise<Message> {
    return messagesService.getById(id, requester);
  }

  create(message: { subject: string; content: string }, userId: string): Promise<Message> {
    return messagesService.create(message, userId);
  }

  updateStatus(id: string, status: MessageStatus): Promise<Message> {
    return messagesService.updateStatus(id, status);
  }

  delete(id: string): Promise<void> {
    return messagesService.delete(id);
  }
}

export const messagesController = new MessagesController();
