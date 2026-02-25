import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  jobTitle?: string;
  dietaryRestrictions?: string;
  specialRequirements?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: 'credit_card' | 'paypal' | 'bank_transfer' | 'crypto';
  amount: number;
  currency: string;
  transactionId?: string;
  qrCode?: string;
  ticketNumber: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  checkedInBy?: string;
  registeredAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    title: string;
    startDate: Date;
    location: string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateRegistrationRequest {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  jobTitle?: string;
  dietaryRestrictions?: string;
  specialRequirements?: string;
  paymentMethod?: 'credit_card' | 'paypal' | 'bank_transfer' | 'crypto';
}

export interface UpdateRegistrationRequest extends Partial<CreateRegistrationRequest> {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
  checkedIn?: boolean;
}

export interface RegistrationFilters {
  search?: string;
  eventId?: string;
  userId?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
  checkedIn?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'registeredAt' | 'firstName' | 'lastName' | 'email' | 'status';
  sortOrder?: 'asc' | 'desc';
  format?: 'csv' | 'excel' | 'pdf';
}

export interface RegistrationResponse {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RegistrationStatistics {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  waitlistedRegistrations: number;
  totalRevenue: number;
  averageRegistrationValue: number;
  checkInRate: number;
  paymentSuccessRate: number;
}

export interface RefundRequest {
  registrationId: string;
  reason: string;
  amount?: number;
  fullRefund: boolean;
}

export interface BulkRegistrationRequest {
  eventId: string;
  registrations: CreateRegistrationRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly API_URL = 'http://localhost:3000/api/registrations';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // CRUD Operations
  getRegistrations(filters?: RegistrationFilters): Observable<RegistrationResponse> {
    const params = this.buildQueryParams(filters);
    return this.http.get<RegistrationResponse>(this.API_URL, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getRegistrationById(id: string): Observable<Registration> {
    return this.http.get<Registration>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createRegistration(registrationData: CreateRegistrationRequest): Observable<Registration> {
    return this.http.post<Registration>(this.API_URL, registrationData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateRegistration(id: string, registrationData: UpdateRegistrationRequest): Observable<Registration> {
    return this.http.put<Registration>(`${this.API_URL}/${id}`, registrationData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteRegistration(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Bulk Operations
  bulkCreateRegistrations(bulkData: BulkRegistrationRequest): Observable<Registration[]> {
    return this.http.post<Registration[]>(`${this.API_URL}/bulk`, bulkData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkUpdateRegistrations(registrationIds: string[], updateData: UpdateRegistrationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-update`, { registrationIds, updateData }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkDeleteRegistrations(registrationIds: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-delete`, { registrationIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Registration Status Management
  confirmRegistration(id: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/confirm`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  cancelRegistration(id: string, reason?: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/cancel`, { reason }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  waitlistRegistration(id: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/waitlist`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Check-in Operations
  checkInRegistration(id: string, checkedInBy?: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/checkin`, { checkedInBy }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkCheckIn(registrationIds: string[], checkedInBy?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-checkin`, { registrationIds, checkedInBy }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  undoCheckIn(id: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/undo-checkin`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Payment Operations
  processPayment(id: string, paymentData: {
    paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'crypto';
    transactionId?: string;
  }): Observable<Registration> {
    return this.http.post<Registration>(`${this.API_URL}/${id}/payment`, paymentData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  requestRefund(refundData: RefundRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/refund`, refundData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  processRefund(id: string, refundData: {
    reason: string;
    amount?: number;
    fullRefund: boolean;
    processedBy: string;
  }): Observable<Registration> {
    return this.http.post<Registration>(`${this.API_URL}/${id}/process-refund`, refundData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Ticket Operations
  generateTicket(id: string): Observable<{ qrCode: string; ticketNumber: string }> {
    return this.http.post<{ qrCode: string; ticketNumber: string }>(`${this.API_URL}/${id}/generate-ticket`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  downloadTicket(id: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/download-ticket`, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  emailTicket(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${id}/email-ticket`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkEmailTickets(registrationIds: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-email-tickets`, { registrationIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Analytics and Reporting
  getRegistrationStatistics(filters?: RegistrationFilters): Observable<RegistrationStatistics> {
    const params = this.buildQueryParams(filters);
    return this.http.get<RegistrationStatistics>(`${this.API_URL}/statistics`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getEventRegistrationStats(eventId: string): Observable<{
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    cancelledRegistrations: number;
    waitlistedRegistrations: number;
    totalRevenue: number;
    demographics: any;
    registrationTimeline: any[];
  }> {
    return this.http.get<any>(`${this.API_URL}/event/${eventId}/statistics`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  exportRegistrations(filters?: RegistrationFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    const params = this.buildQueryParams({ ...filters, format });
    return this.http.get(`${this.API_URL}/export`, {
      params,
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Search and Filtering
  searchRegistrations(query: string, filters?: RegistrationFilters): Observable<RegistrationResponse> {
    const searchFilters = { ...filters, search: query };
    const params = this.buildQueryParams(searchFilters);
    return this.http.get<RegistrationResponse>(`${this.API_URL}/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getMyRegistrations(): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.API_URL}/my-registrations`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Waitlist Management
  getWaitlist(eventId: string): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.API_URL}/waitlist/${eventId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  promoteFromWaitlist(id: string): Observable<Registration> {
    return this.http.patch<Registration>(`${this.API_URL}/${id}/promote`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Private helper methods
  private buildQueryParams(filters?: RegistrationFilters): any {
    if (!filters) return {};
    
    const params: any = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof RegistrationFilters];
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params[key] = value.toISOString();
        } else if (Array.isArray(value)) {
          params[key] = value.join(',');
        } else {
          params[key] = value;
        }
      }
    });
    
    return params;
  }
}
