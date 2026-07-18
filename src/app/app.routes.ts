import {Routes} from '@angular/router';
import { Home } from './home';
import { AdminDashboard } from './admin-dashboard';
import { UserDashboard } from './user-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'admin', component: AdminDashboard },
  { path: 'user', component: UserDashboard },
  { path: '**', redirectTo: '' }
];
