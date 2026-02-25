import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Event {
  id: string;
  name: string;
  category: 'workshop' | 'seminar' | 'conference';
  date: string;
  time: string;
  venue: string;
  description: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  registrationDeadline?: string;
  organizer?: string;
  location?: string;
  isOnline?: boolean;
}

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  eventName: string;
  eventCategory: 'workshop' | 'seminar' | 'conference';
  eventDate: string;
  timeSlot: string;
  venue: string;
  numberOfSeats: number;
  paymentMode: 'online' | 'offline';
  specialRequirements: string;
  message: string;
  registrationDate: string;
  paymentStatus: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
}

@Injectable({
  providedIn: 'root'
})
export class EventRegistrationService {
  private registrations: Registration[] = [];
  private events: Event[] = [
    {
      id: '1',
      name: 'Angular Workshop',
      category: 'workshop',
      date: '2024-03-15',
      time: '10:00 AM',
      venue: 'Conference Hall A',
      description: 'Learn advanced Angular concepts',
      availableSeats: 50,
      totalSeats: 100,
      price: 299,
      registrationDeadline: '2024-03-14',
      organizer: 'Tech Training Inc.',
      location: 'San Francisco, CA',
      isOnline: false
    },
    {
      id: '2',
      name: 'Web Development Seminar',
      category: 'seminar',
      date: '2024-03-20',
      time: '2:00 PM',
      venue: 'Auditorium B',
      description: 'Modern web development trends',
      availableSeats: 100,
      totalSeats: 150,
      price: 199,
      registrationDeadline: '2024-03-19',
      organizer: 'Web Masters Academy',
      location: 'New York, NY',
      isOnline: false
    },
    {
      id: '3',
      name: 'Tech Conference 2024',
      category: 'conference',
      date: '2024-04-01',
      time: '9:00 AM',
      venue: 'Main Convention Center',
      description: 'Annual technology conference',
      availableSeats: 200,
      totalSeats: 500,
      price: 599,
      registrationDeadline: '2024-03-30',
      organizer: 'Tech Events Ltd.',
      location: 'Virtual Event',
      isOnline: true
    }
  ];

  private registrationsSubject = new BehaviorSubject<Registration[]>([]);
  private eventsSubject = new BehaviorSubject<Event[]>(this.events);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadFromLocalStorage();
  }

  // Registration Management
  getRegistrations(): Observable<Registration[]> {
    return this.registrationsSubject.asObservable();
  }

  addRegistration(registration: Omit<Registration, 'id' | 'registrationDate' | 'paymentStatus'>): Registration {
    const newRegistration: Registration = {
      ...registration,
      id: this.generateId(),
      registrationDate: new Date().toISOString(),
      paymentStatus: 'pending'
    };
    
    this.registrations.push(newRegistration);
    this.saveToLocalStorage();
    this.registrationsSubject.next([...this.registrations]);
    
    return newRegistration;
  }

  updateRegistration(id: string, updates: Partial<Registration>): Registration | null {
    const index = this.registrations.findIndex(reg => reg.id === id);
    if (index !== -1) {
      this.registrations[index] = { ...this.registrations[index], ...updates };
      this.saveToLocalStorage();
      this.registrationsSubject.next([...this.registrations]);
      return this.registrations[index];
    }
    return null;
  }

  deleteRegistration(id: string): boolean {
    const index = this.registrations.findIndex(reg => reg.id === id);
    if (index !== -1) {
      this.registrations.splice(index, 1);
      this.saveToLocalStorage();
      this.registrationsSubject.next([...this.registrations]);
      return true;
    }
    return false;
  }

  getRegistrationById(id: string): Registration | null {
    return this.registrations.find(reg => reg.id === id) || null;
  }

  // Event Management
  getEvents(): Observable<Event[]> {
    return this.eventsSubject.asObservable();
  }

  getEventById(id: string): Event | null {
    return this.events.find(event => event.id === id) || null;
  }

  // Search and Filter
  searchRegistrations(query: string): Registration[] {
    return this.registrations.filter(reg =>
      reg.fullName.toLowerCase().includes(query.toLowerCase()) ||
      reg.email.toLowerCase().includes(query.toLowerCase()) ||
      reg.eventName.toLowerCase().includes(query.toLowerCase())
    );
  }

  filterRegistrationsByEvent(eventName: string): Registration[] {
    return this.registrations.filter(reg => reg.eventName === eventName);
  }

  filterRegistrationsByDate(date: string): Registration[] {
    return this.registrations.filter(reg => reg.eventDate === date);
  }

  // Utility Methods
  private generateId(): string {
    return 'REG' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private saveToLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('eventRegistrations', JSON.stringify(this.registrations));
    }
  }

  private loadFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('eventRegistrations');
      if (saved) {
        this.registrations = JSON.parse(saved);
        this.registrationsSubject.next([...this.registrations]);
      }
    }
  }

  // Statistics
  getTotalRegistrations(): number {
    return this.registrations.length;
  }

  getRegistrationsByStatus(status: 'confirmed' | 'pending' | 'cancelled' | 'refunded'): number {
    return this.registrations.filter(reg => reg.paymentStatus === status).length;
  }

  getUpcomingEvents(): Event[] {
    const today = new Date().toISOString().split('T')[0];
    return this.events.filter(event => event.date >= today);
  }
}
