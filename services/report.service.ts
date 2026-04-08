import { api } from './api';
import type { ReportTypeDto } from '@/types/resource.types';

export const reportService = {
  getReportTypes: () =>
    api.get<ReportTypeDto[]>('/report-types', false),

  createReport: (ressourceId: string, reportTypeId: string) =>
    api.post<void>('/reports', { ressource_id: ressourceId, report_type_id: reportTypeId }, true),
};
