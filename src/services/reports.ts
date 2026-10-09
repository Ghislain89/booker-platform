import { Report, ReportType } from '@prisma/client';
import { prisma } from '../lib/prisma';

class ReportsService {
  async getAll(): Promise<Report[]> {
    return prisma.report.findMany();
  }

  async getById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id }
    });
  }

  async generateReport(type: ReportType, period: { start: string; end: string }): Promise<Report> {
    // In a real application, this would aggregate data from various sources
    // For now, we'll create a mock report
    const mockData = {
      OCCUPANCY: {
        totalRooms: 100,
        occupiedRooms: 75,
        occupancyRate: 0.75,
        averageStayDuration: 3.5
      },
      REVENUE: {
        totalRevenue: 50000,
        averageRevenuePerRoom: 500,
        revenueByRoomType: {
          standard: 30000,
          deluxe: 15000,
          suite: 5000
        }
      },
      CUSTOMER_SATISFACTION: {
        averageRating: 4.5,
        totalReviews: 150,
        ratingDistribution: {
          '5': 100,
          '4': 30,
          '3': 15,
          '2': 3,
          '1': 2
        }
      }
    };

    return prisma.report.create({
      data: {
        type,
        data: JSON.stringify(mockData[type]),
        period: JSON.stringify(period)
      }
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.report.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const reportsService = new ReportsService(); 