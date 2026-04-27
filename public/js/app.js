/* ============================================================
   GESTION DES STAGES — app.js
   Central JS: sidebar, theme, language, profile, shortcuts
   ============================================================ */

(function () {
  'use strict';

  /* ── Sidebar Toggle ── */
  const sidebar     = document.getElementById('appSidebar');
  const mainArea    = document.getElementById('mainArea');
  const overlay     = document.getElementById('sidebarOverlay');
  const toggleBtns  = document.querySelectorAll('.sidebar-toggle');

  function isMobile() { return window.innerWidth < 992; }

  function openMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleDesktopSidebar() {
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    if (mainArea) mainArea.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isMobile()) {
        sidebar && sidebar.classList.contains('mobile-open')
          ? closeMobileSidebar()
          : openMobileSidebar();
      } else {
        toggleDesktopSidebar();
      }
    });
  });

  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Restore collapsed state on desktop
  if (!isMobile() && localStorage.getItem('sidebarCollapsed') === '1') {
    sidebar && sidebar.classList.add('collapsed');
    mainArea && mainArea.classList.add('sidebar-collapsed');
  }

  window.addEventListener('resize', () => {
    if (!isMobile()) closeMobileSidebar();
  });

  /* ── Active Sidebar Item ── */
  function markActiveSidebarItem() {
    const path = location.pathname;
    document.querySelectorAll('.sidebar-item[data-href]').forEach(el => {
      const href = el.getAttribute('data-href') || '';
      if (href && (path === href || (href !== '/' && path.startsWith(href)))) {
        el.classList.add('active');
        // Expand parent submenu if nested
        const submenu = el.closest('.sidebar-submenu');
        if (submenu) {
          submenu.classList.add('open');
          const parentItem = submenu.previousElementSibling;
          if (parentItem) parentItem.classList.add('open');
        }
      }
    });
  }

  /* ── Sidebar Submenu ── */
  function initSubmenus() {
    document.querySelectorAll('.sidebar-item.has-children').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const submenu = item.nextElementSibling;
        if (!submenu) return;
        const isOpen = submenu.classList.toggle('open');
        item.classList.toggle('open', isOpen);
      });
    });
  }

  /* ── Build Sidebar from API ── */
  function buildSidebar(items) {
    const container = document.getElementById('sidebarItems');
    if (!container) return;
    container.innerHTML = '';

    items.forEach(item => {
      const li = document.createElement('li');

      if (item.children && item.children.length > 0) {
        // Parent with submenu
        const parentLink = document.createElement('a');
        parentLink.className = 'sidebar-item has-children';
        parentLink.setAttribute('data-href', item.link || '#');
        parentLink.href = '#';
        parentLink.innerHTML = `
          <i class="${item.icon || 'bi bi-circle'}"></i>
          <span class="item-label">${item.name}</span>
          <i class="bi bi-chevron-down chevron"></i>`;
        li.appendChild(parentLink);

        const ul = document.createElement('ul');
        ul.className = 'sidebar-submenu';
        item.children.forEach(child => {
          const childLi = document.createElement('li');
          const childLink = document.createElement('a');
          childLink.className = 'sidebar-subitem';
          childLink.href = child.link || '#';
          childLink.setAttribute('data-href', child.link || '#');
          childLink.innerHTML = `<i class="${child.icon || 'bi bi-dot'}"></i><span>${child.name}</span>`;
          childLi.appendChild(childLink);
          ul.appendChild(childLi);
        });
        li.appendChild(ul);
      } else {
        const link = document.createElement('a');
        link.className = 'sidebar-item';
        link.href = item.link || '#';
        link.setAttribute('data-href', item.link || '#');
        link.innerHTML = `
          <i class="${item.icon || 'bi bi-circle'}"></i>
          <span class="item-label">${item.name}</span>`;
        li.appendChild(link);
      }

      container.appendChild(li);
    });

    initSubmenus();
    markActiveSidebarItem();
  }

  /* ── Fetch Sidebar Items ── */
  function fetchSidebar(lang) {
    fetch('/sidebar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang })
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        localStorage.setItem('sidebarItems', JSON.stringify(data));
        buildSidebar(data);
      })
      .catch(err => console.warn('Sidebar fetch error:', err));
  }

  /* ── Language Selector ── */
  function initLanguage() {
    const selects = document.querySelectorAll('.lang-select');
    const stored  = localStorage.getItem('selectedLanguage') || 'fr';

    selects.forEach(sel => {
      sel.value = stored;
      sel.addEventListener('change', function () {
        const lang = this.value;
        localStorage.setItem('selectedLanguage', lang);
        selects.forEach(s => { s.value = lang; });
        fetchSidebar(lang);
      });
    });

    fetchSidebar(stored);
  }

  /* ── Theme Toggle ── */
  function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      updateThemeIcon(btn, theme);
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        document.querySelectorAll('.theme-toggle').forEach(b => updateThemeIcon(b, next));
      });
    });
  }

  function updateThemeIcon(btn, theme) {
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
  }

  /* ── User Profile ── */
  function initProfile() {
    fetch('/connection/profiles')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const nameEls   = document.querySelectorAll('.profile-name');
        const emailEls  = document.querySelectorAll('.profile-email');
        const prenomEls = document.querySelectorAll('.profile-prenom');

        nameEls.forEach(el   => { el.textContent = data.NOM    || ''; });
        prenomEls.forEach(el => { el.textContent = data.PRENOM || ''; });
        emailEls.forEach(el  => { el.textContent = data.EMAIL  || ''; });

        // Full name in topbar
        document.querySelectorAll('.user-name-text').forEach(el => {
          el.textContent = `${data.PRENOM || ''} ${data.NOM || ''}`.trim() || 'Utilisateur';
        });
      })
      .catch(() => {});
  }

  /* ── Logout ── */
  function initLogout() {
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        fetch('/connection/logout')
          .then(() => { window.location.href = '/connection/login'; })
          .catch(() => { window.location.href = '/connection/login'; });
      });
    });
  }

  /* ── User Dropdown ── */
  function initUserDropdown() {
    document.querySelectorAll('.user-avatar-btn').forEach(btn => {
      const menu = btn.nextElementSibling;
      if (!menu) return;

      btn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.user-dropdown-menu.open').forEach(m => m.classList.remove('open'));
    });
  }

  /* ── Keyboard Shortcut: Ctrl+/ focuses search ── */
  function initShortcuts() {
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.topbar-search input[name="q"]');
        if (searchInput) searchInput.focus();
      }
    });
  }

  /* ── Flash message auto-dismiss ── */
  function initFlashDismiss() {
    setTimeout(() => {
      document.querySelectorAll('.alert[data-auto-dismiss]').forEach(el => {
        el.style.transition = 'opacity .5s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
      });
    }, 8000);
  }

  /* ── Page Nav ── */
  function initPageNav() {
    document.querySelectorAll('.page-nav').forEach(nav => {
      const key = nav.getAttribute('data-nav-key');
      const btns = nav.querySelectorAll('.page-nav-btn');
      const layout = nav.closest('.page-nav-layout');
      const panels = layout ? layout.querySelectorAll('.page-panel') : [];
      const stored = key ? localStorage.getItem('nav_' + key) : null;
      if (stored) {
        btns.forEach(b => b.classList.toggle('active', b.getAttribute('data-panel') === stored));
        panels.forEach(p => p.classList.toggle('active', p.id === stored));
      }
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-panel');
          btns.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const panel = document.getElementById(target);
          if (panel) panel.classList.add('active');
          if (key) localStorage.setItem('nav_' + key, target);
        });
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initTheme();
    initProfile();
    initLogout();
    initUserDropdown();
    initShortcuts();
    initFlashDismiss();
    markActiveSidebarItem();
    initPageNav();
  });

})();
