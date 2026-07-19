import { ChangeDetectionStrategy, Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [MatIconModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col relative overflow-hidden">
      
      <!-- Atmospheric Background Glows -->
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div class="relative z-10 flex flex-1 items-center justify-center p-4">
        <div class="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          <div class="flex flex-col items-center justify-center gap-4 mb-10">
            <div class="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <mat-icon class="text-white text-3xl w-8 h-8 flex items-center justify-center">radar</mat-icon>
            </div>
            <h1 class="text-3xl font-black tracking-tighter uppercase">Rudal <span class="text-blue-400">Jitu</span></h1>
            <div class="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
              System Online
            </div>
          </div>

          <div class="flex gap-2 mb-8 bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              (click)="mode.set('user')"
              [class]="mode() === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-bold tracking-widest uppercase transition-all duration-300">
              Pengguna
            </button>
            <button 
              (click)="mode.set('admin')"
              [class]="mode() === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-bold tracking-widest uppercase transition-all duration-300">
              Admin
            </button>
          </div>

          @if (mode() === 'user') {
            <form [formGroup]="userForm" (ngSubmit)="loginUser()" class="space-y-6">
              <div>
                <label for="username-input" class="block text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-2">Nama Pelanggan</label>
                <div class="relative mb-4">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">person</mat-icon>
                  <input 
                    id="username-input"
                    type="text" 
                    formControlName="username"
                    placeholder="Masukkan nama Anda..." 
                    class="w-full bg-black/40 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono">
                </div>
                <label for="token-input" class="block text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-2">Token Akses</label>
                <div class="relative">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">key</mat-icon>
                  <input 
                    id="token-input"
                    type="text" 
                    formControlName="token"
                    placeholder="Masukkan token..." 
                    class="w-full bg-black/40 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono">
                </div>
              </div>
              
              @if (error()) {
                <div class="text-red-400 text-sm flex items-center gap-2 font-medium">
                  <mat-icon class="text-sm">error</mat-icon>
                  {{ error() }}
                </div>
              }

              <button 
                type="submit"
                [disabled]="loading() || userForm.invalid"
                class="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 disabled:opacity-50">
                @if (loading()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon> MEMVERIFIKASI
                } @else {
                  <mat-icon>login</mat-icon> MASUK SISTEM
                }
              </button>
            </form>
          } @else {
            <form [formGroup]="adminForm" (ngSubmit)="loginAdmin()" class="space-y-6">
              <div>
                <label for="admin-password" class="block text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-2">Password Admin</label>
                <div class="relative">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">lock</mat-icon>
                  <input 
                    id="admin-password"
                    type="password" 
                    formControlName="password"
                    placeholder="Masukkan password admin..." 
                    class="w-full bg-black/40 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono">
                </div>
              </div>

              @if (error()) {
                <div class="text-red-400 text-sm flex items-center gap-2 font-medium">
                  <mat-icon class="text-sm">error</mat-icon>
                  {{ error() }}
                </div>
              }

              <button 
                type="submit"
                [disabled]="loading() || adminForm.invalid"
                class="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 disabled:opacity-50">
                @if (loading()) {
                  <mat-icon class="animate-spin">autorenew</mat-icon> MEMVERIFIKASI
                } @else {
                  <mat-icon>admin_panel_settings</mat-icon> MASUK ADMIN
                }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class Home {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  
  mode = signal<'user' | 'admin'>('user');
  loading = signal(false);
  error = signal('');

  userForm = this.fb.group({
    token: ['', Validators.required],
    username: ['', Validators.required]
  });

  adminForm = this.fb.group({
    password: ['', Validators.required]
  });

  async loginUser() {
    if (this.userForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    
    try {
      const tokenVal = this.userForm.value.token?.trim() || '';
      const usernameVal = this.userForm.value.username?.trim() || '';
      
      const tokensRef = collection(db, 'tokens');
      const q = query(tokensRef, where('token', '==', tokenVal));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        this.error.set('Token tidak ditemukan.');
      } else {
        const tokenDoc = querySnapshot.docs[0];
        const tokenData = tokenDoc.data();
        
        if (tokenData['valid'] !== true) {
          this.error.set('Token sudah tidak aktif.');
          this.loading.set(false);
          return;
        }

        if (tokenData['boundUser'] && tokenData['boundUser'] !== usernameVal) {
          this.error.set('Token sudah digunakan oleh pelanggan lain.');
          this.loading.set(false);
          return;
        }

        // Bind token if not bound, and update lastUsed
        const updateData: any = { lastUsed: new Date() };
        if (!tokenData['boundUser']) {
          updateData.boundUser = usernameVal;
        }

        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(tokenDoc.ref, updateData);

        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.setItem('rudal_jitu_token', tokenVal);
          sessionStorage.setItem('rudal_jitu_username', usernameVal);
        }
        this.router.navigate(['/user']);
      }
    } catch(e: any) {
      this.error.set('Terjadi kesalahan jaringan.');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async loginAdmin() {
    if (this.adminForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    
    // Simulate slight network delay for feel
    await new Promise(r => setTimeout(r, 500));
    
    if (this.adminForm.value.password === '12445') {
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('rudal_jitu_admin', 'true');
      }
      this.router.navigate(['/admin']);
    } else {
      this.error.set('Password admin salah.');
    }
    
    this.loading.set(false);
  }
}
