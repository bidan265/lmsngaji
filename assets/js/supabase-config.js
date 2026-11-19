// URL Project Anda sudah terpasang, cukup pastikan ANON KEY Anda benar:
const SUPABASE_URL = 'https://bnpkghtshwihzpijvokb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGtnaHRzaHdpaHpwaWp2b2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2OTU4OTMsImV4cCI6MjExMDI3MTg5M30.W_jtjnTz77oYfjExy0tGYn60srnUuf_mG56dWTj4QSs';

// Nama bucket penyimpanan untuk semua gambar, logo, latar, dan video
const STORAGE_BUCKET = 'videos';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper SweetAlert2 (Tanpa popup bawaan browser)
const Popup = {
    success: (title, text = '') => Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#00875a' }),
    error: (title, text = '') => Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#dc2626' }),
    confirm: async (title, text) => {
        const res = await Swal.fire({
            title, text, icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#00875a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Lanjutkan',
            cancelButtonText: 'Batal'
        });
        return res.isConfirmed;
    },
    toast: (title, icon = 'success') => {
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true }).fire({ icon, title });
    },
    loading: (title = 'Memproses data...') => {
        Swal.fire({ title, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }
};

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
}

// Fungsi Universal Unggah Berkas ke Bucket 'videos' dengan Content-Type Asli
async function uploadKeBucket(file, folder = 'media') {
    const ext = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await db.storage.from(STORAGE_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined
    });

    if (error) throw new Error(`Gagal mengunggah ke penyimpanan '${STORAGE_BUCKET}': ${error.message}`);

    const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
}

// Helper Format Tanggal & Jam Indonesia (contoh: Kamis, 19 Nov 2026 • 16.00 WIB)
function formatTanggalIndo(nilaiTanggal) {
    if (!nilaiTanggal) return 'Jadwal Fleksibel';
    const tgl = new Date(nilaiTanggal);
    if (isNaN(tgl.getTime())) return nilaiTanggal;
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(tgl) + ' WIB';
}