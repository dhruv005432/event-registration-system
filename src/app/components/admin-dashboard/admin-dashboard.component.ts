import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EventRegistrationService, Registration, Event } from '../../services/event-registration.service';
import { AuthService } from '../../services/auth.service';

export interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  activeUsers: number;
  pendingRegistrations: number;
  confirmedRegistrations: number;
  cancelledRegistrations: number;
  upcomingEvents: number;
  completedEvents: number;
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'event' | 'payment' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'warning' | 'error';
  userId?: string;
  eventId?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  permission: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  
  // Dashboard Data
  dashboardStats: DashboardStats = {
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingRegistrations: 0,
    confirmedRegistrations: 0,
    cancelledRegistrations: 0,
    upcomingEvents: 0,
    completedEvents: 0
  };

  recentActivities: RecentActivity[] = [];
  quickActions: QuickAction[] = [];
  
  // Chart Data
  registrationChartData: ChartData = {
    labels: [],
    datasets: []
  };
  
  revenueChartData: ChartData = {
    labels: [],
    datasets: []
  };

  // UI State
  loading = true;
  error: string = '';
  selectedTimeRange: 'week' | 'month' | 'quarter' | 'year' = 'month';
  showNotifications = false;
  notifications: any[] = [];
  
  // Form for quick actions
  quickActionForm: FormGroup;
  
  // Data Tables
  recentRegistrations: Registration[] = [];
  upcomingEvents: Event[] = [];
  topEvents: any[] = [];
  
  // User Management
  currentUser: any = null;
  userRole: string = '';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private eventService: EventRegistrationService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.quickActionForm = this.fb.group({
      actionType: [''],
      actionData: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.initializeQuickActions();
    this.loadDashboardData();
    this.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCurrentUser(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.userRole = user?.role || 'user';
      })
    );
  }

  initializeQuickActions(): void {
    this.quickActions = [
      {
        id: 'create-event',
        title: 'Create Event',
        description: 'Add new event to the system',
        icon: 'calendar-plus',
        route: '/admin/events/create',
        color: 'bg-blue-600',
        permission: 'admin'
      },
      {
        id: 'manage-users',
        title: 'Manage Users',
        description: 'View and manage user accounts',
        icon: 'users',
        route: '/admin/users',
        color: 'bg-green-600',
        permission: 'admin'
      },
      {
        id: 'view-reports',
        title: 'View Reports',
        description: 'Generate and view analytics reports',
        icon: 'chart-bar',
        route: '/admin/reports',
        color: 'bg-purple-600',
        permission: 'admin'
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Configure system preferences',
        icon: 'cog',
        route: '/admin/settings',
        color: 'bg-gray-600',
        permission: 'admin'
      },
      {
        id: 'manage-events',
        title: 'Manage Events',
        description: 'View and edit existing events',
        icon: 'calendar',
        route: '/manager/events',
        color: 'bg-orange-600',
        permission: 'manager'
      },
      {
        id: 'view-registrations',
        title: 'Registrations',
        description: 'Manage event registrations',
        icon: 'list',
        route: '/manager/registrations',
        color: 'bg-indigo-600',
        permission: 'manager'
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'View performance analytics',
        icon: 'trending-up',
        route: '/manager/analytics',
        color: 'bg-teal-600',
        permission: 'manager'
      }
    ];
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load all dashboard data in parallel
    this.subscriptions.add(
      this.eventService.getEvents().subscribe(events => {
        this.processEventData(events);
      })
    );

    this.subscriptions.add(
      this.eventService.getRegistrations().subscribe(registrations => {
        this.processRegistrationData(registrations);
      })
    );

    // Simulate API calls for comprehensive data
    setTimeout(() => {
      this.loadMockData();
      this.generateChartData();
      this.generateRecentActivities();
      this.loading = false;
    }, 1500);
  }

  loadMockData(): void {
    // Mock comprehensive dashboard data
    this.dashboardStats = {
      totalEvents: 12,
      totalRegistrations: 487,
      totalRevenue: 48750,
      activeUsers: 234,
      pendingRegistrations: 23,
      confirmedRegistrations: 412,
      cancelledRegistrations: 52,
      upcomingEvents: 5,
      completedEvents: 7
    };

    this.topEvents = [
      { name: 'Angular Workshop', registrations: 89, revenue: 8910, growth: '+12%' },
      { name: 'Web Development Seminar', registrations: 76, revenue: 7600, growth: '+8%' },
      { name: 'Tech Conference 2024', registrations: 145, revenue: 14500, growth: '+25%' },
      { name: 'React Masterclass', registrations: 67, revenue: 6700, growth: '+5%' },
      { name: 'Node.js Workshop', registrations: 54, revenue: 5400, growth: '+3%' }
    ];

    this.notifications = [
      { id: 1, type: 'success', message: 'New user registration: John Doe', time: '2 minutes ago' },
      { id: 2, type: 'warning', message: 'Event "Angular Workshop" approaching capacity', time: '15 minutes ago' },
      { id: 3, type: 'info', message: 'System backup completed successfully', time: '1 hour ago' },
      { id: 4, type: 'error', message: 'Payment gateway timeout detected', time: '2 hours ago' }
    ];
  }

  processEventData(events: Event[]): void {
    this.upcomingEvents = events.filter(event => 
      new Date(event.date) > new Date()
    ).slice(0, 5);
  }

  processRegistrationData(registrations: Registration[]): void {
    this.recentRegistrations = registrations
      .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
      .slice(0, 10);
  }

  generateChartData(): void {
    // Registration Chart Data
    this.registrationChartData = {
      labels: this.generateDateLabels(),
      datasets: [{
        label: 'Registrations',
        data: [45, 52, 38, 65, 72, 58, 89, 95, 76, 82, 91, 88],
        backgroundColor: '#6387F7',
        borderColor: '#6387F7'
      }]
    };

    // Revenue Chart Data
    this.revenueChartData = {
      labels: this.generateDateLabels(),
      datasets: [{
        label: 'Revenue ($)',
        data: [4500, 5200, 3800, 6500, 7200, 5800, 8900, 9500, 7600, 8200, 9100, 8800],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)'
      }]
    };
  }

  generateDateLabels(): string[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1);
  }

  generateRecentActivities(): void {
    this.recentActivities = [
      {
        id: '1',
        type: 'registration',
        title: 'New Registration',
        description: 'John Doe registered for Angular Workshop',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'success',
        userId: 'user-123',
        eventId: 'event-1'
      },
      {
        id: '2',
        type: 'event',
        title: 'Event Created',
        description: 'New event "React Masterclass" created',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'success',
        eventId: 'event-2'
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Received',
        description: 'Payment of $299 received for Web Development Seminar',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'success',
        userId: 'user-456'
      },
      {
        id: '4',
        type: 'user',
        title: 'New User',
        description: 'New user Jane Smith registered on platform',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'success',
        userId: 'user-789'
      },
      {
        id: '5',
        type: 'registration',
        title: 'Registration Cancelled',
        description: 'Registration cancelled for Tech Conference',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'warning',
        userId: 'user-321',
        eventId: 'event-3'
      }
    ];
  }

  initializeSubscriptions(): void {
    // Listen for real-time updates
    // Future: Add real-time subscription when service supports it
  }

  // Action Methods
  onQuickAction(action: QuickAction): void {
    if (this.hasPermission(action.permission)) {
      this.router.navigate([action.route]);
    } else {
      this.error = 'You do not have permission to perform this action';
    }
  }

  onTimeRangeChange(timeRange: string): void {
    this.selectedTimeRange = timeRange as any;
    this.generateChartData();
  }

  onActivityClick(activity: RecentActivity): void {
    switch (activity.type) {
      case 'registration':
        if (activity.eventId) {
          this.router.navigate(['/edit', activity.eventId]);
        }
        break;
      case 'event':
        if (activity.eventId) {
          this.router.navigate(['/events', activity.eventId]);
        }
        break;
      case 'user':
        if (activity.userId) {
          this.router.navigate(['/admin/users', activity.userId]);
        }
        break;
    }
  }

  // Utility Methods
  hasPermission(permission: string): boolean {
    const permissions = {
      'admin': ['admin'],
      'manager': ['admin', 'manager'],
      'user': ['admin', 'manager', 'user']
    };
    
    return permissions[this.userRole as keyof typeof permissions]?.includes(permission) || false;
  }

  getStatsDisplay(): Array<{label: string, value: string | number, icon: string, color: string, change?: number}> {
    return [
      { label: 'Total Events', value: this.dashboardStats.totalEvents, icon: 'calendar', color: '#6387F7' },
      { label: 'Total Registrations', value: this.dashboardStats.totalRegistrations, icon: 'users', color: '#22C55E' },
      { label: 'Total Revenue', value: this.formatCurrency(this.dashboardStats.totalRevenue), icon: 'dollar-sign', color: '#10B981' },
      { label: 'Active Users', value: this.dashboardStats.activeUsers, icon: 'user-check', color: '#F59E0B' },
      { label: 'Pending Registrations', value: this.dashboardStats.pendingRegistrations, icon: 'clock', color: '#F59E0B' },
      { label: 'Confirmed Registrations', value: this.dashboardStats.confirmedRegistrations, icon: 'check-circle', color: '#10B981', change: 12 },
      { label: 'Cancelled Registrations', value: this.dashboardStats.cancelledRegistrations, icon: 'times-circle', color: '#EF4444', change: -5 },
      { label: 'Upcoming Events', value: this.dashboardStats.upcomingEvents, icon: 'calendar-alt', color: '#8B5CF6' },
      { label: 'Completed Events', value: this.dashboardStats.completedEvents, icon: 'calendar-check', color: '#10B981' }
    ];
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      case 'error': return 'fa-times-circle';
      default: return 'fa-bell';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }

  getActivityIcon(activity: RecentActivity): string {
    switch (activity.type) {
      case 'registration': return 'user-plus';
      case 'event': return 'calendar-plus';
      case 'payment': return 'dollar-sign';
      case 'user': return 'user';
      default: return 'info';
    }
  }

  getActivityColor(activity: RecentActivity): string {
    switch (activity.status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  // Navigation Methods
  navigateToRegistrations(): void {
    this.router.navigate(['/registrations']);
  }

  navigateToEvents(): void {
    this.router.navigate(['/events']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  navigateToReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  // Export Methods
  exportData(type: 'pdf' | 'excel'): void {
    // Simulate data export
    const data = {
      stats: this.dashboardStats,
      activities: this.recentActivities,
      topEvents: this.topEvents
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'csv' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  refreshDashboard(): void {
    this.loading = true;
    this.loadDashboardData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}