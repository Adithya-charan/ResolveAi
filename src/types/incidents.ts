/**
 * TypeScript types matching FastAPI Pydantic schemas.
 */

export interface ServiceRead {
    id: string;
    name: string;
    description?: string;
}

export interface AttemptRead {
    id: string;
    description: string;
    outcome: 'failed' | 'partial' | 'success';
    detail?: string;
    timestamp: string;
}

export interface ResolutionRead {
    id: string;
    description: string;
    outcome: 'succeeded' | 'failed' | 'partial';
    timestamp: string;
}

export interface RemediationRead {
    id: string;
    action: string;
    detail?: string;
    status: 'pending' | 'completed' | 'verified';
    implemented_at?: string;
}

export interface VerificationEventRead {
    id: string;
    label: string;
    description?: string;
    status: 'healthy' | 'degraded' | 'failed' | 'pending';
    timestamp: string;
}

export interface IncidentListItem {
    id: string;
    incident_number: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    opened_at: string;
    service?: ServiceRead;
}

export interface IncidentDetail extends IncidentListItem {
    description?: string;
    root_cause?: string;
    resolved_at?: string;
    attempts: AttemptRead[];
    resolutions: ResolutionRead[];
    remediations: RemediationRead[];
    verification_events: VerificationEventRead[];
}

export interface IncidentAnalyzeRequest {
    incident_number: string;
    title: string;
    description?: string;
    severity: string;
    service_name: string;
}

export interface HistoricalMatch {
    incident_number: string;
    title: string;
    service: string;
    similarity_evidence: string;
    root_cause?: string;
    resolution_summary?: string;
    attempts: Array<{ description: string; outcome: string; detail?: string }>;
    remediation?: string;
    verification_summary?: string;
}

export interface IncidentAnalysisResponse {
    incident_number: string;
    service: string;
    severity: string;
    title: string;
    symptoms: string[];
    historical_matches: HistoricalMatch[];
    root_cause_hypotheses: string[];
    recommended_next_action: string;
    recurrence_status: string;
    memory_status: 'available' | 'unavailable' | 'degraded';
    analysis_status: 'complete' | 'unavailable' | 'partial' | 'parse_error';
    analysis_reasoning?: string;
    raw_memory_count: number;
}

export interface CopilotRequest {
    incident_number: string;
    question: string;
    context?: Record<string, unknown>;
}

export interface CopilotResponse {
    answer: string;
    sources: string[];
    memory_used: boolean;
    analysis_status: string;
}
