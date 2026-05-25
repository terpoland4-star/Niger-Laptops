let currentUser = null;

async function checkAuth() {
    try {
        const res = await apiCall('/auth/profile');
        currentUser = res.data;
        return true;
    } catch(e) {
        return false;
    }
}

async function handleSendOTP(phone) {
    await sendOTP(phone);
    localStorage.setItem('temp_phone', phone);
    showToast('Code envoyé par SMS');
}

async function handleVerifyOTP(code, firstName, lastName) {
    const phone = localStorage.getItem('temp_phone');
    const res = await verifyOTP(phone, code, firstName, lastName);
    localStorage.setItem('access_token', res.data.accessToken);
    localStorage.setItem('refresh_token', res.data.refreshToken);
    currentUser = res.data.customer;
    localStorage.removeItem('temp_phone');
    showToast('Connexion réussie');
    navigateTo('/');
}
