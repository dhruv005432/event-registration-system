import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  position: string;
  review: string;
  rating: number;
  avatar: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  avatar: string;
  linkedin?: string;
}

export interface Achievement {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  
  // Statistics for animated counters
  stats = [
    { value: 500, label: 'Events Managed', suffix: '+' },
    { value: 50000, label: 'Registrations', suffix: '+' },
    { value: 20, label: 'Corporate Clients', suffix: '+' },
    { value: 99.9, label: 'Platform Uptime', suffix: '%' }
  ];

  // Core services
  coreServices = [
    {
      icon: 'fas fa-calendar-plus',
      title: 'Event Creation & Scheduling',
      description: 'Create and manage events with intuitive scheduling tools'
    },
    {
      icon: 'fas fa-user-plus',
      title: 'Online Registration System',
      description: 'Seamless registration experience with real-time validation'
    },
    {
      icon: 'fas fa-credit-card',
      title: 'Secure Payment Gateway',
      description: 'Multiple payment options with enterprise-grade security'
    },
    {
      icon: 'fas fa-qrcode',
      title: 'QR Code Tickets',
      description: 'Digital tickets with QR code generation and validation'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Admin Dashboard & Analytics',
      description: 'Real-time insights and comprehensive reporting tools'
    },
    {
      icon: 'fas fa-chair',
      title: 'Real-Time Seat Management',
      description: 'Dynamic seat allocation and availability tracking'
    },
    {
      icon: 'fas fa-envelope',
      title: 'Automated Notifications',
      description: 'Smart email notifications and reminders'
    },
    {
      icon: 'fas fa-user-shield',
      title: 'Role-Based Access Control',
      description: 'Granular permissions and secure user management'
    }
  ];

  // Why choose EventHub
  advantages = [
    {
      icon: 'fas fa-shield-alt',
      title: 'Enterprise-Level Security',
      description: 'Bank-grade encryption and security protocols'
    },
    {
      icon: 'fas fa-cloud',
      title: 'Scalable Cloud Architecture',
      description: 'Built to handle events of any size'
    },
    {
      icon: 'fas fa-paint-brush',
      title: 'User-Friendly Interface',
      description: 'Intuitive design for seamless user experience'
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Real-Time Data Monitoring',
      description: 'Live analytics and performance metrics'
    },
    {
      icon: 'fas fa-plug',
      title: 'Payment Integration Ready',
      description: 'Seamless integration with major payment providers'
    },
    {
      icon: 'fas fa-cogs',
      title: 'Customizable Event Modules',
      description: 'Flexible features tailored to your needs'
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 Technical Support',
      description: 'Round-the-clock assistance for your events'
    }
  ];

  // Core values
  coreValues = [
    {
      icon: 'fas fa-lightbulb',
      title: 'Innovation',
      description: 'Continuously pushing boundaries with cutting-edge technology'
    },
    {
      icon: 'fas fa-handshake',
      title: 'Integrity',
      description: 'Building trust through transparency and ethical practices'
    },
    {
      icon: 'fas fa-eye',
      title: 'Transparency',
      description: 'Open communication and clear business practices'
    },
    {
      icon: 'fas fa-users',
      title: 'Customer-Centric Approach',
      description: 'Putting your needs at the center of everything we do'
    },
    {
      icon: 'fas fa-arrow-up',
      title: 'Continuous Improvement',
      description: 'Always evolving to serve you better'
    }
  ];

  // Team members
  teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Alexandra Chen',
      position: 'Founder & CEO',
      bio: 'Visionary leader with 15+ years in enterprise technology and event management.',
      avatar: 'AC',
      linkedin: '#'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      position: 'Chief Technology Officer',
      bio: 'Full-stack architect specializing in scalable cloud solutions and security.',
      avatar: 'MR',
      linkedin: '#'
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      position: 'Operations Manager',
      bio: 'Expert in event operations and customer success management.',
      avatar: 'SJ',
      linkedin: '#'
    },
    {
      id: '4',
      name: 'David Kim',
      position: 'Product Development Lead',
      bio: 'Product strategist focused on user experience and innovation.',
      avatar: 'DK',
      linkedin: '#'
    }
  ];

  // Testimonials
  testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Jennifer Williams',
      company: 'TechCorp Solutions',
      position: 'Event Manager',
      review: 'EventHub transformed the way we manage corporate events. The platform is intuitive, secure, and scalable. Highly recommended for enterprise use.',
      rating: 5,
      avatar: 'JW'
    },
    {
      id: '2',
      name: 'Robert Thompson',
      company: 'Global Education Institute',
      position: 'Director of Operations',
      review: 'We\'ve processed over 10,000 registrations through EventHub with zero issues. The support team is exceptional and the platform reliability is unmatched.',
      rating: 5,
      avatar: 'RT'
    },
    {
      id: '3',
      name: 'Maria Garcia',
      company: 'Summit Events',
      position: 'CEO',
      review: 'The best event management platform we\'ve ever used. From registration to analytics, everything works seamlessly. Worth every penny!',
      rating: 5,
      avatar: 'MG'
    }
  ];

  // Technology stack
  techStack = [
    {
      category: 'Frontend',
      technologies: ['Angular', 'TypeScript', 'Tailwind CSS', 'RxJS'],
      icon: 'fas fa-code'
    },
    {
      category: 'Backend',
      technologies: ['Node.js', '.NET Core', 'Express.js', 'REST APIs'],
      icon: 'fas fa-server'
    },
    {
      category: 'Database',
      technologies: ['MongoDB', 'SQL Server', 'Redis'],
      icon: 'fas fa-database'
    },
    {
      category: 'Cloud & DevOps',
      technologies: ['AWS', 'Azure', 'Docker', 'Kubernetes'],
      icon: 'fas fa-cloud'
    },
    {
      category: 'Security',
      technologies: ['JWT Auth', 'OAuth 2.0', 'SSL/TLS', '2FA'],
      icon: 'fas fa-lock'
    }
  ];

  // Security features
  securityFeatures = [
    {
      icon: 'fas fa-lock',
      title: 'End-to-End Encryption',
      description: 'All data transmitted and stored with military-grade encryption'
    },
    {
      icon: 'fas fa-credit-card',
      title: 'Secure Payment Processing',
      description: 'PCI DSS compliant payment gateway integration'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Two-Factor Authentication',
      description: 'Additional security layer for account protection'
    },
    {
      icon: 'fas fa-user-shield',
      title: 'Role-Based Access Control',
      description: 'Granular permissions for different user roles'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Regular Security Audits',
      description: 'Continuous monitoring and vulnerability assessments'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    // Initialize animated counters
    this.animateCounters();
  }

  animateCounters(): void {
    // Only run on browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });

    // Observe all counter elements
    setTimeout(() => {
      document.querySelectorAll('[data-counter]').forEach(el => {
        observer.observe(el);
      });
    }, 100);
  }

  animateCounter(element: Element): void {
    const target = parseInt(element.getAttribute('data-target') || '0');
    const duration = 2000; // 2 seconds
    const step = target / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      const suffix = element.getAttribute('data-suffix') || '';
      element.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 16);
  }

  // Helper methods
  getStars(rating: number): string[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 'fas' : 'far');
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Contact methods
  requestDemo(): void {
    alert('Demo request form would open here. In production, this would navigate to a contact form or open a modal.');
  }

  contactSales(): void {
    alert('Sales contact form would open here. In production, this would navigate to sales contact page.');
  }
}
