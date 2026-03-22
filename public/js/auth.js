// Toggle password visibility — used on login.ejs and signup.ejs
function togglePassword(fieldName, iconId) {
    const field = document.querySelector(`input[name='${fieldName}']`);
    const icon  = document.getElementById(iconId);

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
