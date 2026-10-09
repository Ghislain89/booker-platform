import { Message, MessageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

class MessagesService {
  async getAll(): Promise<Message[]> {
    return prisma.message.findMany({
      include: {
        user: true
      }
    });
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { userId },
      include: {
        user: true
      }
    });
  }

  async getById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
  }

  async create(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return prisma.message.create({
      data: {
        ...message,
        status: MessageStatus.UNREAD
      },
      include: {
        user: true
      }
    });
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message | null> {
    return prisma.message.update({
      where: { id },
      data: { status },
      include: {
        user: true
      }
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.message.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const messagesService = new MessagesService(); 