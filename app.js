(() => {
  'use strict';

  const WHATSAPP_NUMBER = '2348146503700';
  const PRICE = '₦64,900';
  const STORAGE_KEY = 'emmytechDeskCustomerDetails';
  const ORDERS_KEY = 'emmytechDeskOrders';
  const q = (selector, scope = document) => scope.querySelector(selector);
  const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const yearEl = q('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuButton = q('.menu-button');
  const siteHeader = q('.site-header');
  menuButton?.addEventListener('click', () => {
    const open = siteHeader?.classList.toggle('is-open') || false;
    menuButton.setAttribute('aria-expanded', String(open));
  });
  qa('.desktop-nav a').forEach(link => link.addEventListener('click', () => {
    siteHeader?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const revealItems = qa('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -24px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Keep the product colour cards interactive, but colour is no longer
  // requested in the order form or WhatsApp order message.
  const colourChips = qa('.colour-chip');
  colourChips.forEach(button => {
    button.addEventListener('click', () => {
      colourChips.forEach(chip => chip.classList.remove('active'));
      button.classList.add('active');
    });
  });

  const modal = q('#etOrderModal');
  const form = q('#orderForm');
  const savedNotice = q('#etSavedNotice');
  const cityInput = q('#cityInput');
  const deliveryStatus = q('#deliveryStatus strong');

  if (!modal || !form) {
    console.warn('EmmyTech order modal is missing.');
    return;
  }

  const makeOrderRef = () => {
    const d = new Date();
    const date = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ETD-${date}-${random}`;
  };

  const readSaved = () => {
    try {
      const direct = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (direct && typeof direct === 'object') return direct;
    } catch (_) {}

    // Bring forward the most recent details from the older order system.
    try {
      const old = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      if (Array.isArray(old) && old.length) {
        const last = old[old.length - 1];
        return {
          name: last.name || '',
          phone: last.phone || '',
          whatsapp: last.whatsapp || '',
          state: last.state || '',
          city: last.city || '',
          address: last.address || '',
          submitted: true
        };
      }
    } catch (_) {}
    return null;
  };

  const updateDelivery = () => {
    if (!deliveryStatus) return;
    const city = String(cityInput?.value || '').trim().toLowerCase();
    if (!city) {
      deliveryStatus.textContent = 'Enter your city to see delivery information.';
    } else if (city.includes('ibadan')) {
      deliveryStatus.textContent = 'FREE delivery within Ibadan.';
    } else {
      deliveryStatus.textContent = 'Outside Ibadan: delivery fee applies and will be confirmed before dispatch.';
    }
  };

  const fillSaved = () => {
    const saved = readSaved();
    if (!saved) {
      if (savedNotice) savedNotice.hidden = true;
      return;
    }
    ['name', 'phone', 'whatsapp', 'state', 'city', 'address'].forEach(name => {
      const field = form.elements[name];
      if (field && saved[name] !== undefined) field.value = saved[name] || '';
    });
    if (savedNotice) savedNotice.hidden = false;
    updateDelivery();
  };

  const saveCurrent = (submitted = false) => {
    const value = name => String(form.elements[name]?.value || '').trim();
    let previous = {};
    try { previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) {}
    const payload = {
      name: value('name'),
      phone: value('phone'),
      whatsapp: value('whatsapp'),
      state: value('state'),
      city: value('city'),
      address: value('address'),
      submitted: submitted ? true : Boolean(previous.submitted),
      updatedAt: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (_) {}
    return payload;
  };

  const openModal = () => {
    fillSaved();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('et-modal-open');
    setTimeout(() => {
      const firstEmpty = ['name', 'phone', 'state', 'city', 'address']
        .map(name => form.elements[name])
        .find(el => el && !String(el.value || '').trim());
      firstEmpty?.focus();
    }, 120);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('et-modal-open');
  };

  document.addEventListener('click', event => {
    const trigger = event.target.closest('a[href="#order"], [data-order-trigger]');
    if (trigger) {
      event.preventDefault();
      openModal();
      return;
    }
    if (event.target.closest('[data-order-close]')) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  cityInput?.addEventListener('input', () => {
    updateDelivery();
    saveCurrent(false);
  });
  form.addEventListener('input', () => saveCurrent(false));
  form.addEventListener('change', () => saveCurrent(false));
  updateDelivery();

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const details = saveCurrent(true);
    const ref = makeOrderRef();
    const delivery = details.city.toLowerCase().includes('ibadan')
      ? 'FREE delivery within Ibadan'
      : 'Delivery fee applies (to be confirmed before dispatch)';
    const whatsapp = details.whatsapp || details.phone;

    const message = [
      'Hello Emmy Technology, I want to order the Foldable Workspace Desk.',
      '',
      `Order Ref: ${ref}`,
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      `WhatsApp: ${whatsapp}`,
      `State: ${details.state}`,
      `City / Area: ${details.city}`,
      `Delivery Address: ${details.address}`,
      `Price: ${PRICE}`,
      `Delivery: ${delivery}`,
      'Payment: Pay on delivery',
      'Return: 7-day return window',
      '',
      'Please confirm my order and delivery details.'
    ].join('\n');

    try {
      const existing = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      existing.push({
        ref,
        ...details,
        whatsapp,
        price: PRICE,
        delivery,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(existing));
    } catch (_) {}

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  });
})();
