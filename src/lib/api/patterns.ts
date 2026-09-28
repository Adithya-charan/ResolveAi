import { apiClient } from './client';

export interface Pattern {
    service: string;
    root_cause: string;
    count: number;
    occurrences: Array<{
        incident_number: string;
        severity: string;
        status: string;
        opened_at: string | null;
    }>;
}

export const patternsApi = {
    list: () => apiClient.get<Pattern[]>('/api/patterns'),
};
