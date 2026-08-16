(() => {
  const WHATSAPP_NUMBER = '2348146503700';
  const PRICE = '₦64,900';
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

  const colourChips = qa('.colour-chip');
  const colourRadios = qa('input[name="colour"]');
  const syncColour = colour => {
    const normalized = String(colour || '').toLowerCase() === 'white' ? 'white' : 'black';
    colourChips.forEach(chip => chip.classList.toggle('active', chip.dataset.colour === normalized));
    const matching = q(`input[name="colour"][value="${normalized === 'white' ? 'White' : 'Black'}"]`);
    if (matching) matching.checked = true;
  };
  colourChips.forEach(button => button.addEventListener('click', () => syncColour(button.dataset.colour)));
  colourRadios.forEach(radio => radio.addEventListener('change', () => syncColour(radio.value)));
  syncColour(q('input[name="colour"]:checked')?.value || 'Black');

  const cityInput = q('#cityInput');
  const deliveryStatus = q('#deliveryStatus strong');
  const updateDelivery = () => {
    if (!deliveryStatus) return;
    const city = (cityInput?.value || '').trim().toLowerCase();
    if (!city) deliveryStatus.textContent = 'Enter your city to see delivery information.';
    else if (city.includes('ibadan')) deliveryStatus.textContent = 'FREE delivery within Ibadan.';
    else deliveryStatus.textContent = 'Outside Ibadan: delivery fee applies and will be confirmed before dispatch.';
  };
  cityInput?.addEventListener('input', updateDelivery);
  updateDelivery();

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
  qa('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const ref = makeOrderRef();
    const city = String(data.get('city') || '').trim();
    const delivery = city.toLowerCase().includes('ibadan') ? 'FREE delivery within Ibadan' : 'Delivery fee applies (to be confirmed)';

    latestMessage = [
      'Hello Emmy Technology, I want to order the Foldable Workspace Desk.',
      '',
      `Order Ref: ${ref}`,
      `Name: ${String(data.get('name') || '').trim()}`,
      `Phone: ${String(data.get('phone') || '').trim()}`,
      `WhatsApp: ${String(data.get('whatsapp') || data.get('phone') || '').trim()}`,
      `State: ${String(data.get('state') || '').trim()}`,
      `City / Area: ${city}`,
      `Delivery Address: ${String(data.get('address') || '').trim()}`,
      `Price: ${PRICE}`,
      `Delivery: ${delivery}`,
      'Payment: Pay on delivery',
      'Return: 7-day return window',
      '',
      'Please confirm my order and delivery details.'
    ].join('\n');

    try {
      const existing = JSON.parse(localStorage.getItem('emmytechDeskOrders') || '[]');
      existing.push({
        ref,
        name: String(data.get('name') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        whatsapp: String(data.get('whatsapp') || data.get('phone') || '').trim(),
        state: String(data.get('state') || '').trim(),
        city,
        address: String(data.get('address') || '').trim(),
        price: PRICE,
        delivery,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('emmytechDeskOrders', JSON.stringify(existing));
    } catch (_) {}

    if (orderRefEl) orderRefEl.textContent = ref;
    if (whatsappLink) whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(latestMessage)}`;
    openModal();
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(latestMessage);
      const original = copyButton.textContent;
      copyButton.textContent = 'Copied ✓';
      setTimeout(() => { copyButton.textContent = original; }, 1600);
    } catch (_) {
      window.prompt('Copy your order details:', latestMessage);
    }
  });
})();



/* === EMMYTECH SMART ORDER JS START === */

(() => {

    const form =
        document.querySelector('#orderForm');

    if (!form) {
        console.warn(
            'EmmyTech smart order: #orderForm was not found.'
        );
        return;
    }


    const STORAGE_KEY =
        'emmytechDeskCustomerDetails';


    /* ======================================================
       CREATE FORM PLACEHOLDER
    ====================================================== */

    const originalParent =
        form.parentNode;

    const placeholder =
        document.createElement('div');

    placeholder.className =
        'order-form-popup-placeholder';

    placeholder.innerHTML = `
        <strong>Ready to order?</strong>

        <p>
            Your order form opens in a clean popup,
            so you can complete your details without
            losing your place on the page.
        </p>

        <button
            type="button"
            data-order-trigger
        >
            Open order form
        </button>
    `;

    originalParent.insertBefore(
        placeholder,
        form
    );


    /* ======================================================
       CREATE POPUP
    ====================================================== */

    const modal =
        document.createElement('div');

    modal.className =
        'quick-order-modal';

    modal.id =
        'quickOrderModal';

    modal.setAttribute(
        'aria-hidden',
        'true'
    );

    modal.innerHTML = `

        <div
            class="quick-order-backdrop"
            data-quick-order-close
        ></div>

        <div
            class="quick-order-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quickOrderTitle"
        >

            <div class="quick-order-header">

                <div class="quick-order-heading">

                    <span class="quick-order-eyebrow">
                        FOLDABLE WORKSPACE DESK
                    </span>

                    <h2 id="quickOrderTitle">
                        Complete your order.
                    </h2>

                    <p>
                        Fill this once. Your details will be
                        remembered on this device so you do
                        not have to type them again.
                    </p>

                    <div class="quick-order-price">
                        Launch price
                        <strong>₦64,900</strong>
                        · Pay on delivery
                    </div>

                </div>

                <button
                    type="button"
                    class="quick-order-close"
                    data-quick-order-close
                    aria-label="Close order form"
                >
                    ×
                </button>

            </div>


            <div
                class="quick-order-saved"
                id="quickOrderSaved"
            >

                <div class="quick-order-saved-icon">
                    ✓
                </div>

                <div>
                    <strong>Your details are saved.</strong>

                    Review them below and continue.
                    You do not need to type everything again.
                </div>

            </div>


            <div
                class="quick-order-mount"
                id="quickOrderMount"
            ></div>

        </div>
    `;

    document.body.appendChild(modal);


    const mount =
        modal.querySelector('#quickOrderMount');

    const savedNotice =
        modal.querySelector('#quickOrderSaved');


    /* ======================================================
       READ SAVED CUSTOMER
    ====================================================== */

    const readSavedDetails = () => {

        try {

            const direct =
                JSON.parse(
                    localStorage.getItem(STORAGE_KEY)
                    || 'null'
                );

            if (
                direct &&
                typeof direct === 'object'
            ) {
                return direct;
            }

        }
        catch (_) {}


        /*
         * Compatibility with customers who completed
         * the old form before this update.
         */

        try {

            const previousOrders =
                JSON.parse(
                    localStorage.getItem(
                        'emmytechDeskOrders'
                    ) || '[]'
                );

            if (
                Array.isArray(previousOrders) &&
                previousOrders.length
            ) {

                const last =
                    previousOrders[
                        previousOrders.length - 1
                    ];

                return {
                    name:
                        last.name || '',

                    phone:
                        last.phone || '',

                    whatsapp:
                        last.whatsapp || '',

                    colour:
                        last.colour || 'Black',

                    state:
                        last.state || '',

                    city:
                        last.city || '',

                    address:
                        last.address || '',

                    submitted:true
                };
            }

        }
        catch (_) {}


        return null;
    };


    /* ======================================================
       APPLY SAVED CUSTOMER TO FORM
    ====================================================== */

    const applySavedDetails = () => {

        const saved =
            readSavedDetails();

        if (!saved) {

            savedNotice.classList.remove(
                'is-visible'
            );

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.textContent =
                    'Place order · Pay on delivery';
            }

            return;
        }


        const names = [
            'name',
            'phone',
            'whatsapp',
            'state',
            'city',
            'address'
        ];


        names.forEach(name => {

            const field =
                form.elements[name];

            if (
                field &&
                saved[name] !== undefined
            ) {
                field.value =
                    saved[name] || '';
            }

        });


        if (saved.colour) {

            const radio =
                [...form.querySelectorAll(
                    'input[name="colour"]'
                )].find(
                    item =>
                        item.value.toLowerCase()
                        ===
                        String(
                            saved.colour
                        ).toLowerCase()
                );

            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(
                    new Event(
                        'change',
                        { bubbles:true }
                    )
                );
            }

        }


        /*
         * Refresh delivery information after
         * restoring the city.
         */

        const city =
            form.elements.city;

        if (city) {

            city.dispatchEvent(
                new Event(
                    'input',
                    { bubbles:true }
                )
            );

        }


        if (saved.submitted) {

            savedNotice.classList.add(
                'is-visible'
            );

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.textContent =
                    'Continue with saved details';
            }

        }
        else {

            savedNotice.classList.remove(
                'is-visible'
            );

        }

    };


    /* ======================================================
       SAVE FORM
    ====================================================== */

    const saveDetails = (
        submitted = false
    ) => {

        const get =
            name =>
                form.elements[name]?.value?.trim()
                || '';


        const selectedColour =
            form.querySelector(
                'input[name="colour"]:checked'
            )?.value || 'Black';


        let existing = {};

        try {

            existing =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || '{}'
                );

        }
        catch (_) {}


        const payload = {

            name:get('name'),

            phone:get('phone'),

            whatsapp:get('whatsapp'),

            colour:selectedColour,

            state:get('state'),

            city:get('city'),

            address:get('address'),

            submitted:
                submitted
                ? true
                : Boolean(
                    existing.submitted
                ),

            updatedAt:
                new Date().toISOString()

        };


        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(payload)
            );

        }
        catch (_) {}

    };


    /* save as customer types */

    form.addEventListener(
        'input',
        () => saveDetails(false)
    );

    form.addEventListener(
        'change',
        () => saveDetails(false)
    );


    /* ======================================================
       OPEN ORDER FORM
    ====================================================== */

    const openQuickOrder = () => {

        applySavedDetails();

        mount.appendChild(form);

        form.classList.add(
            'is-visible'
        );

        modal.classList.add(
            'is-open'
        );

        modal.setAttribute(
            'aria-hidden',
            'false'
        );

        document.body.classList.add(
            'quick-order-open'
        );


        setTimeout(() => {

            const firstEmpty =
                [
                    'name',
                    'phone',
                    'state',
                    'city',
                    'address'
                ]
                .map(
                    name =>
                        form.elements[name]
                )
                .find(
                    element =>
                        element &&
                        !String(
                            element.value || ''
                        ).trim()
                );

            if (firstEmpty) {
                firstEmpty.focus();
            }

        }, 180);

    };


    /* ======================================================
       CLOSE ORDER FORM
    ====================================================== */

    const closeQuickOrder = () => {

        modal.classList.remove(
            'is-open'
        );

        modal.setAttribute(
            'aria-hidden',
            'true'
        );

        document.body.classList.remove(
            'quick-order-open'
        );


        /*
         * Put the same form back into its
         * original section.
         *
         * We MOVE it instead of cloning it so the
         * existing EmmyTech WhatsApp submission
         * handler remains connected.
         */

        placeholder.after(form);

    };


    /* ======================================================
       EVERY ORDER CTA OPENS THIS FORM
    ====================================================== */

    document.addEventListener(
        'click',
        event => {

            const trigger =
                event.target.closest(
                    'a[href="#order"], [data-order-trigger]'
                );

            if (!trigger) return;

            event.preventDefault();

            openQuickOrder();

        }
    );


    /* ======================================================
       CLOSE CONTROLS
    ====================================================== */

    modal.addEventListener(
        'click',
        event => {

            if (
                event.target.closest(
                    '[data-quick-order-close]'
                )
            ) {

                event.preventDefault();

                closeQuickOrder();

            }

        }
    );


    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Escape' &&
                modal.classList.contains(
                    'is-open'
                )
            ) {

                closeQuickOrder();

            }

        }
    );


    /* ======================================================
       SUBMISSION
    ====================================================== */

    form.addEventListener(
        'submit',
        () => {

            if (
                !form.checkValidity()
            ) {
                return;
            }


            /*
             * Store completed customer details.
             */

            saveDetails(true);


            /*
             * The original app.js handler now:
             *
             * 1. creates the order reference
             * 2. creates the WhatsApp text
             * 3. URL-encodes the message
             * 4. displays Continue to WhatsApp
             *
             * Close this form popup immediately after
             * that original handler has run.
             */

            setTimeout(
                closeQuickOrder,
                0
            );

        }
    );


    /* ======================================================
       RESTORE PREVIOUS CUSTOMER ON PAGE LOAD
    ====================================================== */

    applySavedDetails();


})();

/* === EMMYTECH SMART ORDER JS END === */


