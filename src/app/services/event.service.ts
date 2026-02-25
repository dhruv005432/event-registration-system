import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  currency: string;
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  requiresApproval: boolean;
  tags: string[];
  createdBy: string;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxAttendees: number;
  price: number;
  currency: string;
  imageUrl?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  tags: string[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
}

export interface EventFilters {
  search?: string;
  category?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'startDate' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface EventResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventStatistics {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  upcomingEvents: number;
  pastEvents: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly API_URL = 'http://localhost:3000/api/events';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // CRUD Operations
  getEvents(filters?: EventFilters): Observable<EventResponse> {
    const params = this.buildQueryParams(filters);
    return this.http.get<EventResponse>(this.API_URL, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createEvent(eventData: CreateEventRequest): Observable<Event> {
    return this.http.post<Event>(this.API_URL, eventData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateEvent(id: string, eventData: UpdateEventRequest): Observable<Event> {
    return this.http.put<Event>(`${this.API_URL}/${id}`, eventData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteEvent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Bulk Operations
  bulkDeleteEvents(eventIds: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-delete`, { eventIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkUpdateEvents(eventIds: string[], updateData: UpdateEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-update`, { eventIds, updateData }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Event Status Management
  publishEvent(id: string): Observable<Event> {
    return this.http.patch<Event>(`${this.API_URL}/${id}/publish`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  cancelEvent(id: string, reason?: string): Observable<Event> {
    return this.http.patch<Event>(`${this.API_URL}/${id}/cancel`, { reason }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  duplicateEvent(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.API_URL}/${id}/duplicate`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Event Analytics
  getEventStatistics(eventId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${eventId}/statistics`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError((error: any) => {
        console.warn('Event statistics API not available:', error);
        // Return mock data for development
        return of({
          totalRegistrations: 150,
          confirmedRegistrations: 120,
          pendingRegistrations: 25,
          cancelledRegistrations: 5,
          waitlistedRegistrations: 8,
          totalRevenue: 15000,
          demographics: {
            ageGroups: { '18-25': 30, '26-35': 45, '36-45': 50, '46+': 25 },
            genders: { male: 80, female: 70 },
            locations: { 'New York': 60, 'California': 45, 'Texas': 30, 'Other': 15 }
          },
          registrationTimeline: []
        });
      })
    );
  }

  getOverallStatistics(): Observable<EventStatistics> {
    return this.http.get<EventStatistics>(`${this.API_URL}/statistics`, { 
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError((error: any) => {
        console.warn('Overall statistics API not available:', error);
        // Return mock data for development
        return of({
          totalEvents: 25,
          publishedEvents: 18,
          draftEvents: 5,
          cancelledEvents: 2,
          pastEvents: 8,
          upcomingEvents: 12,
          totalAttendees: 1250,
          totalRevenue: 75000
        } as EventStatistics);
      })
    );
  }

  // Event Categories
  getCategories(): Observable<{ name: string; count: number }[]> {
    return this.http.get<{ name: string; count: number }[]>(`${this.API_URL}/categories`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Event Search and Filtering
  searchEvents(query: string, filters?: EventFilters): Observable<EventResponse> {
    const searchFilters = { ...filters, search: query };
    const params = this.buildQueryParams(searchFilters);
    return this.http.get<EventResponse>(`${this.API_URL}/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getFeaturedEvents(limit: number = 10): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.API_URL}/featured`, { 
      params: { limit },
      headers: this.authService.getAuthHeaders()
    });
  }

  getUpcomingEvents(limit: number = 10): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.API_URL}/upcoming`, { 
      params: { limit },
      headers: this.authService.getAuthHeaders()
    });
  }

  // Event Registration Management
  getEventRegistrations(eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/${eventId}/registrations`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  exportEventData(eventId: string, format: 'csv' | 'excel' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${eventId}/export`, {
      params: { format },
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Private helper methods
  private buildQueryParams(filters?: EventFilters): any {
    if (!filters) return {};
    
    const params: any = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof EventFilters];
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
