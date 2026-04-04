// Shared profile modal logic — included on browse, dashboard, issued_books
(function () {
    const profileBtn    = document.getElementById('profileBtn');
    const profileModal  = document.getElementById('profileModal');
    const closeModal    = document.getElementById('closeModal');
    const modalBackdrop = document.getElementById('modalBackdrop');

    if (!profileBtn) return;

    profileModal.style.display  = 'none';
    modalBackdrop.style.display = 'none';

    const openProfileModal = () => {
        profileModal.style.display  = 'flex';
        modalBackdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const closeProfileModal = () => {
        profileModal.style.display  = 'none';
        modalBackdrop.style.display = 'none';
        document.body.style.overflow = '';
    };

    profileBtn.addEventListener('click', () => {
        fetch('/profile')
            .then(res => res.json())
            .then(data => {
                document.getElementById('modalUsername').textContent = data.username;
                document.getElementById('modalUserId').textContent   = data.user_id;
                document.getElementById('modalEmail').textContent    = data.email;
                openProfileModal();
            })
            .catch(err => {
                console.error('Profile fetch error:', err);
                alert('Failed to load profile info.');
            });
    });

    closeModal.addEventListener('click', closeProfileModal);
    modalBackdrop.addEventListener('click', closeProfileModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profileModal.style.display === 'flex') {
            closeProfileModal();
        }
    });
})();
