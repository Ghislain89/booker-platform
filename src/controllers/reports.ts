import { Report } from '../types';
import { reportsService } from '../services/reports';

class ReportsController {
  async getAll(): Promise<Report[]> {
    return reportsService.getAll();
  }

  async getById(id: string): Promise<Report | null> {
    return reportsService.getById(id);
  }

  async generateReport(type: Report['type'], period: { start: string; end: string }): Promise<Report> {
    return reportsService.generateReport(type, period);
  }

  async delete(id: string): Promise<boolean> {
    return reportsService.delete(id);
  }
}

export const reportsController = new ReportsController(); 