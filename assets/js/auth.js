document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    Popup.loading('Memverifikasi akun...');

    const email = document.getElementById('login_email').value.trim();
    const password = document.getElementById('login_password').value.trim();

    const { data, error } = await db
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

    if (error) {
        Popup.error('Terjadi Kesalahan Database', error.message);
        return;
    }

    if (!data) {
        Popup.error('Login Gagal', 'Email atau Password salah, atau pendaftaran Anda belum di-Approve oleh Admin.');
        return;
    }

    localStorage.setItem('lms_user', JSON.stringify(data));
    await Popup.success('Selamat Datang!', `Halo ${data.nama} (${data.role.toUpperCase()})`);
    window.location.href = 'dashboard.html';
});