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
            { id: 'approval', icon: 'bi-check2-circle', label: 'Approval' },
            { id: 'cms', icon: 'bi-palette', label: 'CMS & Banner' },
            { id: 'paket', icon: 'bi-box-seam', label: 'Paket Kelas' },
            { id: 'guru', icon: 'bi-person-badge', label: 'Data Guru' },
            { id: 'artikel', icon: 'bi-newspaper', label: 'Blog Artikel' }
        ];
    } else if (currentUser.role === 'guru') {
        menus = [
            { id: 'materi', icon: 'bi-camera-video', label: 'Live & Video' },
            { id: 'soal', icon: 'bi-file-earmark-excel', label: 'Bank Soal Excel' },
            { id: 'koreksi', icon: 'bi-clipboard-check', label: 'Penilaian Essay' },
            { id: 'artikel', icon: 'bi-journal-richtext', label: 'Artikel' }
        ];
    } else {
        // Role Siswa (Gaya Deen Connect: Home, Tutor, Materi/Booking, Kuis)
        menus = [
            { id: 'siswa_home', icon: 'bi-house-door-fill', label: 'Home' },
            { id: 'siswa_tutor', icon: 'bi-people-fill', label: 'Tutor' },
            { id: 'siswa_kuis', icon: 'bi-Award-fill', label: 'Kuis & Nilai' },
            { id: 'siswa_jadwal', icon: 'bi-calendar2-check-fill', label: 'Booking/Live' }
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
    if (secId === 'soal') await renderSoalGuru(container);
    if (secId === 'koreksi') await renderKoreksiGuru(container);
    if (secId === 'siswa_home') await renderSiswaHome(container);
    if (secId === 'siswa_tutor') await renderSiswaTutorList(container);
    if (secId === 'siswa_kuis') await renderSiswaKuis(container);
    if (secId === 'siswa_jadwal') await renderSiswaJadwal(container);
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
    const { data } = await db.from('registrations').select(`*, packages(nama_paket)`).order('created_at', { ascending: false });
    container.innerHTML = `
        <div class="p-3">
            <h4 class="fw-bold mb-3">Approval Pendaftaran Calon Siswa</h4>
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr><th>Calon Siswa</th><th>Paket & Metode</th><th>Catatan</th><th>Status</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${(data || []).map(r => `
                                <tr>
                                    <td><div class="fw-bold">${r.nama_calon}</div><small class="text-muted">${r.email_calon} | ${r.no_wa}</small></td>
                                    <td><div class="fw-semibold">${r.packages?.nama_paket || '-'}</div><span class="badge bg-success-subtle text-success">${r.metode_pilihan}</span></td>
                                    <td class="small">${r.catatan || '-'}</td>
                                    <td><span class="badge ${r.status === 'Approved' ? 'bg-success' : 'bg-warning text-dark'}">${r.status}</span></td>
                                    <td>
                                        ${r.status === 'Pending' ? `<button class="btn btn-sm btn-emerald" onclick="approveSiswa('${r.id}','${r.nama_calon}','${r.email_calon}','${r.no_wa}','${r.paket_id}')">Approve & Buat Akun</button>` : ''}
                                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="hapusData('registrations','${r.id}','approval')"><i class="bi bi-trash"></i></button>
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

window.approveSiswa = async (regId, nama, email, wa, paketId) => {
    const { value: pass } = await Swal.fire({
        title: `Approve ${nama}?`,
        text: 'Masukkan password untuk akun login siswa ini:',
        input: 'text',
        inputValue: '123456',
        showCancelButton: true,
        confirmButtonColor: '#00875a'
    });
    if (!pass) return;

    Popup.loading('Membuat akun kelas siswa...');
    const { data: u, error } = await db.from('users').insert([{ nama, email, password: pass, no_wa: wa, role: 'siswa' }]).select().single();
    if (error) return Popup.error('Gagal', error.message);

    await db.from('enrollments').insert([{ siswa_id: u.id, paket_id: paketId }]);
    await db.from('registrations').update({ status: 'Approved' }).eq('id', regId);
    Popup.success('Akun Aktif!', `Siswa dapat login dengan Email: ${email} & Password: ${pass}`);
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
    document.getElementById('modalDashboardTitle').innerText = item ? 'Edit Profil Guru' : 'Tambah Guru Baru';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fGuru">
            <div class="row">
                <div class="col-md-6 mb-2"><label>Nama Lengkap</label><input type="text" id="g_nama" class="form-control" value="${item?.nama || ''}" required></div>
                <div class="col-md-6 mb-2"><label>Email Login</label><input type="email" id="g_email" class="form-control" value="${item?.email || ''}" required></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><label>Password</label><input type="text" id="g_pass" class="form-control" value="${item?.password || '123456'}" required></div>
                <div class="col-md-6 mb-2"><label>Spesialisasi</label><input type="text" id="g_spes" class="form-control" value="${item?.spesialisasi || 'Tahsin & Tajwid'}"></div>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><label>Bahasa</label><input type="text" id="g_bhs" class="form-control" value="${item?.bahasa || 'Indonesia, Arab'}"></div>
                <div class="col-md-6 mb-2"><label>Upload Foto Profil (Bucket)</label><input type="file" id="g_file" class="form-control" accept="image/*"></div>
            </div>
            <div class="mb-3"><label>Biografi Singkat</label><textarea id="g_bio" class="form-control" rows="2">${item?.bio || ''}</textarea></div>
            <button type="submit" class="btn btn-emerald w-100">Simpan Guru</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fGuru').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Menyimpan profil guru...');
            let avatar_url = item?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
            const f = document.getElementById('g_file').files[0];
            if (f) avatar_url = await uploadKeBucket(f, 'avatars');

            const payload = {
                nama: document.getElementById('g_nama').value,
                email: document.getElementById('g_email').value,
                password: document.getElementById('g_pass').value,
                spesialisasi: document.getElementById('g_spes').value,
                bahasa: document.getElementById('g_bhs').value,
                bio: document.getElementById('g_bio').value,
                role: 'guru',
                avatar_url
            };
            if (item) await db.from('users').update(payload).eq('id', item.id);
            else await db.from('users').insert([payload]);
            modalDash.hide();
            Popup.toast('Data guru disimpan');
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
    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    const selectedPaketId = window.activeQuizPaket || (pakets && pakets[0]?.id) || '';

    const { data: soals } = await db.from('quizzes').select('*').eq('paket_id', selectedPaketId).order('nomor', { ascending: true });
    const totalPoinPaket = (soals || []).reduce((acc, q) => acc + (parseInt(q.poin) || 0), 0);

    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h4 class="fw-bold mb-1">Kelola Bank Soal & Excel (Mendukung Gambar di Sel Excel)</h4>
                    <span class="badge bg-emerald fs-6">Total Poin Paket Ini: ${totalPoinPaket} Poin (${(soals || []).length} Butir Soal)</span>
                </div>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-success fw-semibold" onclick="downloadTemplateExcel()">
                        <i class="bi bi-download me-1"></i>Download Format Excel
                    </button>
                    <button class="btn btn-success fw-semibold" onclick="triggerImportExcel('${selectedPaketId}')">
                        <i class="bi bi-file-earmark-arrow-up me-1"></i>Import Soal + Gambar Excel
                    </button>
                    <button class="btn btn-warning fw-bold text-dark" onclick="exportSoalKeExcel('${selectedPaketId}')">
                        <i class="bi bi-file-earmark-excel me-1"></i>Export Soal & Gambar
                    </button>
                    <button class="btn btn-emerald" onclick="formSoalManual('${selectedPaketId}')">
                        <i class="bi bi-plus-lg me-1"></i>Tambah Manual
                    </button>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-4 p-3 mb-3">
                <label class="fw-bold small mb-1">Pilih Paket Kelas:</label>
                <select class="form-select" onchange="window.activeQuizPaket = this.value; bukaMenu('soal');">
                    ${(pakets || []).map(p => `<option value="${p.id}" ${p.id === selectedPaketId ? 'selected' : ''}>${p.nama_paket}</option>`).join('')}
                </select>
            </div>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>No</th>
                                <th>Gambar</th>
                                <th>Soal</th>
                                <th>Opsi Pilihan Ganda</th>
                                <th>Jenis</th>
                                <th>Kunci</th>
                                <th>Poin</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(soals || []).map(q => `
                                <tr>
                                    <td class="fw-bold">${q.nomor}</td>
                                    <td>${q.gambar_url ? `<img src="${q.gambar_url}" style="width:60px; height:45px; object-fit:cover;" class="rounded border">` : '-'}</td>
                                    <td>${q.soal}</td>
                                    <td class="small text-muted">${q.jenis_soal === 'PG' ? q.opsi_pg : '<em>(Soal Essay - Tanpa Opsi)</em>'}</td>
                                    <td><span class="badge ${q.jenis_soal === 'PG' ? 'bg-primary' : 'bg-info text-dark'}">${q.jenis_soal}</span></td>
                                    <td class="fw-bold">${q.jenis_soal === 'PG' ? q.kunci_jawaban : '-'}</td>
                                    <td><span class="badge bg-warning text-dark">${q.poin} Poin</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-danger" onclick="hapusData('quizzes','${q.id}','soal')"><i class="bi bi-trash"></i></button>
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

// 2. Import Excel + Ekstrak Gambar yang Ditempel di Sel Excel ke Bucket 'videos'
window.triggerImportExcel = (paketId) => {
    if (!paketId) return Popup.error('Pilih Paket', 'Silakan buat atau pilih paket kelas terlebih dahulu.');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            Popup.loading('Membaca Excel & mengunggah gambar sel ke Bucket...');
            const arrayBuffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            const worksheet = workbook.worksheets[0];

            // Peta Gambar yang tertanam di baris Excel (RowNumber -> Public URL Bucket)
            const rowImageMap = {};
            const images = worksheet.getImages();
            for (const img of images) {
                const media = workbook.model.media.find(m => m.index === img.imageId);
                if (media) {
                    const rowNumber = Math.floor(img.range.tl.nativeRow) + 1;
                    const blob = new Blob([media.buffer], { type: `image/${media.extension}` });
                    blob.name = `soal_row_${rowNumber}.${media.extension}`;
                    const uploadedUrl = await uploadKeBucket(blob, 'quiz_images');
                    rowImageMap[rowNumber] = uploadedUrl;
                }
            }

            const payloadInsert = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Lewati baris header
                const nomor = parseInt(row.getCell(1).value) || rowNumber - 1;
                const soal = (row.getCell(2).value || '').toString().trim();
                const opsiRaw = (row.getCell(3).value || '').toString().trim();
                const jenisRaw = (row.getCell(4).value || 'PG').toString().trim().toUpperCase();
                const kunciRaw = (row.getCell(5).value || '').toString().trim().toUpperCase();
                const poin = parseInt(row.getCell(6).value) || 10;

                if (!soal) return;

                const jenis_soal = jenisRaw === 'ESSAY' ? 'ESSAY' : 'PG';
                payloadInsert.push({
                    paket_id: paketId,
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

            if (payloadInsert.length === 0) return Popup.error('Data Kosong', 'Tidak ada baris soal yang valid di file Excel.');

            const { error } = await db.from('quizzes').insert(payloadInsert);
            if (error) throw error;

            Popup.success('Import Berhasil!', `${payloadInsert.length} butir soal beserta gambar berhasil diimpor.`);
            bukaMenu('soal');
        } catch (err) {
            Popup.error('Gagal Import Excel', err.message);
        }
    };
    input.click();
};

// 3. Export Soal + Sematkan Kembali Gambar ke Dalam Sel Excel
window.exportSoalKeExcel = async (paketId) => {
    try {
        Popup.loading('Mengekspor soal & menyematkan gambar ke Excel...');
        const { data: soals } = await db.from('quizzes').select('*').eq('paket_id', paketId).order('nomor', { ascending: true });
        if (!soals || soals.length === 0) return Popup.error('Kosong', 'Belum ada soal di paket ini untuk diekspor.');

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
            const rowIndex = i + 2;
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
                    sheet.addImage(imgId, {
                        tl: { col: 6, row: rowIndex - 1 },
                        ext: { width: 110, height: 80 }
                    });
                } catch (e) {
                    row.getCell(7).value = q.gambar_url;
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Export_Soal_${Date.now()}.xlsx`;
        a.click();
        Swal.close();
    } catch (err) {
        Popup.error('Gagal Export', err.message);
    }
};

window.formSoalManual = (paketId) => {
    document.getElementById('modalDashboardTitle').innerText = 'Tambah Soal Manual';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fSoalManual">
            <div class="row">
                <div class="col-md-3 mb-2"><label>Nomor</label><input type="number" id="qm_no" class="form-control" value="1" required></div>
                <div class="col-md-5 mb-2">
                    <label>Jenis Soal</label>
                    <select id="qm_jenis" class="form-select" onchange="document.getElementById('wrap-opsi-pg').style.display = this.value === 'PG' ? 'block' : 'none'">
                        <option value="PG">PG (Pilihan Ganda)</option>
                        <option value="ESSAY">ESSAY</option>
                    </select>
                </div>
                <div class="col-md-4 mb-2"><label>Poin Soal</label><input type="number" id="qm_poin" class="form-control" value="10" required></div>
            </div>
            <div class="mb-2"><label>Pertanyaan / Soal</label><textarea id="qm_soal" class="form-control" rows="2" required></textarea></div>
            <div class="mb-2"><label>Upload Gambar Soal (Opsional - Bucket)</label><input type="file" id="qm_file" class="form-control" accept="image/*"></div>
            <div id="wrap-opsi-pg">
                <div class="mb-2">
                    <label>Opsi Pilihan Ganda (Pisahkan dengan tanda | )</label>
                    <input type="text" id="qm_opsi" class="form-control" placeholder="A. Izhar | B. Idgham | C. Iqlab | D. Ikhfa">
                </div>
                <div class="mb-3">
                    <label>Kunci Jawaban PG</label>
                    <select id="qm_kunci" class="form-select">
                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                    </select>
                </div>
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
            Popup.toast('Soal ditambahkan');
            bukaMenu('soal');
        } catch (err) {
            Popup.error('Gagal', err.message);
        }
    };
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
async function renderMateriGuru(container) {
    const { data } = await db.from('materials').select(`*, packages(nama_paket)`).order('created_at', { ascending: false });
    container.innerHTML = `
        <div class="p-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold mb-0">Kelola Jadwal Live Zoom & Video Materi</h4>
                <button class="btn btn-emerald" onclick="formMateri()"><i class="bi bi-plus-lg me-1"></i>Tambah Materi / Video</button>
            </div>
            <div class="row g-3">
                ${(data || []).map(m => `
                    <div class="col-md-6">
                        <div class="recitation-card">
                            <div class="d-flex align-items-center gap-3">
                                <a href="${m.link_url}" target="_blank" class="play-circle-btn text-decoration-none"><i class="bi bi-play-fill"></i></a>
                                <div>
                                    <span class="badge bg-success-subtle text-success mb-1">${m.kategori}</span>
                                    <h6 class="fw-bold mb-0">${m.judul}</h6>
                                    <small class="text-muted">${m.packages?.nama_paket || ''} • ${m.jadwal_atau_lokasi || ''}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="font-arab text-success mb-1">${m.teks_arab || ''}</div>
                                <button class="btn btn-sm btn-outline-danger" onclick="hapusData('materials','${m.id}','materi')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.formMateri = async () => {
    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    document.getElementById('modalDashboardTitle').innerText = 'Tambah Live Zoom / Upload Video ke Bucket';
    document.getElementById('modalDashboardBody').innerHTML = `
        <form id="fMateri">
            <div class="row">
                <div class="col-md-6 mb-2">
                    <label>Pilih Paket Kelas</label>
                    <select id="m_paket" class="form-select" required>
                        ${(pakets || []).map(p => `<option value="${p.id}">${p.nama_paket}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6 mb-2">
                    <label>Kategori</label>
                    <select id="m_kat" class="form-select">
                        <option value="Live Zoom / Tatap Muka">Live Zoom / Tatap Muka</option>
                        <option value="Video Rekaman">Video Rekaman</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8 mb-2"><label>Judul Materi / Surah</label><input type="text" id="m_judul" class="form-control" placeholder="Al-Fatihah • 7 Verses" required></div>
                <div class="col-md-4 mb-2"><label>Kaligrafi Arab</label><input type="text" id="m_arab" class="form-control" value="سُورَةُ الفَاتِحَة"></div>
            </div>
            <div class="mb-2"><label>Jadwal / Lokasi</label><input type="text" id="m_jadwal" class="form-control" placeholder="Senin 16:00 WIB - Live Zoom"></div>
            <div class="mb-2"><label>Link Zoom / Link Video (Jika menggunakan tautan luar)</label><input type="url" id="m_url" class="form-control" placeholder="https://..."></div>
            <div class="mb-3"><label>Atau Upload File Video Langsung ke Bucket 'videos'</label><input type="file" id="m_file" class="form-control" accept="video/*"></div>
            <button type="submit" class="btn btn-emerald w-100">Simpan Materi</button>
        </form>
    `;
    modalDash.show();

    document.getElementById('fMateri').onsubmit = async (e) => {
        e.preventDefault();
        try {
            Popup.loading('Mengunggah materi...');
            let link_url = document.getElementById('m_url').value;
            const f = document.getElementById('m_file').files[0];
            if (f) link_url = await uploadKeBucket(f, 'class_videos');

            await db.from('materials').insert([{
                paket_id: document.getElementById('m_paket').value,
                guru_id: currentUser.id,
                judul: document.getElementById('m_judul').value,
                teks_arab: document.getElementById('m_arab').value,
                kategori: document.getElementById('m_kat').value,
                jadwal_atau_lokasi: document.getElementById('m_jadwal').value,
                link_url: link_url || '#'
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
async function renderSiswaHome(container) {
    const { data: gurus } = await db.from('users').select('*').eq('role', 'guru');
    const { data: materis } = await db.from('materials').select(`*, packages(nama_paket), users(nama)`).order('created_at', { ascending: false });

    container.innerHTML = `
        <!-- Header Melengkung Hijau Deen Connect -->
        <div class="deen-header mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 class="fw-bold mb-0 font-arab fs-2">Deen Connect</h3>
                    <small class="opacity-75">Assalamu'alaikum, ${currentUser.nama}</small>
                </div>
                <img src="${currentUser.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" class="rounded-circle border border-2 border-white" style="width:48px; height:48px; object-fit:cover;">
            </div>
            <div class="deen-search-box">
                <i class="bi bi-search text-muted"></i>
                <input type="text" id="searchMateriInput" placeholder="Find an Imaam or recitation..." oninput="filterMateriSiswa(this.value)">
            </div>
        </div>

        <div class="px-3">
            <!-- Featured Tutors Horizontal Scroll (Persis Referensi image_792386.png) -->
            <div class="bg-white p-3 rounded-4 shadow-sm mb-4">
                <h6 class="fw-bold mb-3">Featured Tutors</h6>
                <div class="d-flex gap-4 overflow-auto pb-2">
                    ${(gurus || []).map(g => `
                        <div class="text-center flex-shrink-0" onclick='bukaProfilTutorSiswa(${JSON.stringify(g).replace(/'/g, "&#39;")})'>
                            <img src="${g.avatar_url}" class="tutor-avatar-circle mb-1">
                            <div class="small fw-semibold text-dark">${g.nama.split(' ')[0]}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Quran Recitations & Materi Kelas -->
            <h6 class="fw-bold mb-3">Quran Recitations & Materi Kelas</h6>
            <div id="list-materi-deen" class="row g-3">
                ${(materis || []).map(m => `
                    <div class="col-12 col-md-6 item-materi-deen" data-title="${m.judul.toLowerCase()}">
                        <div class="recitation-card">
                            <div class="d-flex align-items-center gap-3">
                                <a href="${m.link_url}" target="_blank" class="play-circle-btn text-decoration-none">
                                    <i class="bi bi-play-fill"></i>
                                </a>
                                <div>
                                    <h6 class="fw-bold mb-0">${m.judul}</h6>
                                    <small class="text-muted">${m.kategori} • ${m.jadwal_atau_lokasi || 'Akses Kapan Saja'}</small>
                                </div>
                            </div>
                            <div class="font-arab text-dark">${m.teks_arab || 'سُورَة'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.filterMateriSiswa = (keyword) => {
    const q = keyword.toLowerCase();
    document.querySelectorAll('.item-materi-deen').forEach(el => {
        el.style.display = el.dataset.title.includes(q) ? 'block' : 'none';
    });
};

// Halaman Tutors List Siswa (Layar Tengah image_792386.png)
async function renderSiswaTutorList(container) {
    const { data: gurus } = await db.from('users').select('*').eq('role', 'guru');
    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-3">Tutors List</h4>
            <div class="deen-search-box">
                <i class="bi bi-search text-muted"></i>
                <input type="text" placeholder="Find a tutor..." oninput="
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
                                    <button class="btn-book-green" onclick='bukaProfilTutorSiswa(${JSON.stringify(g).replace(/'/g, "&#39;")})'>Book Now</button>
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

// Modal Tutor Profile (Layar Kanan image_792386.png)
window.bukaProfilTutorSiswa = (g) => {
    document.getElementById('modalDashboardTitle').innerText = 'Tutor Profile';
    document.getElementById('modalDashboardBody').innerHTML = `
        <div class="text-center">
            <img src="${g.avatar_url}" class="rounded-circle shadow mb-3" style="width:110px; height:110px; object-fit:cover;">
            <h4 class="fw-bold mb-0">${g.nama}</h4>
            <p class="text-muted small mb-1">${g.spesialisasi || 'Expert in Tajweed and Qiraat'}</p>
            <div class="mb-3">
                <span class="fw-bold text-warning"><i class="bi bi-star-fill"></i> ${g.rating || '4.9'}</span>
                <span class="text-muted small ms-2">| Verified Scholar</span>
            </div>
            <p class="small text-secondary px-2">${g.bio || ''}</p>

            <div class="bg-light p-3 rounded-4 text-start mb-3">
                <h6 class="fw-bold small mb-2">Languages</h6>
                <div class="d-flex gap-2 flex-wrap">
                    ${(g.bahasa || 'Indonesia, Arabic').split(',').map(b => `<span class="badge bg-white text-dark border rounded-pill px-3 py-2">${b.trim()}</span>`).join('')}
                </div>
            </div>

            <div class="text-start mb-4">
                <h6 class="fw-bold small mb-2">Availability</h6>
                <div class="d-flex justify-content-between text-center bg-light p-2 rounded-4 small">
                    <div class="p-2"><div>Sun</div><strong>01</strong></div>
                    <div class="p-2 bg-success text-white rounded-3"><div>Mon</div><strong>02</strong></div>
                    <div class="p-2"><div>Tue</div><strong>03</strong></div>
                    <div class="p-2 bg-success text-white rounded-3"><div>Wed</div><strong>04</strong></div>
                    <div class="p-2"><div>Thu</div><strong>05</strong></div>
                    <div class="p-2 bg-success text-white rounded-3"><div>Fri</div><strong>06</strong></div>
                    <div class="p-2"><div>Sat</div><strong>07</strong></div>
                </div>
            </div>

            <button class="btn-book-green w-100 py-3 fs-6 shadow" onclick="modalDash.hide(); bukaMenu('siswa_jadwal');">
                Booking Jadwal Mengaji
            </button>
        </div>
    `;
    modalDash.show();
};

// Halaman Pengerjaan Kuis Siswa (Mendukung PG, Essay, Gambar Soal, & Rekap Nilai)
async function renderSiswaKuis(container) {
    const { data: pakets } = await db.from('packages').select('id, nama_paket');
    const aktifPaket = window.siswaPaketKuis || (pakets && pakets[0]?.id) || '';

    const { data: soals } = await db.from('quizzes').select('*').eq('paket_id', aktifPaket).order('nomor', { ascending: true });
    const { data: riwayat } = await db.from('quiz_submissions').select('*').eq('siswa_id', currentUser.id).eq('paket_id', aktifPaket);

    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-1">Evaluasi & Kuis Kelas</h4>
            <small class="opacity-75">Kerjakan soal Pilihan Ganda dan Essay di bawah ini</small>
        </div>
        <div class="px-3">
            <div class="card border-0 shadow-sm rounded-4 p-3 mb-3">
                <label class="small fw-bold mb-1">Pilih Paket Kuis:</label>
                <select class="form-select" onchange="window.siswaPaketKuis = this.value; bukaMenu('siswa_kuis');">
                    ${(pakets || []).map(p => `<option value="${p.id}" ${p.id === aktifPaket ? 'selected' : ''}>${p.nama_paket}</option>`).join('')}
                </select>
            </div>

            ${riwayat && riwayat.length > 0 ? `
                <div class="alert alert-success rounded-4 shadow-sm mb-4">
                    <h6 class="fw-bold mb-1"><i class="bi bi-award-fill me-1"></i>Status Nilai Terakhir Anda: ${riwayat[0].status_nilai}</h6>
                    <div>Total Skor: <strong class="fs-5">${riwayat[0].skor_akhir}</strong> dari ${riwayat[0].total_poin_paket} Poin</div>
                </div>
            ` : ''}

            ${!soals || soals.length === 0 ? `<div class="text-center text-muted py-4">Belum ada soal pada paket ini.</div>` : `
                <form id="formLembarKuisSiswa">
                    ${soals.map(q => {
                        const opsiList = q.jenis_soal === 'PG' ? q.opsi_pg.split('|').map(o => o.trim()).filter(Boolean) : [];
                        return `
                            <div class="card border-0 shadow-sm rounded-4 mb-3">
                                <div class="card-body p-4">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="badge bg-emerald">Soal No. ${q.nomor} (${q.jenis_soal})</span>
                                        <span class="badge bg-warning text-dark">${q.poin} Poin</span>
                                    </div>
                                    <p class="fw-semibold fs-6 mb-3">${q.soal}</p>
                                    ${q.gambar_url ? `<img src="${q.gambar_url}" class="img-fluid rounded-3 border mb-3" style="max-height:220px;">` : ''}

                                    ${q.jenis_soal === 'PG' ? `
                                        <div class="d-flex flex-column gap-2">
                                            ${opsiList.map(opt => {
                                                const huruf = opt.charAt(0).toUpperCase();
                                                return `
                                                    <label class="p-2 border rounded-3 d-flex align-items-center gap-2" style="cursor:pointer;">
                                                        <input type="radio" name="ans_${q.id}" value="${huruf}" class="form-check-input mt-0" required>
                                                        <span>${opt}</span>
                                                    </label>
                                                `;
                                            }).join('')}
                                        </div>
                                    ` : `
                                        <textarea name="ans_${q.id}" class="form-control" rows="3" placeholder="Tuliskan jawaban uraian/essay Anda di sini..." required></textarea>
                                    `}
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
            let totalPoinPaket = 0;
            let skorOtomatis = 0;
            let adaEssay = false;

            const detail_jawaban = soals.map(q => {
                totalPoinPaket += parseInt(q.poin) || 0;
                let jwb = '';
                if (q.jenis_soal === 'PG') {
                    jwb = document.querySelector(`input[name="ans_${q.id}"]:checked`)?.value || '';
                } else {
                    jwb = document.querySelector(`textarea[name="ans_${q.id}"]`)?.value || '';
                    adaEssay = true;
                }

                const benarPG = q.jenis_soal === 'PG' && jwb.toUpperCase() === (q.kunci_jawaban || '').toUpperCase();
                const poinDidapat = benarPG ? (parseInt(q.poin) || 0) : 0;
                skorOtomatis += poinDidapat;

                return {
                    quiz_id: q.id,
                    nomor: q.nomor,
                    soal: q.soal,
                    jenis_soal: q.jenis_soal,
                    gambar_url: q.gambar_url,
                    jawaban_siswa: jwb,
                    kunci_jawaban: q.kunci_jawaban,
                    poin_maks: parseInt(q.poin) || 0,
                    poin_didapat: poinDidapat
                };
            });

            await db.from('quiz_submissions').insert([{
                paket_id: aktifPaket,
                siswa_id: currentUser.id,
                detail_jawaban,
                total_poin_paket: totalPoinPaket,
                skor_akhir: skorOtomatis,
                status_nilai: adaEssay ? 'Menunggu Koreksi Essay oleh Guru' : 'Selesai Dinilai'
            }]);

            Popup.success(
                'Jawaban Terkirim!',
                adaEssay
                    ? `Skor PG sementara: ${skorOtomatis}. Soal Essay Anda akan dinilai oleh Guru.`
                    : `Skor Akhir Anda: ${skorOtomatis} dari ${totalPoinPaket} Poin.`
            );
            bukaMenu('siswa_kuis');
        };
    }
}

async function renderSiswaJadwal(container) {
    const { data: materis } = await db.from('materials').select(`*, packages(nama_paket), users(nama)`).eq('kategori', 'Live Zoom / Tatap Muka');
    container.innerHTML = `
        <div class="deen-header mb-4">
            <h4 class="fw-bold mb-1">Jadwal Tatap Muka & Live Zoom</h4>
            <small class="opacity-75">Klik tombol di bawah untuk bergabung ke sesi tatap muka atau Zoom</small>
        </div>
        <div class="px-3">
            <div class="row g-3">
                ${(materis || []).map(m => `
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4 p-3">
                            <span class="badge bg-success-subtle text-success align-self-start mb-2">${m.packages?.nama_paket || 'Kelas Mengaji'}</span>
                            <h5 class="fw-bold mb-1">${m.judul}</h5>
                            <p class="small text-danger fw-semibold mb-3"><i class="bi bi-calendar-event me-1"></i>${m.jadwal_atau_lokasi || 'Jadwal Fleksibel'}</p>
                            <a href="${m.link_url}" target="_blank" class="btn-book-green text-center text-decoration-none py-2">
                                <i class="bi bi-camera-video me-1"></i>Masuk Ruang Live / Zoom
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Fungsi Universal Hapus Data
window.hapusData = async (table, id, reloadSec) => {
    if (await Popup.confirm('Hapus Data Ini?', 'Data yang dihapus tidak dapat dikembalikan.')) {
        await db.from(table).delete().eq('id', id);
        Popup.toast('Data berhasil dihapus');
        bukaMenu(reloadSec);
    }
};