import { Report, ReportType } from "../types";
import { reportsService } from "../services/reports";

class ReportsController {
  getAll(): Promise<Report[]> {
    return reportsService.getAll();
  }

  getById(id: string): Promise<Report> {
    return reportsService.getById(id);
  }

  generateReport(type: ReportType, period: { start: string; end: string }): Promise<Report> {
    return reportsService.generateReport(type, period);
  }

  delete(id: string): Promise<void> {
    return reportsService.delete(id);
  }
}

export const reportsController = new ReportsController();
