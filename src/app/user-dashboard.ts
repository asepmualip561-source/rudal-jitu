import { ChangeDetectionStrategy, Component, signal, inject, OnInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { db } from './firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface KpjData {
  NO_KPJ: string;
  NIK: string;
  NAMA: string;
  TGL_LAHIR: string;
  KABUPATEN?: string;
  PROVINSI?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-dashboard',
  imports: [MatIconModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      
      <!-- Atmospheric Background Glows (Light Mode) -->
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <!-- Header -->
      <header class="h-20 flex items-center justify-between px-6 md:px-10 border-b border-slate-200 bg-white/60 backdrop-blur-md z-10 relative shrink-0 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <mat-icon class="text-white">radar</mat-icon>
          </div>
          <span class="text-xl md:text-2xl font-black tracking-tighter uppercase text-slate-900">Rudal <span class="text-blue-600">Jitu</span></span>
        </div>
        <div class="flex items-center gap-4 md:gap-6">
          <div class="hidden md:flex px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold items-center gap-2">
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> TOKEN ACTIVE
          </div>
          <button (click)="logout()" class="px-3 py-2 md:px-5 bg-slate-100 border border-slate-200 rounded-lg text-xs md:text-sm font-semibold hover:bg-slate-200 transition-colors text-slate-700">LOGOUT</button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-4 md:p-8 flex flex-col gap-4 md:gap-6 z-10 relative max-h-[calc(100vh-4rem)]">
        
        <!-- Search Area -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 shadow-md transition-all duration-500 flex-shrink-0 relative z-20" [class.opacity-95]="hasSearched()">
             <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="flex flex-col md:flex-row gap-4 w-full">
                <div class="relative flex-1">
                  <label for="search-kpj" class="absolute -top-2.5 left-4 px-2 bg-white text-blue-600 text-[10px] font-bold tracking-widest uppercase rounded-sm z-10 shadow-sm border border-slate-100">Cari Berdasarkan NO.KPJ</label>
                  <input 
                    id="search-kpj"
                    type="text" 
                    formControlName="kpj"
                    placeholder="Contoh: 24xxxxxxxxxx" 
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:opacity-40 transition-all shadow-inner">
                </div>
                <button 
                  type="submit"
                  [disabled]="loading() || searchForm.invalid"
                  class="h-[62px] px-6 md:px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:shadow-none text-sm md:text-base">
                  @if (loading()) {
                    <mat-icon class="animate-spin">autorenew</mat-icon> <span class="hidden md:inline">MENYIAPKAN DATA</span><span class="md:hidden">MENCARI</span>
                  } @else {
                    <mat-icon>search</mat-icon> <span class="hidden md:inline">TEMUKAN DATA</span><span class="md:hidden">CARI</span>
                  }
                </button>
             </form>
             @if (error()) {
                <div class="md:absolute -bottom-6 left-6 text-red-500 text-sm flex items-center gap-2 font-medium bg-white px-2 rounded">
                  <mat-icon class="text-sm">error</mat-icon> {{ error() }}
                </div>
             }
        </div>

        <!-- Results Area -->
        @if (hasSearched()) {
          <div class="flex-1 bg-white border border-slate-300 rounded-xl overflow-hidden flex flex-col shadow-lg relative min-h-[500px]">
            
            <!-- Excel Header -->
            <div class="hidden md:grid grid-cols-[60px_1.5fr_1.5fr_2fr_1.2fr_1.5fr_1.5fr] gap-0 border-b border-slate-300 bg-[#f8f9fa] text-xs font-bold text-slate-700 flex-shrink-0 shadow-sm relative z-10">
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center justify-center text-center">NO</div>
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center">NO. KPJ</div>
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center">NIK</div>
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center">NAMA LENGKAP</div>
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center">TGL LAHIR</div>
              <div class="col-span-1 p-3 border-r border-slate-300 flex items-center">KAB/KOTA</div>
              <div class="col-span-1 p-3 flex items-center">PROVINSI</div>
            </div>

            <!-- Animated Queue Container -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden relative bg-white" #resultsContainer id="auto-scroll-container">
              <div class="min-h-full p-0 md:p-0 space-y-3 md:space-y-0">
                @for (item of visibleResults(); track item.NO_KPJ + $index) {
                  <div class="result-card animate-slide-up-fade flex flex-col md:grid md:grid-cols-[60px_1.5fr_1.5fr_2fr_1.2fr_1.5fr_1.5fr] gap-2 md:gap-0 px-4 py-4 md:px-0 md:py-0 bg-white border-b border-slate-200 hover:bg-blue-50 transition-colors items-start md:items-stretch text-slate-800 text-sm mx-4 md:mx-0 mt-4 md:mt-0 rounded-xl md:rounded-none border md:border-x-0 md:border-t-0 shadow-sm md:shadow-none opacity-0">
                    
                    <div class="font-mono flex items-center justify-between md:justify-center w-full md:w-auto border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 mb-2 md:mb-0 md:p-3 text-slate-500">
                       <span class="md:hidden text-[10px] font-bold tracking-widest text-slate-400">NO</span>
                       {{ $index + 1 | number:'3.0-0' }}
                    </div>
                    
                    <div class="font-mono font-medium text-slate-900 break-all md:break-normal w-full flex flex-col justify-center md:border-r border-slate-200 md:p-3">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">NO. KPJ</span>
                       {{ item.NO_KPJ || '-' }}
                    </div>
                    
                    <div class="font-mono text-slate-600 break-all md:break-normal w-full flex flex-col justify-center md:border-r border-slate-200 md:p-3" [title]="item.NIK">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">NIK</span>
                       {{ item.NIK || '-' }}
                    </div>
                    
                    <div class="font-bold text-slate-800 uppercase break-words w-full flex flex-col justify-center md:border-r border-slate-200 md:p-3" [title]="item.NAMA">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">NAMA LENGKAP</span>
                       {{ item.NAMA || '-' }}
                    </div>
                    
                    <div class="text-slate-600 break-words w-full flex flex-col justify-center md:border-r border-slate-200 md:p-3" [title]="item.TGL_LAHIR">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">TGL LAHIR</span>
                       {{ item.TGL_LAHIR || '-' }}
                    </div>
                    
                    <div class="text-slate-600 break-words w-full flex flex-col justify-center md:border-r border-slate-200 md:p-3" [title]="item.KABUPATEN">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">KAB/KOTA</span>
                       {{ item.KABUPATEN || '-' }}
                    </div>
                    
                    <div class="text-slate-600 break-words w-full flex flex-col justify-center md:p-3" [title]="item.PROVINSI">
                       <span class="md:hidden text-[10px] text-slate-400 font-sans tracking-widest uppercase mb-1">PROVINSI</span>
                       {{ item.PROVINSI || '-' }}
                    </div>
                  </div>
                }
                
                @if (visibleResults().length === 0 && !loading()) {
                  <div class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                    <mat-icon class="text-4xl">search_off</mat-icon>
                    <p class="font-medium tracking-wide">TIDAK ADA DATA</p>
                  </div>
                }
              </div>
            </div>
            
            <!-- Queue Progress Overlay (Bottom) -->
            <div class="absolute bottom-0 left-0 right-0 h-2 bg-black/20 z-10">
              <div class="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]" [style.width.%]="loading() ? 100 : (visibleResults().length > 0 ? (visibleResults().length / fetchedData.length * 100) : 0)"></div>
            </div>
          </div>
        }
      </main>

      <!-- Footer Bar -->
      <footer class="h-auto md:h-16 bg-white border-t border-slate-200 px-4 md:px-10 py-3 md:py-0 flex flex-col md:flex-row items-center justify-center md:justify-between text-[10px] font-bold tracking-[0.2em] text-slate-500 relative z-10 shrink-0 gap-3 shadow-sm">
        
        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> FIRESTORE: CONNECTED</span>
          
          @if (hasSearched() && nextItemProgress() > 0 && visibleResults().length < fetchedData.length) {
            <div class="flex items-center gap-2 w-32 md:w-48">
              <span class="text-blue-500">PROSES...</span>
              <div class="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                 <div class="bg-blue-500 h-full transition-all duration-100" [style.width.%]="nextItemProgress()"></div>
              </div>
            </div>
          }
        </div>

        <div class="flex items-center gap-2 md:gap-4 flex-wrap justify-center w-full md:w-auto">
          @if (hasSearched()) {
            <span class="text-blue-600 hidden md:inline bg-blue-50 px-3 py-1 rounded-full border border-blue-100">TAMPIL: {{ visibleResults().length }} / {{ fetchedData.length }} DATA</span>
            <span class="text-blue-600 md:hidden bg-blue-50 px-2 py-1 rounded-full border border-blue-100">{{ visibleResults().length }}/{{ fetchedData.length }}</span>
            
            @if (visibleResults().length > 0) {
              <button 
                (click)="exportExcel()" 
                class="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-[0_2px_10px_rgba(16,185,129,0.2)] flex items-center gap-2 uppercase">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">download</mat-icon> <span class="hidden md:inline">DOWNLOAD HASIL TAMPIL</span><span class="md:hidden">UNDUH</span>
              </button>
            }
            <button 
              (click)="closeResults()" 
              class="px-3 md:px-4 py-1.5 md:py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-colors flex items-center gap-2 uppercase">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon> <span class="hidden md:inline">TUTUP HASIL</span><span class="md:hidden">TUTUP</span>
            </button>
          }
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.4); }
    @keyframes scanline {
      0% { transform: translateY(-100%); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(800px); opacity: 0; }
    }
    
    .animate-scan {
      animation: scanline 4s linear infinite;
    }
  `]
})
export class UserDashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  
  @ViewChild('resultsContainer') resultsContainer!: ElementRef;

  searchForm = this.fb.group({
    kpj: ['', Validators.required]
  });

  loading = signal(false);
  hasSearched = signal(false);
  nextItemProgress = signal(0);
  
  fetchedData: KpjData[] = [];
  visibleResults = signal<KpjData[]>([]);
  error = signal('');
  
  private animationFrameId: number | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (!sessionStorage.getItem('rudal_jitu_token')) {
        this.router.navigate(['/']);
      }
    }
  }

  ngOnDestroy() {
    this.stopAnimations();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('rudal_jitu_token');
    }
    this.router.navigate(['/']);
  }

  exportExcel() {
    const data = this.visibleResults();
    if (data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil_KPJ");
    XLSX.writeFile(wb, "Hasil_KPJ.xlsx");
  }

  closeResults() {
    this.stopAnimations();
    this.hasSearched.set(false);
    this.visibleResults.set([]);
    this.fetchedData = [];
    this.searchForm.reset();
  }

  async onSearch() {
    if (this.searchForm.invalid) return;
    const kpjInput = this.searchForm.value.kpj?.trim() || '';

    if (kpjInput.length < 2) {
      this.error.set('KPJ terlalu pendek.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.hasSearched.set(true);
    this.stopAnimations();
    this.fetchedData = [];
    this.visibleResults.set([]);

    try {
      const yearPrefix = kpjInput.substring(0, 2);
      const coll = collection(db, 'kpj_data');
      
      // Look for the year prefix
      const q = query(coll, where('year', '==', yearPrefix), limit(5000));
      const snapshot = await getDocs(q);
      
      let allFoundData: KpjData[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        let kabupaten = '-';
        let provinsi = '-';
        
        try {
           if (d['_raw']) {
              const rawRow = JSON.parse(d['_raw']);
              for (const key of Object.keys(rawRow)) {
                  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
                  if (k.includes('KABUPATEN') || k.includes('KOTA')) kabupaten = rawRow[key]?.toString() || kabupaten;
                  if (k.includes('PROVINSI')) provinsi = rawRow[key]?.toString() || provinsi;
              }
           }
        } catch {
           // ignore parse error
        }

        allFoundData.push({
          NO_KPJ: d['NO_KPJ'],
          NIK: d['NIK'],
          NAMA: d['NAMA'],
          TGL_LAHIR: d['TGL_LAHIR'],
          KABUPATEN: kabupaten,
          PROVINSI: provinsi
        });
      });
      
      if (allFoundData.length === 0) {
         this.fetchedData = [];
      } else {
         const CHUNK_SIZE = 100;
         let storageKey = `kpj_cycle_index_${yearPrefix}`;
         let currentIndex = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
         
         if (currentIndex >= allFoundData.length) {
            currentIndex = 0;
         }
         
         let chunk = allFoundData.slice(currentIndex, currentIndex + CHUNK_SIZE);
         if (chunk.length < CHUNK_SIZE && allFoundData.length > CHUNK_SIZE) {
             const remaining = CHUNK_SIZE - chunk.length;
             chunk = [...chunk, ...allFoundData.slice(0, remaining)];
             currentIndex = remaining;
         } else {
             currentIndex += CHUNK_SIZE;
         }
         
         sessionStorage.setItem(storageKey, currentIndex.toString());
         this.fetchedData = chunk;
      }

      // Trigger animations
      this.startAnimations();

    } catch (e) {
      console.error(e);
      this.error.set('Gagal mencari data.');
    } finally {
      this.loading.set(false);
    }
  }

  stopAnimations() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.nextItemProgress.set(0);
  }

  startAnimations() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.fetchedData.length === 0) return;

    // Show first immediately
    let currentIndex = 0;
    this.visibleResults.set([this.fetchedData[currentIndex]]);
    
    const DURATION_MS = 30000; // 30 seconds per item
    let startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      let progress = (elapsed / DURATION_MS) * 100;

      if (progress >= 100) {
        currentIndex++;
        if (currentIndex >= this.fetchedData.length) {
           this.stopAnimations();
           return;
        }
        
        this.visibleResults.update(current => [...current, this.fetchedData[currentIndex]]);
        
        // Auto scroll container down dynamically to reveal newly appearing item
        setTimeout(() => {
          const container = document.getElementById('auto-scroll-container');
          if (container) {
             container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
             });
          }
        }, 50);

        startTime = time;
        progress = 0;
      }
      
      this.nextItemProgress.set(Math.min(progress, 100));
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}

