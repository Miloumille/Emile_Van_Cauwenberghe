const profilePicture = document.querySelector('.profile-picture');
const navLinks = document.querySelectorAll('.sidebar nav ul li a');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    // Animation de la photo de profil
    const scrollY = window.scrollY;

    if (scrollY > 0) {
        const scale = Math.max(0, 1 - scrollY * 0.005);
        profilePicture.style.transform = `translateY(-50%) scale(${scale})`;
    } else {
        profilePicture.style.transform = 'translateY(-50%) scale(1)';
    }

    // Mise à jour des titres de la barre latérale
    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 100) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === currentSection) {
            link.classList.add('active');
        }
    });
});