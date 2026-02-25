import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventRegistrationService, Event } from '../../services/event-registration.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  selectedCategory: string = 'all';
  searchTerm: string = '';

  constructor(private eventService: EventRegistrationService) {}

  ngOnInit() {
    this.eventService.getEvents().subscribe(events => {
      this.events = events;
      this.filteredEvents = events;
    });
  }

  filterEvents() {
    this.filteredEvents = this.events.filter(event => {
      const matchesCategory = this.selectedCategory === 'all' || event.category === this.selectedCategory;
      const matchesSearch = event.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  trackByEventId(index: number, event: Event): string {
    return event.id;
  }

  getCategoryIcon(category: string): string {
    switch(category) {
      case 'workshop': return 'fa-tools';
      case 'seminar': return 'fa-chalkboard-teacher';
      case 'conference': return 'fa-users';
      default: return 'fa-calendar';
    }
  }

  getCategoryColor(category: string): string {
    switch(category) {
      case 'workshop': return 'from-blue-500 to-indigo-600';
      case 'seminar': return 'from-purple-500 to-pink-600';
      case 'conference': return 'from-green-500 to-teal-600';
      default: return 'from-gray-500 to-gray-600';
    }
  }
}
