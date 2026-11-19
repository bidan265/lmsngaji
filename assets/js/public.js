const modalDaftar = new bootstrap.Modal(document.getElementById('modalDaftar'));

document.addEventListener('DOMContentLoaded', () => {
    loadCMSSettings();
    loadCMSBanners();
    loadPublicCourses();
    loadPublicTutors();
    loadPublicArticles();
});

// Logika Navigasi SPA: Jika 'home' tampilkan semua, jika menu lain hanya tampilkan section tersebut
window.filterNavigasi = (target, navEl = null) => {
    if (navEl) {
        document.querySelectorAll('#landing-nav-links .nav-link').forEach(l => l.classList.remove('active'));
        navEl.classList.add('active');
    } else if (target === 'courses') {
        document.querySelectorAll('#landing-nav-links .nav-link').forEach(l => {
            l.classList.toggle('active', l.getAttribute('onclick')?.includes("'courses'"));
        });
    }

    // Tutup drawer kiri secara otomatis jika sedang dibuka di layar mobile
    const offcanvasEl = document.getElementById('navMenu');
    if (offcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOffcanvas) bsOffcanvas.hide();
    }

    // Tampilkan semua section jika 'home', atau tampilkan section spesifik saja (Banner #sec-hero tetap tampil)
    const allSections = document.querySelectorAll('.landing-section');
    if (target === 'home') {
        allSections.forEach(sec => sec.classList.remove('d-none'));
    } else {
        allSections.forEach(sec => sec.classList.add('d-none'));
        const activeSec = document.getElementById(`sec-${target}`);
        if (activeSec) activeSec.classList.remove('d-none');
    }

    // Refresh animasi AOS
    if (typeof AOS !== 'undefined') {
        setTimeout(() => AOS.refreshHard(), 100);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 1. Muat Pengaturan CMS (Logo, Latar, Tentang, Kontak)
async function loadCMSSettings() {
    const { data } = await db.from('cms_settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return;

    document.getElementById('cms-site-name').innerText = data.site_name;
    document.getElementById('footer-site-name').innerText = data.site_name;

    const logoEl = document.getElementById('cms-logo-img');
    if (data.logo_url) {
        logoEl.src = data.logo_url;
        logoEl.classList.remove('d-none');
    }

    if (data.bg_pattern_url) {
        document.getElementById('landing-body').style.backgroundImage = `url('${data.bg_pattern_url}')`;
        document.getElementById('landing-body').style.backgroundAttachment = 'fixed';
    }

    document.getElementById('cms-top-email').innerText = data.topbar_email;
    document.getElementById('cms-top-address').innerText = data.topbar_address;
    document.getElementById('cms-top-phone').innerText = data.topbar_phone;

    document.getElementById('cms-about-title').innerText = data.about_title;
    document.getElementById('cms-about-content').innerText = data.about_content;

    const aboutImg = document.getElementById('cms-about-img');
    const aboutSkeleton = document.getElementById('cms-about-skeleton');
    if (data.about_image_url) {
        aboutImg.onload = () => {
            if (aboutSkeleton) aboutSkeleton.classList.add('d-none');
            aboutImg.classList.remove('d-none');
        };
        aboutImg.src = data.about_image_url;
    } else if (aboutSkeleton) {
        aboutSkeleton.classList.add('d-none');
    }

    document.getElementById('cms-footer-text').innerText = data.footer_text;
    document.getElementById('contact-phone-box').innerText = data.topbar_phone;
    document.getElementById('contact-email-box').innerText = data.topbar_email;
    document.getElementById('contact-address-box').innerText = data.topbar_address;
}

// 2. Muat Banner Dinamis
async function loadCMSBanners() {
    const { data } = await db.from('cms_banners').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) return;

    const container = document.getElementById('banner-carousel-container');
    container.innerHTML = data.map((b, idx) => `
        <div class="carousel-item ${idx === 0 ? 'active' : ''}">
            <img src="${b.gambar_url}" 
                 class="banner-img-full" 
                 alt="Banner Slide" 
                 onclick="filterNavigasi('courses')" 
                 title="Klik untuk melihat Paket Kursus">
        </div>
    `).join('');
}

// 3. Muat Kartu Paket Kursus (Persis Desain Al-Quran)
async function loadPublicCourses() {
    const container = document.getElementById('public-courses-grid');
    const { data } = await db.from('packages').select(`*, users(nama, spesialisasi, avatar_url)`).order('created_at', { ascending: false });

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center text-muted py-4">Belum ada paket kelas yang tersedia.</div>`;
        return;
    }

    container.innerHTML = data.map((p, idx) => `
        <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(idx % 3) * 100}">
            <div class="course-card">
                <div class="img-wrap">
                    ${p.gambar_url ? `<img src="${p.gambar_url}" alt="${p.nama_paket}">` : `<div class="bg-light text-muted text-center py-5">Tanpa Gambar</div>`}
                    <span class="badge-study" style="cursor:pointer;" onclick="bukaModalDaftar('${p.id}', '${p.nama_paket.replace(/'/g, "\\'")}')">
                        Daftar • ${p.tipe_belajar}
                    </span>
                </div>
                <div class="p-4 pt-4 d-flex flex-column flex-grow-1">
                    <h5 class="fw-bold mb-1 mt-2">${p.nama_paket}</h5>
                    <span class="small text-success fw-semibold mb-2">${p.skema_bayar}</span>
                    <p class="small text-muted mb-0">${p.deskripsi || ''}</p>

                    <div class="course-stats">
                        <div><strong class="d-block text-dark">${p.jml_pertemuan || 20}</strong><span class="text-muted">Pertemuan</span></div>
                        <div><strong class="d-block text-dark">${p.durasi_minggu || 10}</strong><span class="text-muted">Minggu</span></div>
                        <div><strong class="d-block text-dark">${p.kuota_siswa || 50}</strong><span class="text-muted">Kuota</span></div>
                    </div>

                    <div class="course-footer-box">
                        <div class="d-flex align-items-center gap-2">
                            <img src="${p.users?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" class="rounded-circle" style="width:38px; height:38px; object-fit:cover;">
                            <div class="lh-sm">
                                <div class="fw-bold small text-dark">${p.users?.nama || 'Tim Pengajar'}</div>
                                <small class="text-success" style="font-size:0.7rem;">${p.users?.spesialisasi || 'Guru Mengaji'}</small>
                            </div>
                        </div>
                        <div class="price-tag-gold" style="cursor:pointer;" onclick="bukaModalDaftar('${p.id}', '${p.nama_paket.replace(/'/g, "\\'")}')">
                            <div class="fw-bold small">${formatRupiah(p.harga)}</div>
                            <span style="font-size:0.65rem;">Daftar Kelas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    if (typeof AOS !== 'undefined') AOS.refreshHard();
}

// 4. Muat Daftar Guru (Gaya Deen Connect)
async function loadPublicTutors() {
    const container = document.getElementById('public-tutors-grid');
    const { data } = await db.from('users').select('*').eq('role', 'guru');

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center text-muted">Belum ada data pengajar.</div>`;
        return;
    }

    container.innerHTML = data.map((g, idx) => `
        <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(idx % 3) * 100}">
            <div class="tutor-list-card border">
                <div>
                    <h6 class="fw-bold mb-1">${g.nama}</h6>
                    <p class="small text-muted mb-2">${(g.bio || '').substring(0, 75)}...</p>
                    <div class="d-flex align-items-center gap-2 mt-2">
                        <button class="btn-book-green" onclick='lihatProfilGuru(${JSON.stringify(g).replace(/'/g, "&#39;")})'>Lihat Profil</button>
                        <span class="small fw-bold text-warning"><i class="bi bi-star-fill"></i> ${g.rating || '4.9'}</span>
                    </div>
                </div>
                <img src="${g.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" alt="${g.nama}">
            </div>
        </div>
    `).join('');
    
    if (typeof AOS !== 'undefined') AOS.refreshHard();
}

