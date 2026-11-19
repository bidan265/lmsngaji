const currentUser = JSON.parse(localStorage.getItem('lms_user'));
if (!currentUser) window.location.href = 'login.html';

const modalDash = new bootstrap.Modal(document.getElementById('modalDashboard'));

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user-badge-top').innerText = `${currentUser.nama} (${currentUser.role.toUpperCase()})`;
    initNavigation();
});

window.logoutUser = async () => {
    if (await Popup.confirm('Keluar Ruang Kelas?', 'Sesi Anda akan diakhiri.')) {
        localStorage.removeItem('lms_user');
        window.location.href = 'login.html';
    }
};

function initNavigation() {
    let menus = [];
    if (currentUser.role === 'admin') {
        menus = [
            { id: 'approval', icon: 'bi-check2-circle', label: 'Persetujuan' },
            { id: 'cms', icon: 'bi-palette', label: 'Tampilan & Spanduk' },
            { id: 'paket', icon: 'bi-box-seam', label: 'Paket Kelas' },
            { id: 'guru', icon: 'bi-person-badge', label: 'Data Pengajar' },
            { id: 'artikel', icon: 'bi-newspaper', label: 'Artikel' }
        ];
    } else if (currentUser.role === 'guru') {
        menus = [
            { id: 'materi', icon: 'bi-camera-video', label: 'Sesi Langsung & Video' },
            { id: 'permintaan_jadwal', icon: 'bi-calendar2-check', label: 'Permintaan Jadwal' },
            { id: 'soal', icon: 'bi-collection', label: 'Bank Soal' },
            { id: 'koreksi', icon: 'bi-clipboard-check', label: 'Penilaian Uraian' },
            { id: 'artikel', icon: 'bi-journal-richtext', label: 'Artikel' }
        ];
    } else {
        menus = [
            { id: 'siswa_home', icon: 'bi-house-door-fill', label: 'Beranda' },
            { id: 'siswa_tutor', icon: 'bi-people-fill', label: 'Pengajar' },
            { id: 'siswa_kuis', icon: 'bi-award-fill', label: 'Kuis & Nilai' },
            { id: 'siswa_jadwal', icon: 'bi-calendar2-check-fill', label: 'Jadwal' },
            { id: 'siswa_profil', icon: 'bi-person-circle', label: 'Profil Saya' }
        ];
    }

    const sideEl = document.getElementById('desktop-sidebar-menu');
    const mobEl = document.getElementById('mobile-bottom-menu');

    sideEl.innerHTML = menus.map((m, i) => `
        <a href="#" class="nav-link ${i === 0 ? 'active bg-success text-white' : 'text-dark'}" data-sec="${m.id}" onclick="bukaMenu('${m.id}')">
            <i class="bi ${m.icon} me-2"></i>${m.label}
        </a>
    `).join('');

    mobEl.innerHTML = menus.map((m, i) => `
        <a href="#" class="${i === 0 ? 'active' : ''}" data-sec="${m.id}" onclick="bukaMenu('${m.id}')">
            <i class="bi ${m.icon}"></i>
            <span>${m.label}</span>
        </a>
    `).join('');

    bukaMenu(menus[0].id);
}

window.bukaMenu = async (secId) => {
    document.querySelectorAll('#desktop-sidebar-menu .nav-link').forEach(el => {
        el.classList.toggle('active', el.dataset.sec === secId);
        el.classList.toggle('bg-success', el.dataset.sec === secId);
        el.classList.toggle('text-white', el.dataset.sec === secId);
    });
    document.querySelectorAll('#mobile-bottom-menu a').forEach(el => {
        el.classList.toggle('active', el.dataset.sec === secId);
    });

    const container = document.getElementById('dashboard-main-content');
    container.innerHTML = `<div class="p-5 text-center text-muted">Memuat data...</div>`;

    if (secId === 'approval') await renderApprovalAdmin(container);
    if (secId === 'cms') await renderCMSAdmin(container);
    if (secId === 'paket') await renderPaketAdmin(container);
    if (secId === 'guru') await renderGuruAdmin(container);
    if (secId === 'artikel') await renderArtikelCRUD(container);
    if (secId === 'materi') await renderMateriGuru(container);
    if (secId === 'permintaan_jadwal') await renderPermintaanJadwalGuru(container);
    if (secId === 'soal') await renderSoalGuru(container);
    if (secId === 'koreksi') await renderKoreksiGuru(container);
    if (secId === 'siswa_home') await renderSiswaHome(container);
    if (secId === 'siswa_tutor') await renderSiswaTutorList(container);
    if (secId === 'siswa_kuis') await renderSiswaKuis(container);
    if (secId === 'siswa_jadwal') await renderSiswaJadwal(container);
    if (secId === 'siswa_profil') await renderSiswaProfil(container);
};

/* ============================================================================
   BAGIAN 1: ADMIN - CMS LANDING PAGE & BANNER (SEMUA UPLOAD KE BUCKET 'videos')
   ============================================================================ */
