(() => {
  'use strict';

  const WA_NUMBER = '2348146503700';
  const STORAGE_KEY = 'emmytechDeskCustomerDetailsV2';
  const ORDER_KEY = 'emmytechDeskOrders';
  const modal = document.getElementById('et2OrderModal');
  const form = document.getElementById('et2OrderForm');
  const savedNotice = document.getElementById('et2SavedNotice');
  const delivery = document.getElementById('et2DeliveryStatus');

  if (!modal || !form) return;

  const getSaved = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (_) {
      return null;
    }
  };

  const setSaved = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  };

  const collect = () => {
    const fd = new FormData(form);
    return {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      whatsapp: String(fd.get('whatsapp') || '').trim(),
      state: String(fd.get('state') || '').trim(),
      city: String(fd.get('city') || '').trim(),
      address: String(fd.get('address') || '').trim(),
      submitted: Boolean(getSaved()?.submitted),
      updatedAt: new Date().toISOString()
    };
  };

  const fillSaved = () => {
    const saved = getSaved();
    if (!saved) {
      savedNotice.hidden = true;
      return;
    }
    ['name','phone','whatsapp','state','city','address'].forEach((key) => {
      if (form.elements[key] && saved[key] != null) form.elements[key].value = saved[key];
    });
    savedNotice.hidden = !saved.submitted;
    updateDelivery();
  };

  const updateDelivery = () => {
    const city = String(form.elements.city?.value || '').trim().toLowerCase();
    if (!city) {
      delivery.innerHTML = '<span>Delivery</span><strong>Enter your city to see delivery information.</strong>';
    } else if (city.includes('ibadan')) {
      delivery.innerHTML = '<span>Delivery</span><strong>FREE delivery within Ibadan · typically 1–2 days.</strong>';
    } else {
      delivery.innerHTML = '<span>Delivery</span><strong>Outside Ibadan: delivery fee applies and is confirmed before dispatch.</strong>';
    }
  };

  const openModal = () => {
    fillSaved();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('et2-modal-open');
    setTimeout(() => {
      const firstEmpty = ['name','phone','state','city','address']
        .map((n) => form.elements[n])
        .find((el) => el && !String(el.value || '').trim());
      firstEmpty?.focus();
    }, 120);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('et2-modal-open');
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a[href="#order"], [data-order-trigger], .et2-open-order');
    if (trigger) {
      event.preventDefault();
      openModal();
      return;
    }
    if (event.target.closest('[data-et2-close]')) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('input', () => {
    const data = collect();
    setSaved(data);
    if (document.activeElement === form.elements.city) updateDelivery();
  });
  form.addEventListener('change', () => {
    setSaved(collect());
    updateDelivery();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = collect();
    data.submitted = true;
    data.updatedAt = new Date().toISOString();
    setSaved(data);

    const ref = 'ETD-' + Date.now().toString(36).toUpperCase().slice(-7);
    const wa = data.whatsapp || data.phone;
    const ibadan = data.city.toLowerCase().includes('ibadan');
    const deliveryText = ibadan
      ? 'FREE delivery within Ibadan'
      : 'Delivery fee to be confirmed before dispatch';

    const message = [
      'Hello Emmy Technology, I want to order the Foldable Workspace Desk.',
      '',
      'Order Ref: ' + ref,
      'Name: ' + data.name,
      'Phone: ' + data.phone,
      'WhatsApp: ' + wa,
      'State: ' + data.state,
      'City / Area: ' + data.city,
      'Delivery Address: ' + data.address,
      '',
      'Price: ₦64,900',
      'Payment: Pay on delivery',
      'Delivery: ' + deliveryText
    ].join('\n');

    try {
      const old = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
      if (Array.isArray(old)) {
        old.push({...data, ref, createdAt:new Date().toISOString()});
        localStorage.setItem(ORDER_KEY, JSON.stringify(old.slice(-20)));
      }
    } catch (_) {}

    savedNotice.hidden = false;
    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
  });

  fillSaved();
})();