window.lihatProfilGuru = (g) => {
    Swal.fire({
        html: `
            <div class="text-center p-2">
                <img src="${g.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" class="rounded-circle mb-3 shadow" style="width:110px; height:110px; object-fit:cover;">
                <h4 class="fw-bold mb-0">${g.nama}</h4>
                <p class="text-success fw-semibold small mb-2">${g.spesialisasi || 'Pengajar Al-Quran'}</p>
                <div class="mb-3"><span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> ${g.rating || '4.9'} Verified Tutor</span></div>
                <p class="small text-secondary">${g.bio || '-'}</p>
                <div class="bg-light p-3 rounded-3 text-start mb-3">
                    <div class="small fw-bold mb-1">Bahasa Pengantar:</div>
                    <span class="badge bg-white text-dark border">${g.bahasa || 'Indonesia, Arab'}</span>
                </div>
            </div>
        `,
        confirmButtonText: 'Pilih Kelas Bersama Pengajar Ini',
        confirmButtonColor: '#00b06b'
    }).then(res => {
        if (res.isConfirmed) filterNavigasi('courses');
    });
};

// 5. Muat Artikel Blog
async function loadPublicArticles() {
    const container = document.getElementById('public-blog-grid');
    const { data } = await db.from('articles').select(`*, users(nama)`).order('created_at', { ascending: false });

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center text-muted">Belum ada artikel yang dipublikasikan.</div>`;
        return;
    }

    container.innerHTML = data.map((a, idx) => `
        <div class="col-md-4" data-aos="fade-up" data-aos-delay="${(idx % 3) * 100}">
            <div class="course-card">
                <div class="img-wrap">
                    <img src="${a.gambar_url || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=600&q=80'}" alt="${a.judul}">
                    <span class="badge-study">${a.kategori}</span>
                </div>
                <div class="p-4 d-flex flex-column flex-grow-1">
                    <h5 class="fw-bold mt-2">${a.judul}</h5>
                    <p class="small text-muted flex-grow-1">${a.konten.substring(0, 110)}...</p>
                    <button class="btn btn-outline-success btn-sm w-100 mt-2" onclick="bacaArtikel('${a.judul.replace(/'/g, "\\'")}', \`${a.konten.replace(/`/g, "\\`")}\`)">
                        Baca Selengkapnya
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    if (typeof AOS !== 'undefined') AOS.refreshHard();
}

window.bacaArtikel = (judul, konten) => {
    Swal.fire({
        title: judul,
        html: `<div class="text-start lh-lg" style="white-space:pre-line;">${konten}</div>`,
        width: 700,
        confirmButtonColor: '#00875a',
        confirmButtonText: 'Tutup'
    });
};

window.bukaModalDaftar = (id, nama) => {
    document.getElementById('formPendaftaran').reset();
    document.getElementById('reg_paket_id').value = id;
    document.getElementById('reg_nama_paket').innerText = nama;
    modalDaftar.show();
};

document.getElementById('formPendaftaran').addEventListener('submit', async (e) => {
    e.preventDefault();
    Popup.loading('Mengirim pendaftaran...');
    const payload = {
        paket_id: document.getElementById('reg_paket_id').value,
        nama_calon: document.getElementById('reg_nama').value,
        email_calon: document.getElementById('reg_email').value.trim(),
        no_wa: document.getElementById('reg_wa').value,
        metode_pilihan: document.getElementById('reg_metode').value,
        catatan: document.getElementById('reg_catatan').value,
        status: 'Pending'
    };

    const { error } = await db.from('registrations').insert([payload]);
    if (error) Popup.error('Gagal Mendaftar', error.message);
    else {
        modalDaftar.hide();
        Popup.success('Pendaftaran Berhasil!', 'Data Anda sudah masuk ke Admin. Setelah di-Approve, Anda dapat login ke ruang kelas.');
    }
});