async function renderCMSAdmin(container) {
    const { data: cms } = await db.from('cms_settings').select('*').eq('id', 1).maybeSingle();
    const { data: banners } = await db.from('cms_banners').select('*').order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="p-3">
            <h4 class="fw-bold mb-3">Kelola Tampilan Landing Page, Logo, Latar & Banner</h4>
            <div class="row g-4">
                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm rounded-4">
                        <div class="card-header bg-white fw-bold py-3">Pengaturan Identitas, Logo & Latar (Bucket)</div>
                        <div class="card-body">
                            <form id="formCMSSettings">
                                <div class="mb-2">
                                    <label class="small fw-semibold">Nama Website</label>
                                    <input type="text" id="cms_nama" class="form-control" value="${cms?.site_name || ''}" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-2">
                                        <label class="small fw-semibold">Upload Logo Baru</label>
                                        <input type="file" id="cms_logo_file" class="form-control" accept="image/*">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="small fw-semibold">Upload Gambar Latar (Background)</label>
                                        <input type="file" id="cms_bg_file" class="form-control" accept="image/*">
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-2">
                                        <label class="small fw-semibold">Email Topbar</label>
                                        <input type="text" id="cms_email" class="form-control" value="${cms?.topbar_email || ''}">
                                    </div>
                                    <div class="col-md-6 mb-2">
                                        <label class="small fw-semibold">No. Telepon / WA</label>
                                        <input type="text" id="cms_phone" class="form-control" value="${cms?.topbar_phone || ''}">
                                    </div>
                                </div>
                                <div class="mb-2">
                                    <label class="small fw-semibold">Alamat Lembaga</label>
                                    <input type="text" id="cms_addr" class="form-control" value="${cms?.topbar_address || ''}">
                                </div>
                                <div class="mb-2">
                                    <label class="small fw-semibold">Judul About Us</label>
                                    <input type="text" id="cms_ab_title" class="form-control" value="${cms?.about_title || ''}">
                                </div>
                                <div class="mb-2">
                                    <label class="small fw-semibold">Isi About Us</label>
                                    <textarea id="cms_ab_desc" class="form-control" rows="3">${cms?.about_content || ''}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="small fw-semibold">Upload Foto About Us</label>
                                    <input type="file" id="cms_ab_file" class="form-control" accept="image/*">
                                </div>
                                <button type="submit" class="btn btn-emerald w-100">Simpan Pengaturan Landing Page</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card border-0 shadow-sm rounded-4">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                            <span class="fw-bold">Daftar Banner Slide Utama</span>
                            <button class="btn btn-sm btn-emerald" onclick="formBanner()"><i class="bi bi-plus-lg"></i> Tambah Banner</button>
                        </div>
                        <div class="card-body">
                            ${(banners || []).map(b => `
                                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                                    <div class="d-flex align-items-center gap-3">
                                        <img src="${b.gambar_url}" style="width:70px; height:45px; object-fit:cover;" class="rounded">
                                        <div>
                                            <div class="fw-bold small">${b.judul}</div>
                                            <div class="text-muted" style="font-size:0.75rem;">${b.subjudul || ''}</div>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-sm btn-outline-primary" onclick='formBanner(${JSON.stringify(b)})'><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="hapusData('cms_banners', '${b.id}', 'cms')"><i class="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('formCMSSettings').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Mengunggah file ke Bucket & menyimpan CMS...');
            let payload = {
                site_name: document.getElementById('cms_nama').value,
                topbar_email: document.getElementById('cms_email').value,
                topbar_phone: document.getElementById('cms_phone').value,
                topbar_address: document.getElementById('cms_addr').value,
                about_title: document.getElementById('cms_ab_title').value,
                about_content: document.getElementById('cms_ab_desc').value
            };

            const fLogo = document.getElementById('cms_logo_file').files[0];
            if (fLogo) payload.logo_url = await uploadKeBucket(fLogo, 'cms');

            const fBg = document.getElementById('cms_bg_file').files[0];
            if (fBg) payload.bg_pattern_url = await uploadKeBucket(fBg, 'cms');

            const fAb = document.getElementById('cms_ab_file').files[0];
            if (fAb) payload.about_image_url = await uploadKeBucket(fAb, 'cms');

            await db.from('cms_settings').update(payload).eq('id', 1);
            Popup.success('Berhasil!', 'Tampilan Landing Page telah diperbarui.');
            bukaMenu('cms');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
}

window.formBanner = (item = null) => {
    document.getElementById('modalDashboardTitle').innerText = item ? 'Ganti Gambar Banner' : 'Upload Gambar Banner Baru';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fBanner">
            <div class="mb-3">
                <label class="form-label fw-semibold">Pilih File Gambar Banner (Ukuran Utuh & Klik Otomatis ke Courses)</label>
                <input type="file" id="b_file" class="form-control" accept="image/*" required>
            </div>
            ${item?.gambar_url ? `<div class="mb-3"><small class="text-muted d-block mb-1">Banner Saat Ini:</small><img src="${item.gambar_url}" class="img-fluid rounded border"></div>` : ''}
            <button type="submit" class="btn btn-emerald w-100">Upload & Simpan Banner</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fBanner').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Mengunggah gambar banner...');
            let gambar_url = item?.gambar_url || '';
            const file = document.getElementById('b_file').files[0];
            if (file) gambar_url = await uploadKeBucket(file, 'banners');

            const payload = {
                judul: 'Banner Slide',
                subjudul: '',
                teks_tombol: '',
                gambar_url
            };

            if (item) await db.from('cms_banners').update(payload).eq('id', item.id);
            else await db.from('cms_banners').insert([payload]);

            modalDash.hide();
            Popup.toast('Banner berhasil disimpan');
            bukaMenu('cms');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

/* ============================================================================
   BAGIAN 2: ADMIN - APPROVAL SISWA, CRUD PAKET & CRUD GURU (DENGAN BUCKET)
   ============================================================================ */
async function renderApprovalAdmin(container) {
    const { data } = await db.from('registrations')
        .select(`*, packages(nama_paket, harga, skema_bayar)`)
        .order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="p-3">
            <h4 class="fw-bold mb-3">Persetujuan Pendaftaran Calon Siswa</h4>
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Calon Siswa</th>
                                <th>Paket & Metode</th>
                                <th>Tagihan Pembayaran</th>
                                <th>Catatan</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data || []).map(r => `
                                <tr>
                                    <td>
                                        <div class="fw-bold">${r.nama_calon}</div>
                                        <small class="text-muted">${r.email_calon} | WA: ${r.no_wa}</small>
                                    </td>
                                    <td>
                                        <div class="fw-semibold">${r.packages?.nama_paket || '-'}</div>
                                        <span class="badge bg-success-subtle text-success">${r.metode_pilihan}</span>
                                    </td>
                                    <td>
                                        <div class="fw-bold text-success fs-6">${formatRupiah(r.packages?.harga || 0)}</div>
                                        <small class="text-muted">${r.packages?.skema_bayar || '-'}</small>
                                    </td>
                                    <td class="small">${r.catatan || '-'}</td>
                                    <td>
                                        <span class="badge ${r.status === 'Approved' ? 'bg-success' : 'bg-warning text-dark'}">
                                            ${r.status === 'Approved' ? 'Disetujui' : 'Menunggu'}
                                        </span>
                                    </td>
                                    <td>
                                        ${r.status === 'Pending' ? `
                                            <button class="btn btn-sm btn-emerald" onclick="approveSiswa('${r.id}','${r.nama_calon.replace(/'/g, "\\'")}','${r.email_calon}','${r.no_wa}','${r.paket_id}','${(r.packages?.nama_paket || '').replace(/'/g, "\\'")}',${r.packages?.harga || 0})">
                                                Setujui & Buat Akun
                                            </button>
                                        ` : '<span class="small text-muted">Selesai</span>'}
                                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="hapusData('registrations','${r.id}','approval')">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.approveSiswa = async (regId, nama, email, wa, paketId, namaPaket, harga) => {
    const { value: pass } = await Swal.fire({
        title: `Setujui Pendaftaran ${nama}?`,
        html: `
            <div class="alert alert-success text-start small mb-3">
                <div><strong>Paket Dipilih:</strong> ${namaPaket}</div>
                <div><strong>Total Tagihan:</strong> <span class="fw-bold text-success">${formatRupiah(harga)}</span></div>
            </div>
            <p class="small mb-1">Masukkan kata sandi untuk akun masuk siswa ini:</p>
        `,
        input: 'text',
        inputValue: '123456',
        showCancelButton: true,
        confirmButtonColor: '#00875a',
        confirmButtonText: 'Setujui & Aktifkan',
        cancelButtonText: 'Batal'
    });
    if (!pass) return;

    Popup.loading('Membuat akun kelas siswa...');
    const { data: u, error } = await db.from('users').insert([{ nama, email, password: pass, no_wa: wa, role: 'siswa' }]).select().single();
    if (error) return Popup.error('Gagal', error.message);

    await db.from('enrollments').insert([{ siswa_id: u.id, paket_id: paketId }]);
    await db.from('registrations').update({ status: 'Approved' }).eq('id', regId);
    Popup.success('Akun Aktif!', `Siswa dapat masuk dengan Email: ${email} & Kata Sandi: ${pass}`);
    bukaMenu('approval');
};

async function renderPaketAdmin(container) {
    const { data } = await db.from('packages').select(`*, users(nama)`).order('created_at', { ascending: false });
    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0">Kelola Paket Kursus</h4>
                <button class="btn btn-emerald" onclick="formPaket()"><i class="bi bi-plus-lg me-1"></i>Tambah Paket</button>
            </div>
            <div class="row g-3">
                ${(data || []).map(p => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <img src="${p.gambar_url}" style="width:100%; height:auto; display:block;">
                            <div class="card-body">
                                <span class="badge bg-success-subtle text-success mb-1">${p.tipe_belajar} • ${p.skema_bayar}</span>
                                <h5 class="fw-bold mb-1">${p.nama_paket}</h5>
                                <div class="small text-muted mb-2">Pengajar: ${p.users?.nama || '-'}</div>
                                <div class="fw-bold text-success mb-3">${formatRupiah(p.harga)}</div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-outline-primary w-100" onclick='formPaket(${JSON.stringify(p)})'>Edit</button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="hapusData('packages','${p.id}','paket')"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.formPaket = async (item = null) => {
    const { data: gurus } = await db.from('users').select('id, nama').eq('role', 'guru');
    document.getElementById('modalDashboardTitle').innerText = item ? 'Edit Paket Kursus' : 'Tambah Paket Kursus';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fPaket">
            <div class="mb-2"><label>Nama Paket Kursus</label><input type="text" id="p_nama" class="form-control" value="${item?.nama_paket || ''}" required></div>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <label>Metode Belajar</label>
                    <select id="p_tipe" class="form-select">
                        <option value="Tatap Muka & Zoom" ${item?.tipe_belajar === 'Tatap Muka & Zoom' ? 'selected' : ''}>Tatap Muka & Zoom</option>
                        <option value="Online (Zoom)" ${item?.tipe_belajar === 'Online (Zoom)' ? 'selected' : ''}>Online (Zoom)</option>
                        <option value="Tatap Muka" ${item?.tipe_belajar === 'Tatap Muka' ? 'selected' : ''}>Tatap Muka</option>
                    </select>
                </div>
                <div class="col-md-6 mb-2">
                    <label>Skema Pembayaran</label>
                    <select id="p_skema" class="form-select">
                        <option value="Per Pertemuan" ${item?.skema_bayar === 'Per Pertemuan' ? 'selected' : ''}>Sekali Pertemuan Bayar</option>
                        <option value="1 Paket Selesai" ${item?.skema_bayar === '1 Paket Selesai' ? 'selected' : ''}>1 Paket Program Selesai</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-4 mb-2"><label>Biaya (Rp)</label><input type="number" id="p_harga" class="form-control" value="${item?.harga || 150000}" required></div>
                <div class="col-md-4 mb-2"><label>Jml Lessons</label><input type="number" id="p_les" class="form-control" value="${item?.jml_pertemuan || 20}"></div>
                <div class="col-md-4 mb-2"><label>Durasi (Weeks)</label><input type="number" id="p_week" class="form-control" value="${item?.durasi_minggu || 10}"></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2">
                    <label>Guru Pengampu</label>
                    <select id="p_guru" class="form-select">
                        ${(gurus || []).map(g => `<option value="${g.id}" ${item?.guru_id === g.id ? 'selected' : ''}>${g.nama}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-2">
                    <label>Upload Foto Sampul (Bucket)</label>
                    <input type="file" id="p_file" class="form-control" accept="image/*">
                </div>
            </div>
            <div class="mb-3"><label>Deskripsi</label><textarea id="p_desc" class="form-control" rows="2">${item?.deskripsi || ''}</textarea></div>
            <button type="submit" class="btn btn-emerald w-100">Simpan Paket</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fPaket').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan paket...');
            let gambar_url = item?.gambar_url || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80';
            const f = document.getElementById('p_file').files[0];
            if (f) gambar_url = await uploadKeBucket(f, 'courses');

            const payload = {
                nama_paket: document.getElementById('p_nama').value,
                tipe_belajar: document.getElementById('p_tipe').value,
                skema_bayar: document.getElementById('p_skema').value,
                harga: document.getElementById('p_harga').value,
                jml_pertemuan: document.getElementById('p_les').value,
                durasi_minggu: document.getElementById('p_week').value,
                guru_id: document.getElementById('p_guru').value,
                deskripsi: document.getElementById('p_desc').value,
                gambar_url
            };

            if (item) await db.from('packages').update(payload).eq('id', item.id);
            else await db.from('packages').insert([payload]);
            modalDash.hide();
            Popup.toast('Paket disimpan');
            bukaMenu('paket');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

async function renderGuruAdmin(container) {
    const { data } = await db.from('users').select('*').eq('role', 'guru');
    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0">Kelola Data Guru / Ustadz</h4>
                <button class="btn btn-emerald" onclick="formGuru()"><i class="bi bi-person-plus me-1"></i>Tambah Guru</button>
            </div>
            <div class="row g-3">
                ${(data || []).map(g => `
                    <div class="col-md-6 col-lg-4">
                        <div class="tutor-list-card">
                            <div>
                                <h6 class="fw-bold mb-1">${g.nama}</h6>
                                <div class="small text-success fw-semibold mb-1">${g.spesialisasi || ''}</div>
                                <div class="small text-muted mb-2">${g.email}</div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-sm btn-outline-primary" onclick='formGuru(${JSON.stringify(g)})'>Edit</button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="hapusData('users','${g.id}','guru')">Hapus</button>
                                </div>
                            </div>
                            <img src="${g.avatar_url}">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.formGuru = (item = null) => {
    document.getElementById('modalDashboardTitle').innerText = item ? 'Ubah Profil Pengajar' : 'Tambah Pengajar Baru';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fGuru">
            <div class="row">
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Nama Lengkap</label><input type="text" id="g_nama" class="form-control" value="${item?.nama || ''}" required></div>
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Email Masuk</label><input type="email" id="g_email" class="form-control" value="${item?.email || ''}" required></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Kata Sandi</label><input type="text" id="g_pass" class="form-control" value="${item?.password || '123456'}" required></div>
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Keahlian / Bidang</label><input type="text" id="g_spes" class="form-control" value="${item?.spesialisasi || 'Tahsin & Tajwid'}"></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Hari Tersedia</label><input type="text" id="g_hari" class="form-control" placeholder="Senin, Rabu, Jumat" value="${item?.hari_tersedia || 'Senin, Rabu, Jumat'}"></div>
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Jam Tersedia</label><input type="text" id="g_jam" class="form-control" placeholder="16.00 - 20.00 WIB" value="${item?.jam_tersedia || '16.00 - 20.00 WIB'}"></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Bahasa Pengantar</label><input type="text" id="g_bhs" class="form-control" value="${item?.bahasa || 'Indonesia, Arab'}"></div>
                <div class="col-md-6 mb-2"><label class="small fw-semibold">Unggah Foto Profil</label><input type="file" id="g_file" class="form-control" accept="image/*"></div>
            </div>
            <div class="mb-3"><label class="small fw-semibold">Biografi Singkat</label><textarea id="g_bio" class="form-control" rows="2">${item?.bio || ''}</textarea></div>
            <button type="submit" class="btn btn-emerald w-100">Simpan Data Pengajar</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fGuru').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan profil pengajar...');
            let avatar_url = item?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            const f = document.getElementById('g_file').files[0];
            if (f) avatar_url = await uploadKeBucket(f, 'avatars');

            const payload = {
                nama: document.getElementById('g_nama').value,
                email: document.getElementById('g_email').value,
                password: document.getElementById('g_pass').value,
                spesialisasi: document.getElementById('g_spes').value,
                hari_tersedia: document.getElementById('g_hari').value,
                jam_tersedia: document.getElementById('g_jam').value,
                bahasa: document.getElementById('g_bhs').value,
                bio: document.getElementById('g_bio').value,
                role: 'guru',
                avatar_url
            };
            if (item) await db.from('users').update(payload).eq('id', item.id);
            else await db.from('users').insert([payload]);
            modalDash.hide();
            Popup.toast('Data pengajar disimpan');
            bukaMenu('guru');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

/* ============================================================================
   BAGIAN 3: GURU - KELOLA KUIS EXCEL (IMPORT/EXPORT GAMBAR DI DALAM SEL EXCEL)
   ============================================================================ */
async function renderSoalGuru(container) {
    // Jika sedang membuka butir soal di dalam satu Bank Soal tertentu
    if (window.activeBankSoalId) {
        return renderDetailButirSoal(container, window.activeBankSoalId);
    }

    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    const filterPaketId = window.filterKelasBank || 'SEMUA';

    let query = db.from('quiz_banks').select(`*, packages(nama_paket), quizzes(poin)`).order('created_at', { ascending: false });
    if (filterPaketId !== 'SEMUA') query = query.eq('paket_id', filterPaketId);
    const { data: banks } = await query;

    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h4 class="fw-bold mb-1">Kelola Bank Soal per Mata Pelajaran & Kelas</h4>
                    <small class="text-muted">Kelompokkan soal sesuai nama mata pelajaran/topik dan kelas tujuan.</small>
                </div>
                <button class="btn btn-emerald" onclick="formBankSoal()">
                    <i class="bi bi-folder-plus me-1"></i>Buat Bank Soal Baru
                </button>
            </div>

            <div class="card border-0 shadow-sm rounded-4 p-3 mb-4">
                <label class="small fw-bold mb-1">Saring Berdasarkan Kelas yang Dibuka:</label>
                <select class="form-select" onchange="window.filterKelasBank = this.value; bukaMenu('soal');">
                    <option value="SEMUA" ${filterPaketId === 'SEMUA' ? 'selected' : ''}>-- Semua Kelas --</option>
                    ${(pakets || []).map(p => `<option value="${p.id}" ${p.id === filterPaketId ? 'selected' : ''}>${p.nama_paket}</option>`).join('')}
                </select>
            </div>

            <div class="row g-3">
                ${(!banks || banks.length === 0) ? `<div class="col-12 text-center text-muted py-5">Belum ada bank soal. Klik "Buat Bank Soal Baru" untuk memulai.</div>` : banks.map(b => {
                    const jmlSoal = (b.quizzes || []).length;
                    const totPoin = (b.quizzes || []).reduce((acc, q) => acc + (parseInt(q.poin) || 0), 0);
                    return `
                    <div class="col-md-6 col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-column">
                            <span class="badge bg-success-subtle text-success align-self-start mb-2">${b.packages?.nama_paket || 'Tanpa Kelas'}</span>
                            <h5 class="fw-bold mb-1">${b.nama_bank_soal}</h5>
                            <p class="small text-muted flex-grow-1">${b.deskripsi || 'Tidak ada keterangan.'}</p>
                            <div class="d-flex gap-2 mb-3 small">
                                <span class="badge bg-light text-dark border">${jmlSoal} Butir Soal</span>
                                <span class="badge bg-warning text-dark">Total ${totPoin} Poin</span>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-emerald btn-sm flex-grow-1 fw-semibold" onclick="window.activeBankSoalId='${b.id}'; bukaMenu('soal');">
                                    <i class="bi bi-list-task me-1"></i>Kelola Butir Soal
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick='formBankSoal(${JSON.stringify(b).replace(/'/g, "&#39;")})'><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="hapusData('quiz_banks','${b.id}','soal')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
}

window.formBankSoal = async (item = null) => {
    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    document.getElementById('modalDashboardTitle').innerText = item ? 'Ubah Nama Bank Soal' : 'Buat Bank Soal / Mata Pelajaran Baru';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fBankSoal">
            <div class="mb-3">
                <label class="small fw-semibold">Ditujukan untuk Kelas / Program</label>
                <select id="bs_paket" class="form-select" required>
                    ${(pakets || []).map(p => `<option value="${p.id}" ${item?.paket_id === p.id ? 'selected' : ''}>${p.nama_paket}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label class="small fw-semibold">Nama Bank Soal / Mata Pelajaran</label>
                <input type="text" id="bs_nama" class="form-control" placeholder="Contoh: Bahasa Indonesia / Tajwid Bab 1" value="${item?.nama_bank_soal || ''}" required>
            </div>
            <div class="mb-3">
                <label class="small fw-semibold">Keterangan Singkat (Opsional)</label>
                <textarea id="bs_desc" class="form-control" rows="2">${item?.deskripsi || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-emerald w-100 fw-bold">Simpan Bank Soal</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fBankSoal').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            paket_id: document.getElementById('bs_paket').value,
            guru_id: currentUser.id,
            nama_bank_soal: document.getElementById('bs_nama').value.trim(),
            deskripsi: document.getElementById('bs_desc').value.trim()
        };
        if (item) await db.from('quiz_banks').update(payload).eq('id', item.id);
        else await db.from('quiz_banks').insert([payload]);

        modalDash.hide();
        Popup.toast('Bank soal disimpan');
        bukaMenu('soal');
    };
};

async function renderDetailButirSoal(container, bankId) {
    const { data: bank } = await db.from('quiz_banks').select(`*, packages(nama_paket)`).eq('id', bankId).single();
    const { data: soals } = await db.from('quizzes').select('*').eq('bank_soal_id', bankId).order('nomor', { ascending: true });
    const totalPoin = (soals || []).reduce((acc, q) => acc + (parseInt(q.poin) || 0), 0);

    container.innerHTML = `
        <div class="p-3">
            <button class="btn btn-outline-secondary btn-sm mb-3" onclick="window.activeBankSoalId=null; bukaMenu('soal');">
                <i class="bi bi-arrow-left me-1"></i>Kembali ke Daftar Bank Soal
            </button>
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <span class="badge bg-success-subtle text-success mb-1">${bank?.packages?.nama_paket || '-'}</span>
                    <h4 class="fw-bold mb-1">Bank Soal: ${bank?.nama_bank_soal || ''}</h4>
                    <span class="badge bg-emerald">Total: ${totalPoin} Poin (${(soals || []).length} Butir Soal)</span>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-success fw-semibold" onclick="downloadTemplateExcel()">
                        <i class="bi bi-download me-1"></i>Unduh Format Excel
                    </button>
                    <button class="btn btn-success fw-semibold" onclick="triggerImportExcel('${bank.paket_id}', '${bank.id}')">
                        <i class="bi bi-file-earmark-arrow-up me-1"></i>Impor Excel + Gambar
                    </button>
                    <button class="btn btn-warning fw-bold text-dark" onclick="exportSoalKeExcel('${bank.id}', '${bank.nama_bank_soal.replace(/'/g, "\\'")}')">
                        <i class="bi bi-file-earmark-excel me-1"></i>Ekspor Soal + Gambar
                    </button>
                    <button class="btn btn-emerald" onclick="formSoalManual('${bank.paket_id}', '${bank.id}')">
                        <i class="bi bi-plus-lg me-1"></i>Tambah Manual
                    </button>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>No</th><th>Gambar</th><th>Pertanyaan</th><th>Opsi Pilihan Ganda</th><th>Jenis</th><th>Kunci</th><th>Poin</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${(!soals || soals.length === 0) ? `<tr><td colspan="8" class="text-center text-muted py-4">Belum ada butir soal di bank soal ini.</td></tr>` : soals.map(q => `
                                <tr>
                                    <td class="fw-bold">${q.nomor}</td>
                                    <td>${q.gambar_url ? `<img src="${q.gambar_url}" style="width:60px; height:45px; object-fit:cover;" class="rounded border">` : '-'}</td>
                                    <td>${q.soal}</td>
                                    <td class="small text-muted">${q.jenis_soal === 'PG' ? q.opsi_pg : '<em>(Soal Uraian)</em>'}</td>
                                    <td><span class="badge ${q.jenis_soal === 'PG' ? 'bg-primary' : 'bg-info text-dark'}">${q.jenis_soal === 'PG' ? 'Pilihan Ganda' : 'Uraian'}</span></td>
                                    <td class="fw-bold">${q.jenis_soal === 'PG' ? q.kunci_jawaban : '-'}</td>
                                    <td><span class="badge bg-warning text-dark">${q.poin} Poin</span></td>
                                    <td><button class="btn btn-sm btn-outline-danger" onclick="hapusData('quizzes','${q.id}','soal')"><i class="bi bi-trash"></i></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.triggerImportExcel = (paketId, bankSoalId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            Popup.loading('Membaca berkas Excel & mengunggah gambar...');
            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            const worksheet = workbook.worksheets[0];

            const rowImageMap = {};
            for (const img of worksheet.getImages()) {
                const media = workbook.model.media.find(m => m.index === img.imageId);
                if (media) {
                    const rowNumber = Math.floor(img.range.tl.nativeRow) + 1;
                    const blob = new Blob([media.buffer], { type: `image/${media.extension}` });
                    blob.name = `soal_baris_${rowNumber}.${media.extension}`;
                    rowImageMap[rowNumber] = await uploadKeBucket(blob, 'quiz_images');
                }
            }

            const payloadInsert = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nomor = parseInt(row.getCell(1).value) || rowNumber - 1;
                const soal = (row.getCell(2).value || '').toString().trim();
                const opsiRaw = (row.getCell(3).value || '').toString().trim();
                const jenisRaw = (row.getCell(4).value || 'PG').toString().trim().toUpperCase();
                const kunciRaw = (row.getCell(5).value || '').toString().trim().toUpperCase();
                const poin = parseInt(row.getCell(6).value) || 10;
                if (!soal) return;

                const jenis_soal = (jenisRaw === 'ESSAY' || jenisRaw === 'URAIAN') ? 'ESSAY' : 'PG';
                payloadInsert.push({
                    paket_id: paketId,
                    bank_soal_id: bankSoalId,
                    guru_id: currentUser.id,
                    nomor,
                    soal,
                    opsi_pg: jenis_soal === 'PG' ? opsiRaw : '',
                    jenis_soal,
                    kunci_jawaban: jenis_soal === 'PG' ? kunciRaw : '',
                    poin,
                    gambar_url: rowImageMap[rowNumber] || ''
                });
            });

            if (payloadInsert.length === 0) return Popup.error('Data Kosong', 'Tidak ada soal yang ditemukan pada berkas Excel.');
            const { error } = await db.from('quizzes').insert(payloadInsert);
            if (error) throw error;

            Popup.success('Impor Berhasil!', `${payloadInsert.length} butir soal berhasil masuk ke Bank Soal ini.`);
            bukaMenu('soal');
        } catch (err) {
            Popup.error('Gagal Impor Excel', err.message);
        }
    };
    input.click();
};

window.exportSoalKeExcel = async (bankSoalId, namaBank = 'Bank_Soal') => {
    try {
        Popup.loading('Mengekspor soal & menyematkan gambar ke Excel...');
        const { data: soals } = await db.from('quizzes').select('*').eq('bank_soal_id', bankSoalId).order('nomor', { ascending: true });
        if (!soals || soals.length === 0) return Popup.error('Kosong', 'Belum ada soal untuk diekspor.');

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Data Soal');
        sheet.columns = [
            { header: 'nomor', key: 'nomor', width: 8 },
            { header: 'soal', key: 'soal', width: 40 },
            { header: 'opsi pilihan ganda', key: 'opsi', width: 45 },
            { header: 'jenis soal', key: 'jenis', width: 15 },
            { header: 'kunci jawaban', key: 'kunci', width: 15 },
            { header: 'poin', key: 'poin', width: 10 },
            { header: 'gambar', key: 'gambar', width: 25 }
        ];
        sheet.getRow(1).font = { bold: true };

        for (let i = 0; i < soals.length; i++) {
            const q = soals[i];
            const row = sheet.addRow({
                nomor: q.nomor,
                soal: q.soal,
                opsi: q.jenis_soal === 'PG' ? q.opsi_pg : '',
                jenis: q.jenis_soal,
                kunci: q.jenis_soal === 'PG' ? q.kunci_jawaban : '',
                poin: q.poin
            });

            if (q.gambar_url) {
                try {
                    const resp = await fetch(q.gambar_url);
                    const buf = await resp.arrayBuffer();
                    const imgId = workbook.addImage({ buffer: buf, extension: 'png' });
                    row.height = 75;
                    sheet.addImage(imgId, { tl: { col: 6, row: i + 1 }, ext: { width: 110, height: 80 } });
                } catch {
                    row.getCell(7).value = q.gambar_url;
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Ekspor_${namaBank.replace(/\s+/g, '_')}.xlsx`;
        a.click();
        Swal.close();
    } catch (err) {
        Popup.error('Gagal Ekspor', err.message);
    }
};

window.formSoalManual = (paketId, bankSoalId) => {
    document.getElementById('modalDashboardTitle').innerText = 'Tambah Butir Soal Manual';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fSoalManual">
            <div class="row">
                <div class="col-md-3 mb-2"><label class="small fw-semibold">Nomor</label><input type="number" id="qm_no" class="form-control" value="1" required></div>
                <div class="col-md-5 mb-2">
                    <label class="small fw-semibold">Jenis Soal</label>
                    <select id="qm_jenis" class="form-select" onchange="document.getElementById('wrap-opsi-pg').style.display = this.value === 'PG' ? 'block' : 'none'">
                        <option value="PG">Pilihan Ganda (PG)</option>
                        <option value="ESSAY">Uraian (Essay)</option>
                    </select>
                </div>
                <div class="col-md-4 mb-2"><label class="small fw-semibold">Poin Soal</label><input type="number" id="qm_poin" class="form-control" value="10" required></div>
            </div>
            <div class="mb-2"><label class="small fw-semibold">Pertanyaan</label><textarea id="qm_soal" class="form-control" rows="2" required></textarea></div>
            <div class="mb-2"><label class="small fw-semibold">Unggah Gambar Soal (Opsional)</label><input type="file" id="qm_file" class="form-control" accept="image/*"></div>
            <div id="wrap-opsi-pg">
                <div class="mb-2"><label class="small fw-semibold">Opsi Pilihan Ganda (Pisahkan tanda | )</label><input type="text" id="qm_opsi" class="form-control" placeholder="A. Izhar | B. Idgham | C. Iqlab | D. Ikhfa"></div>
                <div class="mb-3"><label class="small fw-semibold">Kunci Jawaban</label><select id="qm_kunci" class="form-select"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
            </div>
            <button type="submit" class="btn btn-emerald w-100 mt-2">Simpan Soal</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fSoalManual').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan soal...');
            let gambar_url = '';
            const f = document.getElementById('qm_file').files[0];
            if (f) gambar_url = await uploadKeBucket(f, 'quiz_images');
            const jenis = document.getElementById('qm_jenis').value;

            await db.from('quizzes').insert([{
                paket_id: paketId,
                bank_soal_id: bankSoalId,
                guru_id: currentUser.id,
                nomor: parseInt(document.getElementById('qm_no').value),
                soal: document.getElementById('qm_soal').value,
                jenis_soal: jenis,
                opsi_pg: jenis === 'PG' ? document.getElementById('qm_opsi').value : '',
                kunci_jawaban: jenis === 'PG' ? document.getElementById('qm_kunci').value : '',
                poin: parseInt(document.getElementById('qm_poin').value) || 10,
                gambar_url
            }]);
            modalDash.hide();
            Popup.toast('Butir soal ditambahkan');
            bukaMenu('soal');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

// 1. Download Format Excel Sesuai Permintaan: nomor, soal, opsi pilihan ganda, jenis soal, kunci jawaban, poin
window.downloadTemplateExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Format Soal');

    sheet.columns = [
        { header: 'nomor', key: 'nomor', width: 8 },
        { header: 'soal', key: 'soal', width: 40 },
        { header: 'opsi pilihan ganda', key: 'opsi', width: 45 },
        { header: 'jenis soal', key: 'jenis', width: 15 },
        { header: 'kunci jawaban', key: 'kunci', width: 15 },
        { header: 'poin', key: 'poin', width: 10 },
        { header: 'gambar (tempel di sel ini)', key: 'gambar', width: 25 }
    ];

    sheet.addRow({
        nomor: 1,
        soal: 'Hukum bacaan nun mati bertemu huruf Ba disebut...',
        opsi: 'A. Izhar | B. Idgham | C. Iqlab | D. Ikhfa',
        jenis: 'PG',
        kunci: 'C',
        poin: 20
    });

    sheet.addRow({
        nomor: 2,
        soal: 'Jelaskan cara membaca Mad Wajib Muttashil beserta contohnya!',
        opsi: '',
        jenis: 'ESSAY',
        kunci: '',
        poin: 30
    });

    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Format_Soal_NgajiPintar.xlsx';
    link.click();
};


/* ============================================================================
   BAGIAN 4: GURU - KOREKSI & PENILAIAN JAWABAN ESSAY SISWA
   ============================================================================ */
async function renderKoreksiGuru(container) {
    const { data } = await db.from('quiz_submissions').select(`*, users(nama, email), packages(nama_paket)`).order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="p-3">
            <h4 class="fw-bold mb-3">Penilaian & Koreksi Jawaban Siswa (PG & Essay)</h4>
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>Nama Siswa</th><th>Paket Kelas</th><th>Skor Saat Ini</th><th>Status Penilaian</th><th>Aksi Guru</th></tr>
                        </thead>
                        <tbody>
                            ${(data || []).map(sub => `
                                <tr>
                                    <td><div class="fw-bold">${sub.users?.nama || '-'}</div><small class="text-muted">${sub.users?.email || ''}</small></td>
                                    <td>${sub.packages?.nama_paket || '-'}</td>
                                    <td><span class="fw-bold fs-6 text-success">${sub.skor_akhir}</span> / ${sub.total_poin_paket} Poin</td>
                                    <td><span class="badge ${sub.status_nilai === 'Selesai Dinilai' ? 'bg-success' : 'bg-warning text-dark'}">${sub.status_nilai}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-emerald" onclick='bukaModalKoreksi(${JSON.stringify(sub).replace(/'/g, "&#39;")})'>
                                            <i class="bi bi-pencil-square me-1"></i>Lihat & Nilai Essay
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.bukaModalKoreksi = (sub) => {
    const detail = sub.detail_jawaban || [];
    document.getElementById('modalDashboardTitle').innerText = `Koreksi Jawaban: ${sub.users?.nama || 'Siswa'}`;
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="formSimpanNilaiGuru">
            ${detail.map((item, idx) => `
                <div class="p-3 mb-3 rounded-3 border ${item.jenis_soal === 'ESSAY' ? 'border-warning bg-warning-subtle' : 'bg-light'}">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="fw-bold">Soal No. ${item.nomor} (${item.jenis_soal})</span>
                        <span class="badge bg-dark">Poin Maksimal: ${item.poin_maks}</span>
                    </div>
                    <p class="mb-2">${item.soal}</p>
                    ${item.gambar_url ? `<img src="${item.gambar_url}" class="img-fluid rounded mb-2" style="max-height:140px;">` : ''}
                    <div class="p-2 bg-white rounded border mb-2">
                        <small class="text-muted d-block">Jawaban Siswa:</small>
                        <strong>${item.jawaban_siswa || '(Tidak dijawab)'}</strong>
                        ${item.jenis_soal === 'PG' ? `<span class="ms-2 small text-success">(Kunci: ${item.kunci_jawaban})</span>` : ''}
                    </div>
                    <div>
                        <label class="small fw-bold">Berikan Poin (0 s/d ${item.poin_maks}):</label>
                        <input type="number" class="form-control form-control-sm input-poin-koreksi" data-idx="${idx}" min="0" max="${item.poin_maks}" value="${item.poin_didapat || 0}" required>
                    </div>
                </div>
            `).join('')}
            <button type="submit" class="btn btn-emerald w-100 py-2 fw-bold">Simpan Hasil Penilaian</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('formSimpanNilaiGuru').onsubmit = async (e) => {
        e.preventDefault();
        let totalSkor = 0;
        document.querySelectorAll('.input-poin-koreksi').forEach(inp => {
            const idx = parseInt(inp.dataset.idx);
            const nilai = parseInt(inp.value) || 0;
            detail[idx].poin_didapat = nilai;
            totalSkor += nilai;
        });

        await db.from('quiz_submissions').update({
            detail_jawaban: detail,
            skor_akhir: totalSkor,
            status_nilai: 'Selesai Dinilai'
        }).eq('id', sub.id);

        modalDash.hide();
        Popup.success('Penilaian Disimpan!', `Total skor siswa menjadi ${totalSkor} Poin.`);
        bukaMenu('koreksi');
    };
};

/* ============================================================================
   BAGIAN 5: GURU - MATERI LIVE ZOOM / VIDEO & ARTIKEL (UPLOAD KE BUCKET)
   ============================================================================ */
// Fungsi Pemutar Video Langsung di Browser (Tanpa Mengunduh)
window.putarVideoDiBrowser = (url, judul) => {
    let kontenVideo = '';
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtu.be/')
            ? url.split('youtu.be/')[1].split('?')[0]
            : new URLSearchParams(new URL(url).search).get('v');
        kontenVideo = `<div class="ratio ratio-16x9"><iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen class="rounded-3"></iframe></div>`;
    } else {
        kontenVideo = `
            <video controls autoplay playsinline controlsList="nodownload" style="width:100%; max-height:70vh; border-radius:12px; background:#000;">
                <source src="${url}" type="video/mp4">
                Peramban Anda tidak mendukung pemutar video ini.
            </video>
        `;
    }

    document.getElementById('modalDashboardTitle').innerHTML = `<i class="bi bi-play-btn-fill me-2"></i>${judul}`;
    document.getElementById('modalDashboardBody').innerHTML = kontenVideo;
    modalDash.show();

    // Hentikan video otomatis saat modal ditutup
    document.getElementById('modalDashboard').addEventListener('hidden.bs.modal', () => {
        document.getElementById('modalDashboardBody').innerHTML = '';
    }, { once: true });
};

async function renderMateriGuru(container) {
    const { data } = await db.from('materials').select(`*, packages(nama_paket)`).order('created_at', { ascending: false });
    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0">Kelola Sesi Langsung (Zoom/Tatap Muka) & Video Materi</h4>
                <button class="btn btn-emerald" onclick="formMateri()"><i class="bi bi-plus-lg me-1"></i>Tambah Materi / Jadwal</button>
            </div>
            <div class="row g-3">
                ${(data || []).map(m => {
                    const isVideo = m.kategori === 'Video Rekaman';
                    return `
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4 p-3 h-100">
                            <div class="d-flex justify-content-between align-items-start gap-2">
                                <div class="d-flex align-items-center gap-3">
                                    ${isVideo ? `
                                        <button type="button" onclick="putarVideoDiBrowser('${m.link_url}', '${m.judul.replace(/'/g, "\\'")}')" class="btn btn-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:50px; height:50px;">
                                            <i class="bi bi-play-fill fs-4"></i>
                                        </button>
                                    ` : `
                                        <a href="${m.link_url}" target="_blank" class="btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:50px; height:50px;">
                                            <i class="bi bi-camera-video-fill fs-5"></i>
                                        </a>
                                    `}
                                    <div>
                                        <span class="badge ${isVideo ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} mb-1">
                                            ${isVideo ? '<i class="bi bi-film me-1"></i>Video Materi' : '<i class="bi bi-broadcast me-1"></i>Sesi Langsung / Tatap Muka'}
                                        </span>
                                        <h6 class="fw-bold mb-0">${m.judul}</h6>
                                        <small class="text-muted d-block">${m.packages?.nama_paket || '-'}</small>
                                        ${!isVideo ? `<small class="text-danger fw-semibold"><i class="bi bi-calendar-event me-1"></i>${formatTanggalIndo(m.jadwal_atau_lokasi)}</small>` : ''}
                                    </div>
                                </div>
                                <div class="text-end">
                                    <div class="font-arab text-success mb-1">${m.teks_arab || ''}</div>
                                    <button class="btn btn-sm btn-outline-danger" onclick="hapusData('materials','${m.id}','materi')"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
}

window.aturTampilanFormMateri = () => {
    const kat = document.getElementById('m_kat').value;
    const isVideo = kat === 'Video Rekaman';
    document.getElementById('grup-live-zoom').classList.toggle('d-none', isVideo);
    document.getElementById('grup-upload-video').classList.toggle('d-none', !isVideo);
};

window.formMateri = async () => {
    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    document.getElementById('modalDashboardTitle').innerText = 'Tambah Sesi Langsung / Unggah Video';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fMateri">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="small fw-semibold">Pilih Paket Kelas</label>
                    <select id="m_paket" class="form-select" required>
                        ${(pakets || []).map(p => `<option value="${p.id}">${p.nama_paket}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="small fw-semibold">Kategori Materi</label>
                    <select id="m_kat" class="form-select" onchange="aturTampilanFormMateri()">
                        <option value="Live Zoom / Tatap Muka">Sesi Langsung (Zoom / Tatap Muka)</option>
                        <option value="Video Rekaman">Unggah Materi Video</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8 mb-3"><label class="small fw-semibold">Judul Materi / Pertemuan</label><input type="text" id="m_judul" class="form-control" placeholder="Contoh: Tahsin Surah Al-Fatihah" required></div>
                <div class="col-md-4 mb-3"><label class="small fw-semibold">Teks Arab (Opsional)</label><input type="text" id="m_arab" class="form-control" value="سُورَةُ الفَاتِحَة"></div>
            </div>

            <!-- Tampil OTOMATIS saat pilih Sesi Langsung (Zoom / Tatap Muka) -->
            <div id="grup-live-zoom">
                <div class="mb-3">
                    <label class="small fw-semibold">Tanggal & Jam Pertemuan</label>
                    <input type="datetime-local" id="m_jadwal" class="form-control">
                </div>
                <div class="mb-3">
                    <label class="small fw-semibold">Tautan Zoom / Google Meet (atau Lokasi Peta)</label>
                    <input type="url" id="m_url" class="form-control" placeholder="https://zoom.us/j/...">
                </div>
            </div>

            <!-- Tampil OTOMATIS saat pilih Unggah Materi Video -->
            <div id="grup-upload-video" class="d-none">
                <div class="mb-3">
                    <label class="small fw-semibold">Unggah Berkas Video (MP4/WebM langsung ke Penyimpanan)</label>
                    <input type="file" id="m_file" class="form-control" accept="video/mp4,video/webm,video/*">
                </div>
                <div class="mb-3">
                    <label class="small fw-semibold">Atau Tautan Video YouTube (Opsional jika tidak unggah berkas)</label>
                    <input type="url" id="m_yt" class="form-control" placeholder="https://www.youtube.com/watch?v=...">
                </div>
            </div>

            <button type="submit" class="btn btn-emerald w-100 fw-bold">Simpan Materi</button>
        </form>
    `;
    modalDash.show();
    aturTampilanFormMateri();

    document.getElementById('fMateri').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan materi...');
            const kat = document.getElementById('m_kat').value;
            const isVideo = kat === 'Video Rekaman';
            let link_url = '';
            let jadwal = '';

            if (isVideo) {
                const f = document.getElementById('m_file').files[0];
                const yt = document.getElementById('m_yt').value.trim();
                if (f) link_url = await uploadKeBucket(f, 'class_videos');
                else if (yt) link_url = yt;
                else return Popup.error('Video Kosong', 'Silakan unggah berkas video atau masukkan tautan YouTube.');
            } else {
                jadwal = document.getElementById('m_jadwal').value;
                link_url = document.getElementById('m_url').value.trim();
                if (!jadwal || !link_url) return Popup.error('Data Belum Lengkap', 'Tanggal pertemuan dan tautan Zoom wajib diisi.');
            }

            await db.from('materials').insert([{
                paket_id: document.getElementById('m_paket').value,
                guru_id: currentUser.id,
                judul: document.getElementById('m_judul').value,
                teks_arab: document.getElementById('m_arab').value,
                kategori: kat,
                jadwal_atau_lokasi: jadwal,
                link_url: link_url
            }]);
            modalDash.hide();
            Popup.toast('Materi berhasil ditambahkan');
            bukaMenu('materi');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

async function renderArtikelCRUD(container) {
    const { data } = await db.from('articles').select('*').order('created_at', { ascending: false });
    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0">Kelola Artikel Blog</h4>
                <button class="btn btn-emerald" onclick="formArtikel()"><i class="bi bi-plus-lg me-1"></i>Tulis Artikel</button>
            </div>
            <div class="row g-3">
                ${(data || []).map(a => `
                    <div class="col-md-4">
                        <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            ${a.gambar_url ? `<img src="${a.gambar_url}" style="height:140px; object-fit:cover;">` : ''}
                            <div class="card-body">
                                <span class="badge bg-emerald mb-1">${a.kategori}</span>
                                <h6 class="fw-bold">${a.judul}</h6>
                                <button class="btn btn-sm btn-outline-danger mt-2" onclick="hapusData('articles','${a.id}','artikel')">Hapus</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.formArtikel = () => {
    document.getElementById('modalDashboardTitle').innerText = 'Tulis Artikel Baru';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fArt">
            <div class="mb-2"><label>Judul Artikel</label><input type="text" id="a_judul" class="form-control" required></div>
            <div class="mb-2"><label>Kategori</label><input type="text" id="a_kat" class="form-control" value="Tajwid & Tahsin" required></div>
            <div class="mb-2"><label>Upload Gambar Artikel (Bucket)</label><input type="file" id="a_file" class="form-control" accept="image/*"></div>
            <div class="mb-3"><label>Isi Konten</label><textarea id="a_isi" class="form-control" rows="5" required></textarea></div>
            <button type="submit" class="btn btn-emerald w-100">Publikasikan</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fArt').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan artikel...');
            let gambar_url = '';
            const f = document.getElementById('a_file').files[0];
            if (f) gambar_url = await uploadKeBucket(f, 'articles');

            await db.from('articles').insert([{
                penulis_id: currentUser.id,
                judul: document.getElementById('a_judul').value,
                kategori: document.getElementById('a_kat').value,
                konten: document.getElementById('a_isi').value,
                gambar_url
            }]);
            modalDash.hide();
            Popup.toast('Artikel dipublikasikan');
            bukaMenu('artikel');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
};

/* ============================================================================
   BAGIAN 6: TAMPILAN SISWA DEEN CONNECT (RESPONSIF DESKTOP, TABLET, MOBILE)
   ============================================================================ */
// Halaman Guru: Terima / Tolak Pemesanan Jadwal Mengaji dari Siswa
async function renderPermintaanJadwalGuru(container) {
    const { data } = await db.from('bookings')
        .select(`*, users!bookings_siswa_id_fkey(nama, no_wa)`)
        .eq('guru_id', currentUser.id)
        .order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="p-3">
            <h4 class="fw-bold mb-3">Permintaan Pesanan Jadwal Mengaji Siswa</h4>
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>Siswa</th><th>Waktu Diajukan</th><th>Metode</th><th>Catatan</th><th>Status</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${(!data || data.length === 0) ? `<tr><td colspan="6" class="text-center text-muted py-4">Belum ada pesanan jadwal masuk.</td></tr>` : data.map(b => `
                                <tr>
                                    <td><div class="fw-bold">${b.users?.nama || '-'}</div><small class="text-muted">WA: ${b.users?.no_wa || '-'}</small></td>
                                    <td class="fw-semibold">${formatTanggalIndo(b.tanggal_jam)}</td>
                                    <td><span class="badge bg-info-subtle text-dark">${b.metode}</span></td>
                                    <td class="small">${b.catatan || '-'}</td>
                                    <td><span class="badge ${b.status === 'Disetujui' ? 'bg-success' : (b.status === 'Ditolak' ? 'bg-danger' : 'bg-warning text-dark')}">${b.status}</span></td>
                                    <td>
                                        ${b.status === 'Menunggu Konfirmasi' ? `
                                            <button class="btn btn-sm btn-success" onclick="ubahStatusBooking('${b.id}','Disetujui')">Setujui</button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="ubahStatusBooking('${b.id}','Ditolak')">Tolak</button>
                                        ` : '<span class="small text-muted">Selesai</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.ubahStatusBooking = async (id, statusBaru) => {
    await db.from('bookings').update({ status: statusBaru }).eq('id', id);
    Popup.toast(`Jadwal berhasil ${statusBaru.toLowerCase()}`);
    bukaMenu('permintaan_jadwal');
};

// =========================================================================
// TAMPILAN SISWA (100% BAHASA INDONESIA, VIDEO LANGSUNG, PROFIL, PEMESANAN)
// =========================================================================
async function renderSiswaHome(container) {
    const { data: gurus } = await db.from('users').select('*').eq('role', 'guru');
    const { data: materis } = await db.from('materials').select(`*, packages(nama_paket), users(nama)`).order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="deen-header mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 class="fw-bold mb-0">Ruang Belajar Mengaji</h3>
                    <small class="opacity-75">Assalamu'alaikum, ${currentUser.nama}</small>
                </div>
                <img src="${currentUser.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}"
                     onclick="bukaMenu('siswa_profil')"
                     title="Ubah Profil Saya"
                     class="rounded-circle border border-2 border-white"
                     style="width:48px; height:48px; object-fit:cover; cursor:pointer;">
            </div>
            <div class="deen-search-box">
                <i class="bi bi-search text-muted"></i>
                <input type="text" placeholder="Cari materi video atau jadwal sesi..." oninput="filterMateriSiswa(this.value)">
            </div>
        </div>

        <div class="px-3">
            <div class="bg-white p-3 rounded-4 shadow-sm mb-4">
                <h6 class="fw-bold mb-3">Pengajar Pilihan</h6>
                <div class="d-flex gap-4 overflow-auto pb-2">
                    ${(gurus || []).map(g => `
                        <div class="text-center flex-shrink-0" onclick='bukaProfilTutorSiswa(${JSON.stringify(g).replace(/'/g, "&#39;")})'>
                            <img src="${g.avatar_url}" class="tutor-avatar-circle mb-1">
                            <div class="small fw-semibold text-dark">${g.nama.split(' ')[0]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <h6 class="fw-bold mb-3">Materi Video & Sesi Mengaji</h6>
            <div id="list-materi-deen" class="row g-3">
                ${(materis || []).map(m => {
                    const isVideo = m.kategori === 'Video Rekaman';
                    return `
                    <div class="col-12 col-md-6 item-materi-deen" data-title="${m.judul.toLowerCase()}">
                        <div class="recitation-card">
                            <div class="d-flex align-items-center gap-3">
                                ${isVideo ? `
                                    <button type="button" onclick="putarVideoDiBrowser('${m.link_url}', '${m.judul.replace(/'/g, "\\'")}')" class="btn btn-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px; height:48px;" title="Tonton Video">
                                        <i class="bi bi-play-fill fs-4"></i>
                                    </button>
                                ` : `
                                    <a href="${m.link_url}" target="_blank" class="btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:48px; height:48px;" title="Gabung Sesi Zoom / Tatap Muka">
                                        <i class="bi bi-camera-video-fill fs-5"></i>
                                    </a>
                                `}
                                <div>
                                    <span class="badge ${isVideo ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} mb-1">
                                        ${isVideo ? 'Video Materi' : 'Sesi Langsung (Zoom/Tatap Muka)'}
                                    </span>
                                    <h6 class="fw-bold mb-0">${m.judul}</h6>
                                    <small class="text-muted">${isVideo ? 'Klik tombol putar untuk menonton langsung' : formatTanggalIndo(m.jadwal_atau_lokasi)}</small>
                                </div>
                            </div>
                            <div class="font-arab text-dark">${m.teks_arab || ''}</div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
}

async function renderSiswaTutorList(container) {
    const { data: gurus } = await db.from('users').select('*').eq('role', 'guru');
    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-3">Daftar Pengajar</h4>
            <div class="deen-search-box">
                <i class="bi bi-search text-muted"></i>
                <input type="text" placeholder="Cari nama pengajar..." oninput="
                    const val = this.value.toLowerCase();
                    document.querySelectorAll('.tutor-card-item').forEach(el => el.style.display = el.dataset.name.includes(val) ? 'block' : 'none');
                ">
            </div>
        </div>
        <div class="px-3">
            <div class="row g-3">
                ${(gurus || []).map(g => `
                    <div class="col-12 col-md-6 col-xl-4 tutor-card-item" data-name="${g.nama.toLowerCase()}">
                        <div class="tutor-list-card">
                            <div>
                                <h6 class="fw-bold mb-1">${g.nama}</h6>
                                <p class="small text-muted mb-2">${g.bio || ''}</p>
                                <div class="d-flex align-items-center gap-2">
                                    <button class="btn-book-green" onclick='bukaProfilTutorSiswa(${JSON.stringify(g).replace(/'/g, "&#39;")})'>Lihat & Pesan</button>
                                    <span class="small fw-bold"><i class="bi bi-star-fill text-warning"></i> ${g.rating || '4.9'}</span>
                                </div>
                            </div>
                            <img src="${g.avatar_url}">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.bukaProfilTutorSiswa = (g) => {
    document.getElementById('modalDashboardTitle').innerText = 'Profil Pengajar';
    document.getElementById('modalDashboardBody').innerHTML = `
        <div class="text-center">
            <img src="${g.avatar_url}" class="rounded-circle shadow mb-3" style="width:110px; height:110px; object-fit:cover;">
            <h4 class="fw-bold mb-0">${g.nama}</h4>
            <p class="text-success fw-semibold small mb-1">${g.spesialisasi || 'Pengajar Al-Quran'}</p>
            <div class="mb-3"><span class="fw-bold text-warning"><i class="bi bi-star-fill"></i> ${g.rating || '4.9'}</span> | Pengajar Terverifikasi</div>
            <p class="small text-secondary px-2">${g.bio || '-'}</p>

            <div class="bg-light p-3 rounded-4 text-start mb-3">
                <h6 class="fw-bold small mb-2">Bahasa Pengantar</h6>
                <div class="d-flex gap-2 flex-wrap">
                    ${(g.bahasa || 'Indonesia, Arab').split(',').map(b => `<span class="badge bg-white text-dark border rounded-pill px-3 py-2">${b.trim()}</span>`).join('')}
                </div>
            </div>

            <div class="bg-success-subtle p-3 rounded-4 text-start mb-4">
                <h6 class="fw-bold small mb-1 text-success"><i class="bi bi-calendar-check me-1"></i>Jadwal Tersedia Pengajar</h6>
                <div class="small fw-semibold text-dark">Hari: ${g.hari_tersedia || 'Senin - Jumat'}</div>
                <div class="small text-muted">Jam: ${g.jam_tersedia || '16.00 - 20.00 WIB'}</div>
            </div>

            <button class="btn-book-green w-100 py-3 fs-6 shadow" onclick="bukaFormPesanJadwal('${g.id}', '${g.nama.replace(/'/g, "\\'")}')">
                Ajukan Pesanan Jadwal Mengaji
            </button>
        </div>
    `;
    modalDash.show();
};

window.bukaFormPesanJadwal = (guruId, namaGuru) => {
    document.getElementById('modalDashboardTitle').innerText = `Pesan Jadwal: ${namaGuru}`;
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="formPesanJadwalSiswa">
            <div class="mb-3">
                <label class="small fw-semibold">Pilih Tanggal & Jam Mengaji</label>
                <input type="datetime-local" id="bk_tgl" class="form-control" required>
            </div>
            <div class="mb-3">
                <label class="small fw-semibold">Metode Pertemuan</label>
                <select id="bk_metode" class="form-select">
                    <option value="Daring (Zoom)">Daring via Zoom</option>
                    <option value="Tatap Muka">Tatap Muka (Langsung)</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="small fw-semibold">Catatan / Materi yang Ingin Dipelajari</label>
                <textarea id="bk_catatan" class="form-control" rows="2" placeholder="Contoh: Setoran hafalan Juz 30"></textarea>
            </div>
            <button type="submit" class="btn btn-emerald w-100 fw-bold py-2">Kirim Permintaan Jadwal</button>
        </form>
    `;
    document.getElementById('formPesanJadwalSiswa').onsubmit = async (e) => {
        e.preventDefault();
        await db.from('bookings').insert([{
            siswa_id: currentUser.id,
            guru_id: guruId,
            tanggal_jam: document.getElementById('bk_tgl').value,
            metode: document.getElementById('bk_metode').value,
            catatan: document.getElementById('bk_catatan').value,
            status: 'Menunggu Konfirmasi'
        }]);
        modalDash.hide();
        Popup.success('Permintaan Terkirim!', 'Pengajar akan segera mengonfirmasi jadwal Anda. Pantau statusnya di menu Jadwal.');
        bukaMenu('siswa_jadwal');
    };
};

// Kuis Siswa (Memilih Bank Soal / Mata Pelajaran)
async function renderSiswaKuis(container) {
    const { data: banks } = await db.from('quiz_banks').select(`*, packages(nama_paket)`).order('created_at', { ascending: false });
    const aktifBankId = window.siswaBankKuis || (banks && banks[0]?.id) || '';
    const bankAktif = (banks || []).find(b => b.id === aktifBankId);

    const { data: soals } = aktifBankId ? await db.from('quizzes').select('*').eq('bank_soal_id', aktifBankId).order('nomor', { ascending: true }) : { data: [] };
    const { data: riwayat } = aktifBankId ? await db.from('quiz_submissions').select('*').eq('siswa_id', currentUser.id).eq('bank_soal_id', aktifBankId).order('created_at', { ascending: false }) : { data: [] };

    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-1">Evaluasi & Kuis Kelas</h4>
            <small class="opacity-75">Pilih mata pelajaran / bank soal lalu kerjakan dengan teliti</small>
        </div>
        <div class="px-3">
            <div class="card border-0 shadow-sm rounded-4 p-3 mb-3">
                <label class="small fw-bold mb-1">Pilih Bank Soal / Mata Pelajaran:</label>
                <select class="form-select" onchange="window.siswaBankKuis = this.value; bukaMenu('siswa_kuis');">
                    ${(!banks || banks.length === 0) ? '<option value="">Belum ada bank soal tersedia</option>' : banks.map(b => `<option value="${b.id}" ${b.id === aktifBankId ? 'selected' : ''}>${b.nama_bank_soal} (${b.packages?.nama_paket || '-'})</option>`).join('')}
                </select>
            </div>

            ${riwayat && riwayat.length > 0 ? `
                <div class="alert alert-success rounded-4 shadow-sm mb-4">
                    <h6 class="fw-bold mb-1"><i class="bi bi-award-fill me-1"></i>Status Nilai Terakhir: ${riwayat[0].status_nilai}</h6>
                    <div>Total Skor: <strong class="fs-5">${riwayat[0].skor_akhir}</strong> dari ${riwayat[0].total_poin_paket} Poin</div>
                </div>
            ` : ''}

            ${!soals || soals.length === 0 ? `<div class="text-center text-muted py-4">Belum ada butir soal pada bank soal ini.</div>` : `
                <form id="formLembarKuisSiswa">
                    ${soals.map(q => {
                        const opsiList = q.jenis_soal === 'PG' ? q.opsi_pg.split('|').map(o => o.trim()).filter(Boolean) : [];
                        return `
                            <div class="card border-0 shadow-sm rounded-4 mb-3">
                                <div class="card-body p-4">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="badge bg-emerald">Soal No. ${q.nomor} (${q.jenis_soal === 'PG' ? 'Pilihan Ganda' : 'Uraian'})</span>
                                        <span class="badge bg-warning text-dark">${q.poin} Poin</span>
                                    </div>
                                    <p class="fw-semibold fs-6 mb-3">${q.soal}</p>
                                    ${q.gambar_url ? `<img src="${q.gambar_url}" class="img-fluid rounded-3 border mb-3" style="max-height:220px;">` : ''}
                                    ${q.jenis_soal === 'PG' ? `
                                        <div class="d-flex flex-column gap-2">
                                            ${opsiList.map(opt => `
                                                <label class="p-2 border rounded-3 d-flex align-items-center gap-2" style="cursor:pointer;">
                                                    <input type="radio" name="ans_${q.id}" value="${opt.charAt(0).toUpperCase()}" class="form-check-input mt-0" required>
                                                    <span>${opt}</span>
                                                </label>
                                            `).join('')}
                                        </div>
                                    ` : `<textarea name="ans_${q.id}" class="form-control" rows="3" placeholder="Tuliskan jawaban uraian Anda di sini..." required></textarea>`}
                                </div>
                            </div>
                        `;
                    }).join('')}
                    <button type="submit" class="btn btn-emerald btn-lg w-100 rounded-pill fw-bold shadow mb-4">Kirim Jawaban Kuis</button>
                </form>
            `}
        </div>
    `;

    const formEl = document.getElementById('formLembarKuisSiswa');
    if (formEl) {
        formEl.onsubmit = async (e) => {
            e.preventDefault();
            Popup.loading('Mengirim jawaban Anda...');
            let totalPoinPaket = 0, skorOtomatis = 0, adaEssay = false;

            const detail_jawaban = soals.map(q => {
                totalPoinPaket += parseInt(q.poin) || 0;
                const jwb = q.jenis_soal === 'PG'
                    ? (document.querySelector(`input[name="ans_${q.id}"]:checked`)?.value || '')
                    : (document.querySelector(`textarea[name="ans_${q.id}"]`)?.value || '');
                if (q.jenis_soal !== 'PG') adaEssay = true;

                const benarPG = q.jenis_soal === 'PG' && jwb.toUpperCase() === (q.kunci_jawaban || '').toUpperCase();
                const poinDidapat = benarPG ? (parseInt(q.poin) || 0) : 0;
                skorOtomatis += poinDidapat;

                return {
                    quiz_id: q.id, nomor: q.nomor, soal: q.soal, jenis_soal: q.jenis_soal,
                    gambar_url: q.gambar_url, jawaban_siswa: jwb, kunci_jawaban: q.kunci_jawaban,
                    poin_maks: parseInt(q.poin) || 0, poin_didapat: poinDidapat
                };
            });

            await db.from('quiz_submissions').insert([{
                paket_id: bankAktif.paket_id,
                bank_soal_id: aktifBankId,
                siswa_id: currentUser.id,
                detail_jawaban,
                total_poin_paket: totalPoinPaket,
                skor_akhir: skorOtomatis,
                status_nilai: adaEssay ? 'Menunggu Koreksi Uraian oleh Pengajar' : 'Selesai Dinilai'
            }]);

            Popup.success('Jawaban Terkirim!', adaEssay ? `Skor Pilihan Ganda sementara: ${skorOtomatis}. Soal uraian akan dinilai oleh Pengajar.` : `Skor Akhir Anda: ${skorOtomatis} dari ${totalPoinPaket} Poin.`);
            bukaMenu('siswa_kuis');
        };
    }
}

// Jadwal Sesi Langsung & Status Pesanan Jadwal Privat Siswa
async function renderSiswaJadwal(container) {
    const { data: materis } = await db.from('materials').select(`*, packages(nama_paket)`).eq('kategori', 'Live Zoom / Tatap Muka').order('created_at', { ascending: false });
    const { data: bookings } = await db.from('bookings').select(`*, users!bookings_guru_id_fkey(nama)`).eq('siswa_id', currentUser.id).order('created_at', { ascending: false });

    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-1">Jadwal Sesi & Pesanan Privat</h4>
            <small class="opacity-75">Pantau jadwal kelas Zoom/tatap muka dan status pesanan jadwal Anda</small>
        </div>
        <div class="px-3">
            <h6 class="fw-bold mb-3">Status Pesanan Jadwal Privat Saya</h6>
            <div class="row g-3 mb-4">
                ${(!bookings || bookings.length === 0) ? `<div class="col-12 small text-muted">Belum ada pesanan jadwal privat. Buka menu Pengajar untuk memesan jadwal.</div>` : bookings.map(b => `
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4 p-3">
                            <div class="d-flex justify-content-between mb-1">
                                <strong class="text-dark">${b.users?.nama || 'Pengajar'}</strong>
                                <span class="badge ${b.status === 'Disetujui' ? 'bg-success' : (b.status === 'Ditolak' ? 'bg-danger' : 'bg-warning text-dark')}">${b.status}</span>
                            </div>
                            <div class="small text-success fw-semibold"><i class="bi bi-calendar-event me-1"></i>${formatTanggalIndo(b.tanggal_jam)}</div>
                            <div class="small text-muted">Metode: ${b.metode} • ${b.catatan || '-'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <h6 class="fw-bold mb-3">Jadwal Sesi Langsung Kelas (Zoom / Tatap Muka)</h6>
            <div class="row g-3">
                ${(materis || []).map(m => `
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4 p-3">
                            <span class="badge bg-primary-subtle text-primary align-self-start mb-2">${m.packages?.nama_paket || 'Kelas Mengaji'}</span>
                            <h6 class="fw-bold mb-1">${m.judul}</h6>
                            <p class="small text-danger fw-semibold mb-3"><i class="bi bi-calendar-event me-1"></i>${formatTanggalIndo(m.jadwal_atau_lokasi)}</p>
                            <a href="${m.link_url}" target="_blank" class="btn btn-primary btn-sm rounded-pill fw-semibold py-2">
                                <i class="bi bi-camera-video-fill me-1"></i>Gabung Sesi Langsung
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Halaman Profil Siswa (Ubah Foto Profil, Nama, & Identitas Diri) - Poin 7
async function renderSiswaProfil(container) {
    const { data: u } = await db.from('users').select('*').eq('id', currentUser.id).single();
    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-1">Profil & Identitas Saya</h4>
            <small class="opacity-75">Perbarui foto profil, nama, dan data diri Anda</small>
        </div>
        <div class="px-3">
            <div class="card border-0 shadow-sm rounded-4 p-4">
                <form id="formProfilSiswa">
                    <div class="text-center mb-4">
                        <img id="preview-foto-siswa" src="${u.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" class="rounded-circle shadow mb-2" style="width:110px; height:110px; object-fit:cover;">
                        <div>
                            <label class="btn btn-sm btn-outline-success rounded-pill mt-1" style="cursor:pointer;">
                                <i class="bi bi-camera me-1"></i>Ganti Foto Profil
                                <input type="file" id="ps_foto" accept="image/*" class="d-none" onchange="if(this.files[0]) document.getElementById('preview-foto-siswa').src = URL.createObjectURL(this.files[0]);">
                            </label>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="small fw-semibold">Nama Lengkap</label>
                            <input type="text" id="ps_nama" class="form-control" value="${u.nama || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="small fw-semibold">Nomor WhatsApp</label>
                            <input type="text" id="ps_wa" class="form-control" value="${u.no_wa || ''}" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="small fw-semibold">Jenis Kelamin</label>
                            <select id="ps_jk" class="form-select">
                                <option value="">-- Pilih --</option>
                                <option value="Laki-laki" ${u.jenis_kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                                <option value="Perempuan" ${u.jenis_kelamin === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="small fw-semibold">Kata Sandi Baru (Kosongkan jika tidak diubah)</label>
                            <input type="password" id="ps_pass" class="form-control" placeholder="******">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="small fw-semibold">Alamat Lengkap</label>
                        <textarea id="ps_alamat" class="form-control" rows="2">${u.alamat || ''}</textarea>
                    </div>
                    <div class="mb-4">
                        <label class="small fw-semibold">Catatan / Bio Singkat</label>
                        <textarea id="ps_bio" class="form-control" rows="2">${u.bio || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-emerald w-100 py-2 fw-bold rounded-pill">Simpan Perubahan Profil</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('formProfilSiswa').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan profil...');
            let avatar_url = u.avatar_url;
            const fileFoto = document.getElementById('ps_foto').files[0];
            if (fileFoto) avatar_url = await uploadKeBucket(fileFoto, 'avatars');

            const payload = {
                nama: document.getElementById('ps_nama').value.trim(),
                no_wa: document.getElementById('ps_wa').value.trim(),
                jenis_kelamin: document.getElementById('ps_jk').value,
                alamat: document.getElementById('ps_alamat').value.trim(),
                bio: document.getElementById('ps_bio').value.trim(),
                avatar_url
            };
            const passBaru = document.getElementById('ps_pass').value.trim();
            if (passBaru) payload.password = passBaru;

            const { data: updated, error } = await db.from('users').update(payload).eq('id', currentUser.id).select().single();
            if (error) throw error;

            // Perbarui sesi browser & nama di bilah atas
            Object.assign(currentUser, updated);
            localStorage.setItem('lms_user', JSON.stringify(currentUser));
            document.getElementById('user-badge-top').innerText = `${currentUser.nama} (${currentUser.role.toUpperCase()})`;

            Popup.success('Berhasil!', 'Profil dan identitas diri Anda telah diperbarui.');
            bukaMenu('siswa_profil');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
}

// Fungsi Universal Hapus Data
window.hapusData = async (table, id, reloadSec) => {
    if (await Popup.confirm('Hapus Data Ini?', 'Data yang dihapus tidak dapat dikembalikan.')) {
        await db.from(table).delete().eq('id', id);
        Popup.toast('Data berhasil dihapus');
        bukaMenu(reloadSec);
    }
};