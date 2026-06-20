(() => {
  const STORAGE_KEY = 'orencio_matas_cookie_consent';
  const ACCEPTED = 'accepted';
  const REJECTED = 'rejected';

  window.dataLayer = window.dataLayer || [];

  const pushEvent = (eventName, data = {}) => {
    window.dataLayer.push({ event: eventName, ...data });
  };

  const injectStyles = () => {
    if (document.getElementById('cookie-consent-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = `
      .cookie-consent-banner {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        display: none;
        width: min(100% - 32px, 980px);
        margin: 0 auto;
        padding: 18px;
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 20px;
        color: #1e293b;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
        backdrop-filter: blur(14px);
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .cookie-consent-banner.is-visible {
        display: block;
      }

      .cookie-consent-banner__inner {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        align-items: center;
      }

      .cookie-consent-banner__title {
        margin: 0 0 6px;
        font-family: 'Montserrat', system-ui, sans-serif;
        font-size: 0.95rem;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .cookie-consent-banner__text {
        margin: 0;
        color: #475569;
        font-size: 0.92rem;
        line-height: 1.55;
      }

      .cookie-consent-banner__actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .cookie-consent-banner__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 11px 18px;
        border: 1px solid #e2e8f0;
        border-radius: 999px;
        background: #ffffff;
        color: #1e293b;
        font-family: 'Montserrat', system-ui, sans-serif;
        font-size: 0.78rem;
        font-weight: 900;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }

      .cookie-consent-banner__button:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
      }

      .cookie-consent-banner__button--accept {
        border-color: #D32F2F;
        background: #D32F2F;
        color: #ffffff;
      }

      @media (min-width: 720px) {
        .cookie-consent-banner {
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          padding: 20px 22px;
        }

        .cookie-consent-banner__inner {
          grid-template-columns: 1fr auto;
        }

        .cookie-consent-banner__actions {
          flex-direction: row;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const hideBanner = (banner) => {
    banner.classList.remove('is-visible');
    banner.setAttribute('aria-hidden', 'true');
  };

  const buildBanner = () => {
    if (document.getElementById('cookie-consent-banner')) {
      return document.getElementById('cookie-consent-banner');
    }

    const banner = document.createElement('section');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-consent-banner';
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = `
      <div class="cookie-consent-banner__inner">
        <div>
          <h2 class="cookie-consent-banner__title">Cookies analíticas</h2>
          <p class="cookie-consent-banner__text">Usamos cookies analíticas para medir visitas e interacciones y mejorar la experiencia en la web. Puedes aceptar o rechazar su uso.</p>
        </div>
        <div class="cookie-consent-banner__actions">
          <button class="cookie-consent-banner__button" type="button" data-cookie-consent="reject">Rechazar</button>
          <button class="cookie-consent-banner__button cookie-consent-banner__button--accept" type="button" data-cookie-consent="accept">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    return banner;
  };

  const initCookieConsent = () => {
    injectStyles();
    const banner = buildBanner();
    const savedConsent = localStorage.getItem(STORAGE_KEY);

    if (savedConsent === ACCEPTED) {
      pushEvent('cookies_aceptadas');
      hideBanner(banner);
      return;
    }

    if (savedConsent === REJECTED) {
      hideBanner(banner);
      return;
    }

    banner.classList.add('is-visible');
    banner.setAttribute('aria-hidden', 'false');

    banner.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cookie-consent]');

      if (!button) {
        return;
      }

      const choice = button.getAttribute('data-cookie-consent');

      if (choice === 'accept') {
        localStorage.setItem(STORAGE_KEY, ACCEPTED);
        pushEvent('cookies_aceptadas');
      }

      if (choice === 'reject') {
        localStorage.setItem(STORAGE_KEY, REJECTED);
      }

      hideBanner(banner);
    });
  };

  const initTrackedInteractions = () => {
    document.addEventListener('submit', (event) => {
      const form = event.target.closest('form');

      if (!form || !form.classList.contains('quote-form')) {
        return;
      }

      pushEvent('contact_form_submit', {
        form_id: form.id || 'quote-form',
        form_location: window.location.pathname
      });
    });

    document.addEventListener('click', (event) => {
      const instagramLink = event.target.closest('a[href*="instagram.com/orenciomatas"]');

      if (!instagramLink) {
        return;
      }

      pushEvent('instagram_click', {
        link_text: instagramLink.textContent.trim() || instagramLink.getAttribute('aria-label') || 'Instagram',
        link_location: window.location.pathname
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initCookieConsent();
    initTrackedInteractions();
  });
})();
