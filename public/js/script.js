const menuLinks = document.querySelectorAll('.sidebar .nav-link');

menuLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault(); // Empêcher le comportement de liaison par défaut

    // Masquer tous les conteneurs de page
    const pageContents = document.querySelectorAll('#content-wrapper > div');
    pageContents.forEach(content => content.style.display = 'none');

    // Afficher le conteneur de page correspondant au lien cliqué
    const targetPage = event.target.getAttribute('href').slice(1);
    document.querySelector(`#content-${targetPage}`).style.display = 'block';
  });
});