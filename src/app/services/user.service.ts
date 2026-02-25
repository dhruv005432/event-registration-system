import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
  companyId?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone?: string;
  language: string;
  preferences: UserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'user';
  companyId?: string;
  department?: string;
  jobTitle?: string;
  password: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  preferences?: Partial<UserPreferences>;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  companyId?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'fullName' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersByRole: {
    admin: number;
    manager: number;
    user: number;
  };
  usersByDepartment: { [key: string]: number };
  recentRegistrations: number;
  loginActivity: any[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // CRUD Operations
  getUsers(filters?: UserFilters): Observable<UserResponse> {
    const params = this.buildQueryParams(filters);
    return this.http.get<UserResponse>(this.API_URL, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.API_URL, userData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, userData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Bulk Operations
  bulkCreateUsers(usersData: CreateUserRequest[]): Observable<User[]> {
    return this.http.post<User[]>(`${this.API_URL}/bulk`, { users: usersData }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkUpdateUsers(userIds: string[], updateData: UpdateUserRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-update`, { userIds, updateData }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  bulkDeleteUsers(userIds: string[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/bulk-delete`, { userIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // User Status Management
  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/activate`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deactivateUser(id: string, reason?: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/deactivate`, { reason }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // User Role Management
  changeUserRole(id: string, role: 'admin' | 'manager' | 'user'): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/role`, { role }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Profile Management
  updateProfile(userData: Partial<UpdateUserRequest>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, userData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post<{ avatarUrl: string }>(`${this.API_URL}/avatar`, formData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updatePreferences(preferences: Partial<UserPreferences>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/preferences`, { preferences }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Password Management
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/request-password-reset`, request);
  }

  confirmPasswordReset(confirm: PasswordResetConfirm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/confirm-password-reset`, confirm);
  }

  // Email Verification
  requestEmailVerification(request: EmailVerificationRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/request-email-verification`, request);
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/verify-email`, { token });
  }

  // User Analytics and Statistics
  getUserStatistics(filters?: UserFilters): Observable<UserStatistics> {
    const params = this.buildQueryParams(filters);
    return this.http.get<UserStatistics>(`${this.API_URL}/statistics`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getUserActivity(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    activity?: string;
    page?: number;
    limit?: number;
  }): Observable<{
    activities: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = this.buildQueryParams(filters);
    return this.http.get<any>(`${this.API_URL}/${userId}/activity`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Search and Filtering
  searchUsers(query: string, filters?: UserFilters): Observable<UserResponse> {
    const searchFilters = { ...filters, search: query };
    const params = this.buildQueryParams(searchFilters);
    return this.http.get<UserResponse>(`${this.API_URL}/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/role/${role}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getUsersByDepartment(department: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/department/${department}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Export Operations
  exportUsers(filters?: UserFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    const params = this.buildQueryParams({ ...filters, format });
    return this.http.get(`${this.API_URL}/export`, {
      params,
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Session Management
  getUserSessions(userId: string): Observable<{
    sessions: any[];
    activeSessions: number;
  }> {
    return this.http.get<any>(`${this.API_URL}/${userId}/sessions`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  revokeUserSession(userId: string, sessionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${userId}/sessions/${sessionId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  revokeAllUserSessions(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${userId}/sessions`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Private helper methods
  private buildQueryParams(filters?: any): any {
    if (!filters) return {};
    
    const params: any = {};
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
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
