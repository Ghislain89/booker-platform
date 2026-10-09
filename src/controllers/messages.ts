import { Message } from '../types';
import { messagesService } from '../services/messages';

class MessagesController {
  async getAll(): Promise<Message[]> {
    return messagesService.getAll();
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return messagesService.getUserMessages(userId);
  }

  async getById(id: string): Promise<Message | null> {
    return messagesService.getById(id);
  }

  async create(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return messagesService.create(message);
  }

  async updateStatus(id: string, status: Message['status']): Promise<Message | null> {
    return messagesService.updateStatus(id, status);
  }

  async delete(id: string): Promise<boolean> {
    return messagesService.delete(id);
  }
}

export const messagesController = new MessagesController(); 