(() => {
  'use strict';

  /* =========================================================
     EMMYTECH FOLDABLE DESK ANALYTICS
     ========================================================= */

  const SUPABASE_URL =
    'https://rdlabyseenutmfjaceyt.supabase.co';

  /*
    Publishable key only.
    NEVER put the Supabase secret key in this browser file.
  */
  const SUPABASE_KEY =
    'sb_publishable_SSsWmRiTioya7X02hy8mdA_BCGcHJ7v';

  const VISITOR_STORAGE =
    'emmytechDeskVisitorId';

  const SESSION_STORAGE =
    'emmytechDeskAnalyticsSession';

  const ORDER_STORAGE =
    'emmytechDeskBackendOrder';


  /* =========================================================
     UTILITY
     ========================================================= */

  const uniqueId = (prefix) => {
    try {
      return `${prefix}${crypto.randomUUID()}`;
    } catch (_) {
      return (
        `${prefix}${Date.now().toString(36)}_` +
        Math.random().toString(36).slice(2)
      );
    }
  };


  const cleanLabel = (value) =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);


  const pageURL = () =>
    window.location.href.slice(0, 1000);


  /* =========================================================
     VISITOR ID
     Persistent across future visits on this browser.
     ========================================================= */

  let visitorId =
    localStorage.getItem(VISITOR_STORAGE);

  if (!visitorId) {
    visitorId = uniqueId('v_');

    localStorage.setItem(
      VISITOR_STORAGE,
      visitorId
    );
  }


  /* =========================================================
     SESSION ID
     A fresh browser tab/session gets its own session.
     ========================================================= */

  let sessionKey =
    sessionStorage.getItem(SESSION_STORAGE);

  if (!sessionKey) {
    sessionKey = uniqueId('s_');

    sessionStorage.setItem(
      SESSION_STORAGE,
      sessionKey
    );
  }


  /* =========================================================
     ATTRIBUTION
     ========================================================= */

  const params =
    new URLSearchParams(location.search);

  const attribution = {
    utm_source:
      params.get('utm_source') || null,

    utm_medium:
      params.get('utm_medium') || null,

    utm_campaign:
      params.get('utm_campaign') || null,

    utm_content:
      params.get('utm_content') || null,

    utm_term:
      params.get('utm_term') || null
  };


  /* =========================================================
     DEVICE
     ========================================================= */

  const getDevice = () => {
    const width = window.innerWidth;

    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';

    return 'desktop';
  };


  const getBrowser = () => {
    const ua = navigator.userAgent;

    if (/Edg/i.test(ua)) return 'Edge';
    if (/OPR|Opera/i.test(ua)) return 'Opera';
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Safari/i.test(ua)) return 'Safari';

    return 'Other';
  };


  const getOS = () => {
    const ua = navigator.userAgent;

    if (/Windows/i.test(ua)) return 'Windows';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Mac OS/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';

    return 'Other';
  };


  /* =========================================================
     SUPABASE RPC
     ========================================================= */

  const rpc = async (
    functionName,
    payload,
    options = {}
  ) => {
    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => controller.abort(),
        options.timeout || 4000
      );

    try {
      const response =
        await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
          {
            method: 'POST',

            headers: {
              apikey: SUPABASE_KEY,
              'Content-Type': 'application/json'
            },

            body:
              JSON.stringify(payload),

            signal:
              controller.signal,

            keepalive:
              Boolean(options.keepalive)
          }
        );

      if (!response.ok) {
        const problem =
          await response.text();

        throw new Error(
          `${functionName} ${response.status}: ${problem}`
        );
      }

      const text =
        await response.text();

      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch (_) {
        return text;
      }

    } finally {
      clearTimeout(timer);
    }
  };


  /* =========================================================
     SESSION START
     ========================================================= */

  const sessionReady =
    rpc(
      'desk_start_session',
      {
        p_visitor_id:
          visitorId,

        p_session_key:
          sessionKey,

        p_landing_url:
          pageURL(),

        p_referrer:
          document.referrer || null,

        p_utm_source:
          attribution.utm_source,

        p_utm_medium:
          attribution.utm_medium,

        p_utm_campaign:
          attribution.utm_campaign,

        p_utm_content:
          attribution.utm_content,

        p_utm_term:
          attribution.utm_term,

        p_device_type:
          getDevice(),

        p_browser:
          getBrowser(),

        p_operating_system:
          getOS(),

        p_viewport_width:
          window.innerWidth,

        p_viewport_height:
          window.innerHeight,

        p_user_agent:
          navigator.userAgent
      }
    )
    .catch((error) => {
      console.warn(
        '[Desk Analytics] Session could not start:',
        error
      );

      return null;
    });


  /* =========================================================
     TRACK EVENT
     ========================================================= */

  const track = async (
    eventName,
    details = {},
    options = {}
  ) => {
    await sessionReady;

    try {
      return await rpc(
        'desk_track_event',
        {
          p_session_key:
            sessionKey,

          p_visitor_id:
            visitorId,

          p_event_name:
            eventName,

          p_section_key:
            details.section || null,

          p_element_key:
            details.element || null,

          p_page_url:
            pageURL(),

          p_metadata: {
            ...attribution,

            page_title:
              document.title,

            pathname:
              location.pathname,

            scroll_y:
              Math.round(window.scrollY),

            ...(details.metadata || {})
          }
        },
        options
      );

    } catch (error) {
      console.warn(
        `[Desk Analytics] ${eventName} failed:`,
        error
      );

      return null;
    }
  };


  /* =========================================================
     ORDER RPC
     ========================================================= */

  const submitOrder = async (data) => {
    await sessionReady;

    const result =
      await rpc(
        'desk_submit_order',
        {
          p_session_key:
            sessionKey,

          p_visitor_id:
            visitorId,

          p_full_name:
            String(data.name || '').trim(),

          p_phone:
            String(data.phone || '').trim(),

          p_whatsapp_number:
            String(
              data.whatsapp ||
              data.phone ||
              ''
            ).trim(),

          p_state:
            String(data.state || '').trim(),

          p_city:
            String(data.city || '').trim(),

          p_delivery_address:
            String(data.address || '').trim()
        },
        {
          timeout: 5000
        }
      );


    if (result?.order_id) {
      sessionStorage.setItem(
        ORDER_STORAGE,
        JSON.stringify(result)
      );
    }

    return result;
  };


  const markWhatsAppClick =
    async (orderId) => {
      if (!orderId) return;

      await sessionReady;

      return rpc(
        'desk_mark_whatsapp_click',
        {
          p_order_id:
            orderId,

          p_session_key:
            sessionKey,

          p_visitor_id:
            visitorId
        },
        {
          timeout: 2500,
          keepalive: true
        }
      );
    };


  /* =========================================================
     PAGE VIEW
     ========================================================= */

  track(
    'page_view',
    {
      section: 'page',
      element: 'landing-page'
    }
  );


  /* =========================================================
     SECTION VIEWS
     ========================================================= */

  const seenSections =
    new Set();


  if ('IntersectionObserver' in window) {
    const sectionObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const section =
              entry.target;

            const sectionKey =
              section.id ||
              Array.from(section.classList)
                .find(
                  (name) =>
                    ![
                      'section',
                      'reveal'
                    ].includes(name)
                ) ||
              'section';

            if (
              seenSections.has(sectionKey)
            ) {
              return;
            }

            seenSections.add(sectionKey);

            track(
              'section_view',
              {
                section:
                  sectionKey,

                element:
                  sectionKey
              }
            );
          });
        },
        {
          threshold: 0.3
        }
      );


    document
      .querySelectorAll('main section')
      .forEach(
        (section) =>
          sectionObserver.observe(section)
      );
  }


  /* =========================================================
     SCROLL DEPTH
     ========================================================= */

  const completedScrolls =
    new Set();


  const readScroll = () => {
    const max =
      document.documentElement.scrollHeight -
      window.innerHeight;

    if (max <= 0) return;

    const percentage =
      Math.round(
        (window.scrollY / max) * 100
      );

    [25, 50, 75, 90]
      .forEach((level) => {
        if (
          percentage >= level &&
          !completedScrolls.has(level)
        ) {
          completedScrolls.add(level);

          track(
            `scroll_${level}`,
            {
              section: 'page',
              element: `${level}%`
            }
          );
        }
      });
  };


  window.addEventListener(
    'scroll',
    readScroll,
    {
      passive: true
    }
  );


  /* =========================================================
     IMPORTANT CLICKS
     ========================================================= */

  document.addEventListener(
    'click',
    (event) => {
      const target =
        event.target.closest(
          'a,button,summary'
        );

      if (!target) return;


      const label =
        cleanLabel(
          target.innerText ||
          target.getAttribute('aria-label') ||
          target.getAttribute('href') ||
          target.id ||
          target.className
        );


      const href =
        target.getAttribute('href') || '';


      const isOrderCTA =
        href === '#order' ||
        target.hasAttribute(
          'data-etx-order-trigger'
        ) ||
        target.hasAttribute(
          'data-order-trigger'
        );


      if (isOrderCTA) {
        track(
          'cta_click',
          {
            section: 'order-intent',
            element: label || 'order'
          }
        );

        return;
      }


      /*
        Direct WhatsApp links which are not
        connected to a submitted order.
      */
      if (
        href.includes('wa.me') ||
        href.includes('whatsapp.com')
      ) {
        track(
          'whatsapp_click',
          {
            section: 'direct-whatsapp',
            element: label || 'WhatsApp',
            metadata: {
              linked_order: false
            }
          },
          {
            timeout: 1500,
            keepalive: true
          }
        );

        return;
      }


      /*
        FAQ questions and other useful interactions.
      */
      if (target.tagName === 'SUMMARY') {
        track(
          'cta_click',
          {
            section: 'faq',
            element: label
          }
        );
      }
    },
    true
  );


  /* =========================================================
     VIDEOS
     ========================================================= */

  document
    .querySelectorAll('video')
    .forEach((video, index) => {
      const videoName =
        video.id ||
        video.currentSrc ||
        video.querySelector('source')
          ?.getAttribute('src') ||
        `video-${index + 1}`;


      video.addEventListener(
        'play',
        () => {
          track(
            'video_play',
            {
              section: 'video',
              element: videoName
            }
          );
        }
      );


      video.addEventListener(
        'pause',
        () => {
          if (video.ended) return;

          track(
            'video_pause',
            {
              section: 'video',
              element: videoName,

              metadata: {
                current_time_seconds:
                  Math.round(
                    video.currentTime
                  )
              }
            }
          );
        }
      );


      video.addEventListener(
        'ended',
        () => {
          track(
            'video_complete',
            {
              section: 'video',
              element: videoName
            }
          );
        }
      );
    });


  /* =========================================================
     ORDER MODAL
     ========================================================= */

  const modal =
    document.getElementById(
      'etxOrderModal'
    );


  if (modal) {
    let previouslyOpen = false;

    const observer =
      new MutationObserver(() => {
        const open =
          modal.classList.contains(
            'is-open'
          );

        if (
          open &&
          !previouslyOpen
        ) {
          track(
            'order_modal_open',
            {
              section: 'order',
              element: 'order-modal'
            }
          );
        }

        previouslyOpen = open;
      });


    observer.observe(
      modal,
      {
        attributes: true,
        attributeFilter: ['class']
      }
    );
  }


  /* =========================================================
     ORDER FORM START
     We NEVER send partially typed customer information.
     ========================================================= */

  const orderForm =
    document.getElementById(
      'etxOrderForm'
    );


  let formStarted = false;


  if (orderForm) {
    orderForm.addEventListener(
      'input',
      () => {
        if (formStarted) return;

        formStarted = true;

        track(
          'order_form_start',
          {
            section: 'order',
            element: 'order-form'
          }
        );
      }
    );
  }


  /* =========================================================
     HEARTBEAT
     Gives us a more useful session-duration estimate.
     ========================================================= */

  const heartbeat = () => {
    rpc(
      'desk_touch_session',
      {
        p_session_key:
          sessionKey,

        p_visitor_id:
          visitorId
      },
      {
        timeout: 1500,
        keepalive: true
      }
    ).catch(() => {});
  };


  setInterval(
    () => {
      if (!document.hidden) {
        heartbeat();
      }
    },
    20000
  );


  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        heartbeat();
      }
    }
  );


  window.addEventListener(
    'pagehide',
    () => {
      track(
        'page_exit',
        {
          section: 'page',
          element: 'exit',

          metadata: {
            final_scroll_y:
              Math.round(window.scrollY)
          }
        },
        {
          timeout: 1000,
          keepalive: true
        }
      );
    }
  );


  /* =========================================================
     EXPOSE ONLY THE SAFE ORDER INTEGRATION
     ========================================================= */

  window.EmmyDeskBackend = {
    visitorId,
    sessionKey,
    track,
    submitOrder,
    markWhatsAppClick
  };


  console.info(
    '[EmmyTech Desk] Analytics connected.'
  );

})();