import { apiClient } from './client';
import type { CopilotRequest, CopilotResponse } from '@/types/incidents';

export const memoryApi = {
    /** Get Hindsight memory for an incident */
    getIncidentMemory: (incidentNumber: string) =>
        apiClient.get<{
            incident_id: string;
            memory_status: string;
            memories: Record<string, unknown>[];
            raw_count: number;
        }>(`/api/incidents/${incidentNumber}/memory`),

    /** Post a copilot question */
    askCopilot: (payload: CopilotRequest) =>
        apiClient.post<CopilotResponse>('/api/copilot', payload),
};
