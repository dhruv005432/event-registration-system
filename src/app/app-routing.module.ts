import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { EventsComponent } from './components/events/events.component';
import { RegisterEventComponent } from './components/register-event/register-event.component';
import { RegistrationListComponent } from './components/registration-list/registration-list.component';
import { EditRegistrationComponent } from './components/edit-registration/edit-registration.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { managerGuard } from './guards/manager.guard';

const routes: Routes = [
  // Default redirect to home
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public Routes (No authentication required)
  { path: 'home', component: HomeComponent },
  { path: 'events', component: EventsComponent },
  { path: 'register-event', component: RegisterEventComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },

  // Protected Routes (Authentication required)
  { 
    path: 'registrations', 
    component: RegistrationListComponent, 
    canActivate: [authGuard],
    data: { title: 'Registration Management' }
  },
  { 
    path: 'edit/:id', 
    component: EditRegistrationComponent, 
    canActivate: [authGuard],
    data: { title: 'Edit Registration' }
  },

  // Admin Routes (Admin role required)
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [adminGuard],
    data: { title: 'Admin Dashboard', role: 'admin' }
  },

  // Manager Routes (Manager or Admin role required)
  { 
    path: 'manager', 
    component: AdminDashboardComponent, 
    canActivate: [managerGuard],
    data: { title: 'Manager Dashboard', role: 'manager' }
  },
  { 
    path: 'manager/events', 
    component: EventsComponent, 
    canActivate: [managerGuard],
    data: { title: 'Event Management', role: 'manager' }
  },
  { 
    path: 'manager/registrations', 
    component: RegistrationListComponent, 
    canActivate: [managerGuard],
    data: { title: 'Registration Management', role: 'manager' }
  },

  // User Dashboard Routes
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { title: 'User Dashboard', role: 'user' }
  },
  {
    path: 'profile',
    component: EditRegistrationComponent,
    canActivate: [authGuard],
    data: { title: 'User Profile', role: 'user' }
  },

  // Event-specific Routes
  {
    path: 'events/:id',
    component: RegisterEventComponent,
    data: { title: 'Event Registration' }
  },
  {
    path: 'events/:id/register',
    component: RegisterEventComponent,
    data: { title: 'Event Registration' }
  },

  // Error Handling Routes
  {
    path: '404',
    component: HomeComponent,
    data: { title: 'Page Not Found' }
  },
  {
    path: 'unauthorized',
    component: LoginComponent,
    data: { title: 'Unauthorized Access' }
  },

  // Wildcard Route (404 Page) - Must be last
  { 
    path: '**', 
    redirectTo: 'home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Enable scrolling position restoration
    scrollPositionRestoration: 'enabled',
    // Custom error handling
    errorHandler: (error) => {
      console.error('Router Error:', error);
      return error;
    }
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }