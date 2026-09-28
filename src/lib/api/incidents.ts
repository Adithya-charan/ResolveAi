import { apiClient } from './client';
import type {
    IncidentListItem,
    IncidentDetail,
    IncidentAnalyzeRequest,
    IncidentAnalysisResponse,
} from '@/types/incidents';

export const incidentsApi = {
    /** List all incidents */
    list: () => apiClient.get<IncidentListItem[]>('/api/incidents'),

    /** Get a single incident by number (e.g. INC-482) */
    get: (incidentNumber: string) =>
        apiClient.get<IncidentDetail>(`/api/incidents/${incidentNumber}`),

    /** Run full incident analysis via Hindsight + LLM pipeline */
    analyze: (payload: IncidentAnalyzeRequest) =>
        apiClient.post<IncidentAnalysisResponse>('/api/incidents/analyze', payload),

    /** Get Hindsight memory for an incident */
    getMemory: (incidentNumber: string) =>
        apiClient.get<MemoryData>(`/api/incidents/${incidentNumber}/memory`),

    /** Get resolution history */
    getResolution: (incidentNumber: string) =>
        apiClient.get<ResolutionData>(`/api/incidents/${incidentNumber}/resolution`),

    /** Get remediation + verification history */
    getRemediation: (incidentNumber: string) =>
        apiClient.get<RemediationData>(`/api/incidents/${incidentNumber}/remediation`),
};

interface MemoryData {
    incident_id: string;
    memory_status: string;
    memories: Record<string, unknown>[];
    raw_count: number;
}

interface ResolutionData {
    incident_number: string;
    resolutions: Array<{ description: string; outcome: string }>;
    attempts: Array<{ description: string; outcome: string; detail?: string }>;
}

interface RemediationData {
    incident_number: string;
    remediations: Array<{ action: string; detail?: string; status: string }>;
    verification_events: Array<{ label: string; status: string; description?: string }>;
}
