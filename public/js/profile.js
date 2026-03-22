// Shared profile modal logic — included on browse, dashboard, issued_books
(function () {
    const profileBtn    = document.getElementById('profileBtn');
    const profileModal  = document.getElementById('profileModal');
    const closeModal    = document.getElementById('closeModal');
    const modalBackdrop = document.getElementById('modalBackdrop');

    if (!profileBtn) return;

    profileModal.style.display  = 'none';
    modalBackdrop.style.display = 'none';

    profileBtn.addEventListener('click', () => {
        fetch('/profile')
            .then(res => res.json())
            .then(data => {
                document.getElementById('modalUsername').textContent = data.username;
                document.getElementById('modalUserId').textContent   = data.user_id;
                document.getElementById('modalEmail').textContent    = data.email;
                profileModal.style.display  = 'flex';
                modalBackdrop.style.display = 'block';
            })
            .catch(err => {
                console.error('Profile fetch error:', err);
                alert('Failed to load profile info.');
            });
    });

    const closeProfileModal = () => {
        profileModal.style.display  = 'none';
        modalBackdrop.style.display = 'none';
    };

    closeModal.addEventListener('click', closeProfileModal);
    modalBackdrop.addEventListener('click', closeProfileModal);
})();
