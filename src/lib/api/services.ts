import { apiClient } from './client';

export interface ServiceRecord {
    id: string;
    name: string;
    description?: string;
}

export const servicesApi = {
    list: () => apiClient.get<ServiceRecord[]>('/api/services'),
};
