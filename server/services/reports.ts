import { Report as DbReport } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { notFound } from "../lib/http";
import { Report, ReportType } from "../types";

const parse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const toReport = (report: DbReport): Report => ({
  ...report,
  type: report.type as ReportType,
  data: parse(report.data, {}),
  period: parse(report.period, { start: "", end: "" }),
});

// In a real application this would aggregate bookings; the workshop uses fixed figures.
const mockData: Record<ReportType, Record<string, unknown>> = {
  OCCUPANCY: {
    totalRooms: 100,
    occupiedRooms: 75,
    occupancyRate: 0.75,
    averageStayDuration: 3.5,
  },
  REVENUE: {
    totalRevenue: 50000,
    averageRevenuePerRoom: 500,
    revenueByRoomType: { standard: 30000, deluxe: 15000, suite: 5000 },
  },
  CUSTOMER_SATISFACTION: {
    averageRating: 4.5,
    totalReviews: 150,
    ratingDistribution: { "5": 100, "4": 30, "3": 15, "2": 3, "1": 2 },
  },
};

class ReportsService {
  async getAll(): Promise<Report[]> {
    const reports = await prisma.report.findMany({ orderBy: { generatedAt: "desc" } });
    return reports.map(toReport);
  }

  async getById(id: string): Promise<Report> {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) throw notFound("Report not found");
    return toReport(report);
  }

  async generateReport(type: ReportType, period: { start: string; end: string }): Promise<Report> {
    const report = await prisma.report.create({
      data: {
        type,
        data: JSON.stringify(mockData[type]),
        period: JSON.stringify(period),
      },
    });
    return toReport(report);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await prisma.report.delete({ where: { id } });
  }
}

export const reportsService = new ReportsService();
