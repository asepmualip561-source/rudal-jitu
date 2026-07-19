import { ChangeDetectionStrategy, Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { db } from './firebase';
import { collection, doc, writeBatch, getDocs, query, limit, serverTimestamp, getCountFromServer, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-dashboard',
  imports: [MatIconModule, DecimalPipe, DatePipe],
  template: `
    <div class="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col relative overflow-hidden">
      
      <!-- Atmospheric Background Glows -->
      <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <header class="h-20 flex items-center justify-between px-10 border-b border-white/10 backdrop-blur-sm z-10 relative shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <mat-icon class="text-white">admin_panel_settings</mat-icon>
          </div>
          <span class="text-2xl font-black tracking-tighter uppercase">Admin <span class="text-blue-400">Panel</span></span>
        </div>
        <div class="flex items-center gap-6">
          <button (click)="logout()" class="px-5 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">LOGOUT</button>
        </div>
      </header>

      <main class="flex-1 p-8 z-10 relative overflow-y-auto custom-scrollbar">
        <div class="max-w-6xl mx-auto space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <!-- Stats Card -->
            <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-center shadow-xl">
              <h2 class="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                <mat-icon class="text-blue-400 text-sm w-4 h-4">dataset</mat-icon>
                Total Data
              </h2>
              <div class="text-4xl font-bold font-mono text-white">
                {{ totalData() | number }}
              </div>
              <button (click)="loadStats()" class="text-xs text-blue-400 mt-2 text-left hover:underline font-bold uppercase tracking-widest">Refresh</button>
            </div>

            <!-- Tokens Card -->
            <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 class="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                <mat-icon class="text-emerald-400 text-sm w-4 h-4">key</mat-icon>
                Manajemen Token
              </h2>
              <div class="flex gap-2">
                <button (click)="generateTokens(10)" [disabled]="isGeneratingTokens()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50">
                  +10 Token
                </button>
                <button (click)="generateTokens(100)" [disabled]="isGeneratingTokens()" class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50">
                  +100 Token
                </button>
              </div>
              @if (newTokens().length > 0) {
                <div class="mt-4 p-3 bg-black/40 rounded-xl max-h-32 overflow-y-auto custom-scrollbar text-xs font-mono space-y-1 border border-white/5">
                  @for (t of newTokens(); track t) {
                    <div>{{ t }}</div>
                  }
                </div>
              }
            </div>

            <!-- Upload Card -->
            <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 class="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                <mat-icon class="text-purple-400 text-sm w-4 h-4">upload_file</mat-icon>
                Upload Excel
              </h2>
              <div class="relative">
                <input 
                  type="file" 
                  accept=".xlsx"
                  (change)="onFileSelected($event)"
                  [disabled]="isUploading()"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10">
                <div class="border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-purple-400/50 transition-colors bg-black/20"
                     [class.bg-purple-900]="isUploading()">
                  <mat-icon class="text-3xl text-purple-400 mb-2">cloud_upload</mat-icon>
                  <div class="text-[10px] font-bold tracking-widest uppercase">Pilih file Excel (.xlsx)</div>
                  <div class="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Kolom: NO.KPJ, NIK, NAMA, TGL LAHIR</div>
                </div>
              </div>
              @if (isUploading()) {
                <div class="mt-4">
                  <div class="flex justify-between text-[10px] font-bold tracking-widest uppercase mb-1">
                    <span>Proses Upload...</span>
                    <span>{{ uploadProgress() }}%</span>
                  </div>
                  <div class="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                    <div class="bg-gradient-to-r from-purple-600 to-purple-400 h-2 transition-all duration-300" [style.width.%]="uploadProgress()"></div>
                  </div>
                </div>
              }
            </div>

          </div>
          
          <!-- Token Listing Table -->
          <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
             <div class="flex items-center justify-between mb-4">
                <h2 class="text-slate-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                  <mat-icon class="text-emerald-400 text-sm w-4 h-4">list</mat-icon>
                  Daftar Token Akses
                </h2>
                <button (click)="loadTokens()" class="text-xs text-blue-400 hover:underline font-bold uppercase tracking-widest flex items-center gap-1">
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">refresh</mat-icon> Refresh
                </button>
             </div>
             
             <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left text-sm text-slate-300">
                   <thead class="text-xs text-slate-400 uppercase bg-black/40">
                      <tr>
                         <th scope="col" class="px-4 py-3 rounded-tl-xl border-b border-white/10">Token</th>
                         <th scope="col" class="px-4 py-3 border-b border-white/10">Status</th>
                         <th scope="col" class="px-4 py-3 border-b border-white/10">Pelanggan</th>
                         <th scope="col" class="px-4 py-3 border-b border-white/10">Dibuat</th>
                         <th scope="col" class="px-4 py-3 border-b border-white/10">Terakhir Digunakan</th>
                         <th scope="col" class="px-4 py-3 rounded-tr-xl border-b border-white/10">Aksi</th>
                      </tr>
                   </thead>
                   <tbody>
                      @if (isLoadingTokens()) {
                        <tr>
                           <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                             <mat-icon class="animate-spin mb-2">autorenew</mat-icon>
                             <div class="text-xs tracking-widest uppercase">Memuat token...</div>
                           </td>
                        </tr>
                      } @else if (tokensList().length === 0) {
                        <tr>
                           <td colspan="6" class="px-4 py-8 text-center text-slate-500 text-xs tracking-widest uppercase">Belum ada token.</td>
                        </tr>
                      } @else {
                        @for (t of tokensList(); track t.id) {
                          <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                             <td class="px-4 py-3 font-mono font-bold text-emerald-400">{{ t.token }}</td>
                             <td class="px-4 py-3">
                                @if (t.valid) {
                                  <span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold tracking-widest uppercase">Aktif</span>
                                } @else {
                                  <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] font-bold tracking-widest uppercase">Nonaktif</span>
                                }
                             </td>
                             <td class="px-4 py-3">
                                @if (t.boundUser) {
                                  <span class="text-blue-300 font-medium flex items-center gap-1"><mat-icon class="text-[14px] w-[14px] h-[14px]">person</mat-icon> {{ t.boundUser }}</span>
                                } @else {
                                  <span class="text-slate-500 italic text-xs">- Belum Terikat -</span>
                                }
                             </td>
                             <td class="px-4 py-3 text-xs text-slate-400">
                                {{ t.createdAt ? (t.createdAt | date:'mediumDate') : '-' }}
                             </td>
                             <td class="px-4 py-3 text-xs text-slate-400">
                                {{ t.lastUsed ? (t.lastUsed | date:'medium') : '-' }}
                             </td>
                             <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                   <button (click)="toggleToken(t.id, t.valid)" class="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs transition-colors" [title]="t.valid ? 'Nonaktifkan' : 'Aktifkan'">
                                      <mat-icon class="text-[16px] w-[16px] h-[16px]">{{ t.valid ? 'block' : 'check_circle' }}</mat-icon>
                                   </button>
                                   <button (click)="resetToken(t.id)" class="px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 text-xs transition-colors" title="Reset Pelanggan" [disabled]="!t.boundUser">
                                      <mat-icon class="text-[16px] w-[16px] h-[16px]">restart_alt</mat-icon>
                                   </button>
                                   <button (click)="deleteToken(t.id)" class="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs transition-colors" title="Hapus">
                                      <mat-icon class="text-[16px] w-[16px] h-[16px]">delete</mat-icon>
                                   </button>
                                </div>
                             </td>
                          </tr>
                        }
                      }
                   </tbody>
                </table>
             </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 backdrop-blur-md shadow-xl">
             <h2 class="text-red-400 text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                <mat-icon class="text-sm w-4 h-4">warning</mat-icon>
                Danger Zone
             </h2>
             <p class="text-xs text-slate-400 mb-4 tracking-wide">Menghapus semua data KPJ akan mengosongkan seluruh database. Aksi ini tidak dapat dibatalkan.</p>
             <button (click)="deleteAllData()" [disabled]="isDeleting()" class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50">
               @if(isDeleting()) { MENGHAPUS... } @else { HAPUS SEMUA DATA KPJ }
             </button>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.4); }
  `]
})
export class AdminDashboard implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  totalData = signal<number>(0);
  newTokens = signal<string[]>([]);
  isGeneratingTokens = signal(false);
  
  tokensList = signal<any[]>([]);
  isLoadingTokens = signal(false);
  
  isUploading = signal(false);
  uploadProgress = signal(0);
  
  isDeleting = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.getItem('rudal_jitu_admin') !== 'true') {
        this.router.navigate(['/']);
      } else {
        this.loadStats();
        this.loadTokens();
      }
    }
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('rudal_jitu_admin');
    }
    this.router.navigate(['/']);
  }

  async loadStats() {
    try {
      const coll = collection(db, 'kpj_data');
      const snapshot = await getCountFromServer(coll);
      this.totalData.set(snapshot.data().count);
    } catch (e) {
      console.error(e);
    }
  }

  async loadTokens() {
    this.isLoadingTokens.set(true);
    try {
      const tokensRef = collection(db, 'tokens');
      const q = query(tokensRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate(),
        lastUsed: doc.data()['lastUsed']?.toDate(),
      }));
      this.tokensList.set(list);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoadingTokens.set(false);
    }
  }

  async toggleToken(tokenId: string, currentStatus: boolean) {
    try {
      const ref = doc(db, 'tokens', tokenId);
      await updateDoc(ref, { valid: !currentStatus });
      this.loadTokens();
    } catch (e) {
      console.error(e);
    }
  }

  async resetToken(tokenId: string) {
    if (!confirm('Reset token ini agar dapat digunakan oleh pelanggan lain?')) return;
    try {
      const ref = doc(db, 'tokens', tokenId);
      await updateDoc(ref, { boundUser: null });
      this.loadTokens();
    } catch (e) {
      console.error(e);
    }
  }

  async deleteToken(tokenId: string) {
    if (!confirm('Yakin ingin menghapus token ini?')) return;
    try {
      const ref = doc(db, 'tokens', tokenId);
      await deleteDoc(ref);
      this.loadTokens();
    } catch (e) {
      console.error(e);
    }
  }

  async generateTokens(amount: number) {
    this.isGeneratingTokens.set(true);
    const tokens: string[] = [];
    const batch = writeBatch(db);
    
    for (let i = 0; i < amount; i++) {
      const t = Math.random().toString(36).substring(2, 10).toUpperCase();
      tokens.push(t);
      const ref = doc(collection(db, 'tokens'));
      batch.set(ref, {
        token: t,
        valid: true,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    this.newTokens.set(tokens);
    this.isGeneratingTokens.set(false);
    this.loadTokens();
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result as ArrayBuffer;
        if (!result) return;
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to json
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (rows.length === 0) {
          alert('File kosong');
          this.isUploading.set(false);
          return;
        }

        const BATCH_SIZE = 400; // Firestore limit is 500 per batch
        let currentBatch = writeBatch(db);
        let operations = 0;
        let processed = 0;

        for (const row of rows) {
          // Find correct column keys ignoring case/spaces
          let noKpj = '';
          let nik = '';
          let nama = '';
          let tglLahir = '';
          let kabupaten = '';
          let provinsi = '';
          
          for (const key of Object.keys(row)) {
            const k = key.toUpperCase().replace(/[^A-Z]/g, '');
            if (k.includes('NOKPJ') || k === 'KPJ') noKpj = row[key]?.toString() || '';
            else if (k.includes('NIK')) nik = row[key]?.toString() || '';
            else if (k.includes('NAMA')) nama = row[key]?.toString() || '';
            else if (k.includes('TGLLAHIR') || k.includes('TANGGALLAHIR')) tglLahir = row[key]?.toString() || '';
            else if (k.includes('KABUPATEN') || k.includes('KOTA')) kabupaten = row[key]?.toString() || '';
            else if (k.includes('PROVINSI')) provinsi = row[key]?.toString() || '';
          }

          if (!noKpj) continue;

          // Extract year prefix (first two digits)
          const yearPrefix = noKpj.substring(0, 2);

          const docRef = doc(collection(db, 'kpj_data'));
          currentBatch.set(docRef, {
            NO_KPJ: noKpj,
            NIK: nik,
            NAMA: nama,
            TGL_LAHIR: tglLahir,
            KABUPATEN: kabupaten,
            PROVINSI: provinsi,
            year: yearPrefix,
            _raw: JSON.stringify(row),
            uploadedAt: serverTimestamp()
          });

          operations++;
          processed++;

          if (operations >= BATCH_SIZE) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operations = 0;
            this.uploadProgress.set(Math.round((processed / rows.length) * 100));
          }
        }

        if (operations > 0) {
          await currentBatch.commit();
        }

        this.uploadProgress.set(100);
        setTimeout(() => {
          this.isUploading.set(false);
          this.uploadProgress.set(0);
          this.loadStats();
          alert('Upload Selesai!');
        }, 500);

      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memproses file.');
        this.isUploading.set(false);
      }
    };
    reader.readAsArrayBuffer(file);
    if (target) {
      target.value = ''; // reset input
    }
  }

  async deleteAllData() {
    if (!confirm('YAKIN INGIN MENGHAPUS SEMUA DATA KPJ? Aksi ini tidak dapat dibatalkan.')) return;
    
    this.isDeleting.set(true);
    try {
      const coll = collection(db, 'kpj_data');
      
      // Delete in batches since it can be large
      // This is a naive client-side wipe, for huge datasets a server function is better
      // but for this prototype, we'll loop until empty.
      let hasMore = true;
      let deletedCount = 0;

      while (hasMore) {
        const q = query(coll, limit(500));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const batch = writeBatch(db);
        snapshot.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
        deletedCount += snapshot.size;
        console.log(`Deleted ${deletedCount}`);
      }
      
      alert('Semua data berhasil dihapus.');
      this.loadStats();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus data.');
    } finally {
      this.isDeleting.set(false);
    }
  }

}
