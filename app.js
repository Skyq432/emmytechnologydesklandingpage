(() => {
  const WHATSAPP_NUMBER = '2348146503700';
  const PRICE = '\u20A664,900';

  const q = (selector, scope = document) => scope.querySelector(selector);
  const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Current year
  const yearEl = q('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const menuButton = q('.menu-button');
  const siteHeader = q('.site-header');
  menuButton?.addEventListener('click', () => {
    const open = siteHeader?.classList.toggle('is-open') || false;
    menuButton.setAttribute('aria-expanded', String(open));
  });
  qa('.desktop-nav a').forEach((link) => link.addEventListener('click', () => {
    siteHeader?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  // Reveal on scroll
  const revealItems = qa('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Product colour choice - keep every colour control in sync without changing the approved hero render.
  const colourChips = qa('.colour-chip');
  const colourRadios = qa('input[name="colour"]');
  const syncColour = (colour) => {
    const normalized = String(colour || '').toLowerCase() === 'white' ? 'white' : 'black';
    colourChips.forEach((chip) => chip.classList.toggle('active', chip.dataset.colour === normalized));
    const matchingRadio = q(`input[name="colour"][value="${normalized === 'white' ? 'White' : 'Black'}"]`);
    if (matchingRadio) matchingRadio.checked = true;
  };
  colourChips.forEach((button) => button.addEventListener('click', () => syncColour(button.dataset.colour)));
  colourRadios.forEach((radio) => radio.addEventListener('change', () => syncColour(radio.value)));
  syncColour(q('input[name="colour"]:checked')?.value || 'Black');

  // Delivery message
  const cityInput = q('#cityInput');
  const deliveryStatus = q('#deliveryStatus strong');
  const updateDelivery = () => {
    if (!deliveryStatus) return;
    const city = (cityInput?.value || '').trim().toLowerCase();
    if (!city) {
      deliveryStatus.textContent = 'Enter your city to see delivery information.';
    } else if (city.includes('ibadan')) {
      deliveryStatus.textContent = 'FREE delivery within Ibadan.';
    } else {
      deliveryStatus.textContent = 'Outside Ibadan: delivery fee applies and will be confirmed before dispatch.';
    }
  };
  cityInput?.addEventListener('input', updateDelivery);
  updateDelivery();

  // Order form / WhatsApp handoff
  const form = q('#orderForm');
  const modal = q('#orderModal');
  const orderRefEl = q('#orderRef');
  const whatsappLink = q('#whatsappOrderLink');
  const copyButton = q('#copyOrderButton');
  let latestMessage = '';

  const makeOrderRef = () => {
    const d = new Date();
    const date = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ETD-${date}-${random}`;
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  qa('[data-close-modal]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const ref = makeOrderRef();
    const city = String(data.get('city') || '').trim();
    const delivery = city.toLowerCase().includes('ibadan')
      ? 'FREE delivery within Ibadan'
      : 'Delivery fee applies (to be confirmed)';

    latestMessage = [
      'Hello Emmy Technology, I want to order the Foldable Workspace Desk.',
      '',
      `Order Ref: ${ref}`,
      `Name: ${String(data.get('name') || '').trim()}`,
      `Phone: ${String(data.get('phone') || '').trim()}`,
      `WhatsApp: ${String(data.get('whatsapp') || data.get('phone') || '').trim()}`,
      `Colour: ${data.get('colour')}`,
      `State: ${data.get('state')}`,
      `City / Area: ${city}`,
      `Delivery Address: ${data.get('address')}`,
      `Price: ${PRICE}`,
      `Delivery: ${delivery}`,
      'Payment: Pay on delivery',
      'Return: 7-day return window',
      '',
      'Please confirm my order and delivery details.'
    ].join('\n');

    const orderRecord = {
      ref,
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      whatsapp: String(data.get('whatsapp') || data.get('phone') || '').trim(),
      colour: data.get('colour'),
      state: data.get('state'),
      city,
      address: data.get('address'),
      price: PRICE,
      delivery,
      createdAt: new Date().toISOString()
    };

    // Local browser copy only; the authoritative order is sent via WhatsApp.
    try {
      const existing = JSON.parse(localStorage.getItem('emmytechDeskOrders') || '[]');
      existing.push(orderRecord);
      localStorage.setItem('emmytechDeskOrders', JSON.stringify(existing));
    } catch (_) {}

    if (orderRefEl) orderRefEl.textContent = ref;
    if (!whatsappLink) return;
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(latestMessage)}`;
    openModal();
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(latestMessage);
      const original = copyButton.textContent;
      copyButton.textContent = 'Copied \u2713';
      setTimeout(() => { copyButton.textContent = original; }, 1600);
    } catch (_) {
      window.prompt('Copy your order details:', latestMessage);
    }
  });
})();

/* === EMMYTECH REAL HEADER BRAND FIX === */
document.addEventListener('DOMContentLoaded', () => {
  const brand = document.querySelector('.brand-lockup');

  if (brand) {
    brand.innerHTML = `
      <img
        src="assets/brand-mark-yellow.png"
        class="emmy-yellow-mark"
        alt=""
        aria-hidden="true"
      >
      <span class="emmy-header-name">
        <strong>EMMY</strong>
        <span>TECHNOLOGY</span>
      </span>
    `;
  }
});
/* === END REAL HEADER BRAND FIX === */


/* === EMMYTECH CTA + FEATURE CARD POLISH === */
document.addEventListener("DOMContentLoaded", () => {

  // 1) Fix the blue CTA with glow
  const allClickable = Array.from(document.querySelectorAll("a, button"));
  const cta = allClickable.find(el => {
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return txt.includes("order now") && txt.includes("pay on delivery");
  });

  if (cta) {
    cta.classList.add("section-cta-solid");
    cta.style.backgroundImage = "none";
    cta.style.boxShadow = "none";
    cta.style.filter = "none";
    cta.style.color = "#111318";
  }

  // 2) Fix image positioning in the first problem card
  const textNodes = Array.from(document.querySelectorAll("div, article, section, li"));
  const cardTextBlock = textNodes.find(el => {
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return txt.includes("i don't have room for a desk") || txt.includes("i dont have room for a desk");
  });

  if (cardTextBlock) {
    const featuredCard = cardTextBlock.closest(".card, article, .problem-card, .grid-card, .feature-card, .design-card, li, section, div");
    if (featuredCard) {
      featuredCard.classList.add("problem-card-featured");

      const img = featuredCard.querySelector("img");
      if (img) {
        img.classList.add("problem-card-featured-image");
      }
    }
  }
});
/* === END EMMYTECH CTA + FEATURE CARD POLISH === */

