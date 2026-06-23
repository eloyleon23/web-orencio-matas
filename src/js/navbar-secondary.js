(function () {
  var toggle = document.querySelector('.navbar__toggle');
  var nav = document.querySelector('.navbar__nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', function (e) {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
