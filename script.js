// Dynamic copyright year (falls back to hardcoded 2026 without JS)
document.getElementById('copyright-year').textContent = new Date().getFullYear();

// Mobile menu: toggle, Esc, click-outside, close on link click
(function () {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var menu = document.getElementById('mobile-menu');

    function setOpen(open) {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    }

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(!menu.classList.contains('open'));
    });

    menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    document.addEventListener('click', function (e) {
        if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
            setOpen(false);
        }
    });
})();

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Scroll-reveal animations. Content is visible by default (CSS only
// hides .reveal under html.js-enabled + motion allowed), so a JS or
// IntersectionObserver failure never leaves the page blank.
(function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var elements = document.querySelectorAll('.reveal');

    if (reduceMotion || !('IntersectionObserver' in window)) {
        elements.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
})();

// Contact form: posts to Web3Forms (static-site form backend), so no email
// address is exposed in the page source. The access key is public by design:
// it only allows sending a message to the inbox it was registered with.
// Get one (free) at https://web3forms.com and paste it below.
(function () {
    var WEB3FORMS_ACCESS_KEY = '690ba897-7308-4bac-b815-5aa51b38e6de';
    var ENDPOINT = 'https://api.web3forms.com/submit';

    var form = document.getElementById('contact-form');
    if (!form) return;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function show(msg, isError) {
        status.textContent = msg;
        status.classList.toggle('is-error', Boolean(isError));
    }

    function isValid(data) {
        return data.get('name').trim() && EMAIL_RE.test(data.get('email').trim()) && data.get('message').trim();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = new FormData(form);

        if (data.get('botcheck')) return; // honeypot tripped: silently drop
        if (!isValid(data)) { show(form.dataset.msgInvalid, true); return; }
        if (WEB3FORMS_ACCESS_KEY.indexOf('YOUR_') === 0) { show(form.dataset.msgError, true); return; }

        data.append('access_key', WEB3FORMS_ACCESS_KEY);
        data.delete('botcheck');
        button.disabled = true;
        show(form.dataset.msgSending, false);

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.fromEntries(data))
        })
            .then(function (res) { return res.json().then(function (body) { return res.ok && body.success; }); })
            .then(function (ok) {
                if (!ok) throw new Error('send failed');
                form.reset();
                show(form.dataset.msgSuccess, false);
                if (window.umami) window.umami.track('contact-form-sent');
            })
            .catch(function () { show(form.dataset.msgError, true); })
            .finally(function () { button.disabled = false; });
    });
})();
