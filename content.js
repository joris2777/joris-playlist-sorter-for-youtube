(() => {
  'use strict';

  // If two copies are installed (say the store version and a GitHub one), only
  // the first to start works on the page; the other stays idle.
  const MARKER = 'data-joris-playlist-sorter';
  const DUPLICATE = 'data-joris-playlist-sorter-duplicate';
  if (document.documentElement.hasAttribute(MARKER)) {
    // Let the running copy know, so it can tell the user.
    document.documentElement.setAttribute(DUPLICATE, '');
    return;
  }
  document.documentElement.setAttribute(MARKER, chrome.runtime.getManifest().version);

  // YouTube has shipped two layouts of the "Save to..." dialog; both are handled.
  // If YouTube changes its markup again, these selectors are what to update.
  const LAYOUTS = [
    {
      // Classic Polymer dialog
      list: 'ytd-add-to-playlist-renderer #playlists',
      item: 'ytd-playlist-add-to-option-renderer',
      title: '#label',
    },
    {
      // Newer "view model" sheet. The same list element is used by other menus,
      // so only lists inside a popup that has a header panel are touched.
      list: 'ytd-popup-container yt-list-view-model',
      item: 'yt-list-item-view-model',
      title: '.ytListItemViewModelTitle, .yt-list-item-view-model__title, .yt-list-item-view-model-wiz__title',
      needsHeader: true,
    },
  ];

  // The "Playlists" tab of a channel (youtube.com/@name/playlists). YouTube only
  // offers date-based sorting there, so it gets an A–Z toggle and a filter too.
  const LIBRARY = {
    list: 'ytd-browse:not([hidden]) ytd-grid-renderer #items',
    item: 'yt-lockup-view-model',
    title: 'h3[title], .ytLockupMetadataViewModelTitle',
    more: 'ytd-continuation-item-renderer',
  };
  const isPlaylistsPage = () => /\/playlists\/?$/.test(location.pathname);
  // Only your own channel shows links to YouTube Studio ("Customize channel").
  const isOwnChannel = () =>
    location.pathname.startsWith('/feed/') ||
    !!document.querySelector('ytd-browse:not([hidden]) a[href*="studio.youtube.com"]');
  // Stop pulling in more playlists after this many (YouTube loads 30 at a time).
  const AUTOLOAD_LIMIT = 600;

  // Playlists that stay at the top instead of being sorted in.
  const PINNED = [/^watch later$/i];

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const filters = new WeakMap(); // list element -> { input, bar, ... }
  const owners = new WeakMap(); // bar -> the list element it belongs to

  const pinRank = (title) => (PINNED.some((re) => re.test(title)) ? 0 : 1);

  function getItems(listEl, layout) {
    return [...listEl.children]
      .filter((child) => child.matches(layout.item) || child.querySelector(layout.item))
      .map((el) => {
        const titleEl = el.querySelector(layout.title);
        return { el, title: (titleEl || el).textContent.replace(/\s+/g, ' ').trim() };
      });
  }

  function hasHeader(listEl) {
    const popup = listEl.closest('tp-yt-iron-dropdown, tp-yt-paper-dialog, yt-sheet-view-model');
    return !!popup && !!popup.querySelector('yt-panel-header-view-model');
  }

  function sortList(listEl, items) {
    items
      .slice()
      .sort((a, b) => pinRank(a.title) - pinRank(b.title) || collator.compare(a.title, b.title))
      .forEach(({ el }, i) => {
        if (el.style.order !== String(i)) el.style.order = String(i);
      });
  }

  function applyFilter(listEl, layout, query) {
    const q = query.trim().toLowerCase();
    for (const { el, title } of getItems(listEl, layout)) {
      el.classList.toggle('yps-hidden', !!q && !title.toLowerCase().includes(q));
    }
  }

  function firstVisible(listEl, layout) {
    return getItems(listEl, layout)
      .filter(({ el }) => !el.classList.contains('yps-hidden'))
      .sort((a, b) => Number(a.el.style.order) - Number(b.el.style.order))[0];
  }

  // Older copies (before 1.1.1) don't set the marker. If one already put its
  // bar in front of this list, leave the list to it rather than add a second.
  const hasForeignBar = (anchor) => {
    const prev = anchor.previousElementSibling;
    return !!prev && prev.classList.contains('yps-filter-bar') && !owners.has(prev);
  };

  const duplicateInstalled = () => document.documentElement.hasAttribute(DUPLICATE);

  // A one-line hint in a filter bar (ours, or an older copy's) when the
  // extension is installed twice, e.g. from the store and from GitHub.
  function addDuplicateNote(bar) {
    if (bar.querySelector('.yps-dup-note')) return;
    const note = document.createElement('div');
    note.className = 'yps-dup-note';
    note.textContent =
      "Two copies of Joris Playlist Sorter are installed. Remove one on your browser's Extensions page.";
    bar.appendChild(note);
  }

  function ensureFilter(listEl, layout) {
    let state = filters.get(listEl);
    if (state && state.input.isConnected) return state;
    if (hasForeignBar(listEl)) {
      addDuplicateNote(listEl.previousElementSibling);
      return null;
    }

    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'yps-filter';
    input.placeholder = 'Filter playlists… (Enter toggles the first match)';
    input.addEventListener('input', () => applyFilter(listEl, layout, input.value));
    input.addEventListener('keydown', (e) => {
      // With nothing typed, let Escape through so YouTube can close the dialog.
      if (e.key === 'Escape' && !input.value) return;
      // Keep YouTube's keyboard shortcuts (k, f, m, /, …) from firing while typing.
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        input.value = '';
        applyFilter(listEl, layout, '');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Only act on a search; a stray Enter must not toggle "Watch later".
        if (!input.value.trim()) return;
        const match = firstVisible(listEl, layout);
        if (match) {
          const target = match.el.querySelector(
            'tp-yt-paper-checkbox, [role="checkbox"], button, [role="menuitem"], [role="option"]'
          );
          (target || match.el).click();
        }
      }
    });
    const bar = document.createElement('div');
    bar.className = 'yps-filter-bar';
    bar.appendChild(input);
    // The newer sheet treats any click that bubbles up from inside the list area
    // as a choice and closes itself, so clicks on the filter must stop here.
    for (const type of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) {
      bar.addEventListener(type, (e) => e.stopPropagation());
    }
    listEl.parentElement.insertBefore(bar, listEl);

    state = { input, bar, wasHidden: true };
    filters.set(listEl, state);
    owners.set(bar, listEl);
    return state;
  }

  // A small ↗ link on each "Save to..." row that opens that playlist in a new
  // tab. page.js puts the playlist ID on the row as data-yps-playlist-id.
  const VALID_ID = /^[A-Za-z0-9_-]{2,64}$/;
  function ensureOpenLink(row) {
    const id = row.getAttribute('data-yps-playlist-id');
    let link = row.querySelector('.yps-open');
    if (!id || !VALID_ID.test(id)) {
      if (link) link.remove();
      return;
    }
    const href = '/playlist?list=' + encodeURIComponent(id);
    if (link) {
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      return;
    }
    link = document.createElement('a');
    link.className = 'yps-open';
    link.setAttribute('href', href);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Open this playlist in a new tab';
    link.setAttribute('aria-label', 'Open playlist in a new tab');
    link.textContent = '↗';
    // Keep YouTube from treating the click as "save to this playlist".
    for (const type of ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) {
      link.addEventListener(type, (e) => e.stopPropagation());
    }
    row.classList.add('yps-has-open');
    row.appendChild(link);
  }

  // The pinned bar needs an opaque background so playlists don't show through
  // it; copy it from the dialog so it matches both light and dark themes.
  function matchBackground(bar) {
    for (let el = bar.parentElement; el; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
        if (bar.style.backgroundColor !== bg) bar.style.backgroundColor = bg;
        return;
      }
    }
  }

  // YouTube moves focus onto the first playlist as the dialog finishes opening,
  // which can land after our focus. Take it back once if that happened.
  function focusFilter(input) {
    input.focus({ preventScroll: true });
    setTimeout(() => {
      const popup = input.closest('ytd-popup-container');
      const active = document.activeElement;
      if (input.isConnected && active !== input && popup && popup.contains(active)) {
        input.focus({ preventScroll: true });
      }
    }, 400);
  }

  function ensureLibraryBar(listEl) {
    let state = filters.get(listEl);
    if (state && state.bar.isConnected) return state;
    const anchor = listEl.closest('ytd-grid-renderer') || listEl;
    if (hasForeignBar(anchor)) {
      addDuplicateNote(anchor.previousElementSibling);
      return null;
    }

    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'yps-filter';
    input.placeholder = 'Filter playlists… (Enter opens the first match)';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'yps-sort-toggle';
    toggle.title = 'Sort playlists alphabetically';
    const bar = document.createElement('div');
    bar.className = 'yps-filter-bar yps-library-bar';
    bar.append(input, toggle);

    state = { input, bar, toggle, sorted: true };
    const render = () => {
      toggle.textContent = state.sorted ? 'A–Z ✓' : 'A–Z';
      toggle.setAttribute('aria-pressed', String(state.sorted));
    };
    toggle.addEventListener('click', () => {
      state.sorted = !state.sorted;
      render();
      // Off: hand the order back to YouTube's own "Sort by" menu.
      if (!state.sorted) for (const { el } of getItems(listEl, LIBRARY)) el.style.order = '';
      runLibrary();
    });
    input.addEventListener('input', () => applyFilter(listEl, LIBRARY, input.value));
    input.addEventListener('keydown', (e) => {
      // Keep YouTube's keyboard shortcuts from firing while typing.
      e.stopPropagation();
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        applyFilter(listEl, LIBRARY, '');
      } else if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        const match = firstVisible(listEl, LIBRARY);
        // Prefer the playlist page ("View full playlist") over playing its first video.
        const link = match &&
          (match.el.querySelector('a[href^="/playlist?list="]') || match.el.querySelector('a[href*="list="]'));
        if (link) link.click();
      }
    });
    render();

    const grid = listEl.closest('ytd-grid-renderer') || listEl;
    grid.parentElement.insertBefore(bar, grid);
    filters.set(listEl, state);
    owners.set(bar, listEl);
    return state;
  }

  function runLibrary() {
    if (!isPlaylistsPage()) {
      // YouTube reuses the page when switching channel tabs; drop our bar there.
      for (const bar of document.querySelectorAll('.yps-library-bar')) bar.remove();
      return;
    }
    for (const listEl of document.querySelectorAll(LIBRARY.list)) {
      const items = getItems(listEl, LIBRARY);
      if (items.length < 2) continue;

      const state = ensureLibraryBar(listEl);
      if (!state) continue;
      if (state.sorted) sortList(listEl, items);
      // YouTube loads playlists 30 at a time as its "load more" spinner scrolls
      // into view. A–Z needs all of them, so on your own channel show the
      // spinner first and YouTube keeps loading, up to a cap. On other channels
      // only what you've scrolled through is sorted.
      const more = [...listEl.children].find((child) => child.matches(LIBRARY.more));
      if (more) {
        const autoLoad = state.sorted && isOwnChannel() && items.length < AUTOLOAD_LIMIT;
        // Sorted items take orders 0, 1, 2…, so an unset order (0) would put
        // the spinner near the top too; give it an explicit last place instead.
        const order = autoLoad ? '-1' : state.sorted ? String(items.length + 1) : '';
        if (more.style.order !== order) more.style.order = order;
      }
      if (state.input.value) applyFilter(listEl, LIBRARY, state.input.value);
      if (duplicateInstalled()) addDuplicateNote(state.bar);
      matchBackground(state.bar);
    }
  }

  // YouTube sometimes swaps a list for a brand-new element, which gets its own
  // bar. Remove our bars whose list has left the page so they don't pile up.
  // Bars we didn't create (e.g. another installed copy) are left alone.
  function removeOrphanBars() {
    for (const bar of document.querySelectorAll('.yps-filter-bar')) {
      const listEl = owners.get(bar);
      if (!listEl) continue;
      const state = filters.get(listEl);
      if (!listEl.isConnected || !state || state.bar !== bar) bar.remove();
    }
  }

  function run() {
    removeOrphanBars();
    runLibrary();
    for (const layout of LAYOUTS) {
      for (const listEl of document.querySelectorAll(layout.list)) {
        if (layout.needsHeader && !hasHeader(listEl)) continue;

        // YouTube keeps the closed dialog in the page. Skip it (the items keep
        // their sort order), but reset the filter so the next open starts fresh.
        if (listEl.offsetParent === null) {
          const state = filters.get(listEl);
          if (state) {
            if (state.input.value) {
              state.input.value = '';
              applyFilter(listEl, layout, '');
            }
            state.wasHidden = true;
          }
          continue;
        }

        const items = getItems(listEl, layout);
        if (items.length < 2) continue;

        sortList(listEl, items);
        listEl.classList.add('yps-sorted');
        const state = ensureFilter(listEl, layout);
        if (!state) continue;
        for (const { el } of items) ensureOpenLink(el);
        if (duplicateInstalled()) addDuplicateNote(state.bar);
        matchBackground(state.bar);
        if (state.input.value) applyFilter(listEl, layout, state.input.value);
        // Focus the filter each time the dialog opens.
        if (state.wasHidden) {
          state.wasHidden = false;
          focusFilter(state.input);
        }
      }
    }
  }

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      run();
    }, 150);
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    // data-yps-playlist-id: page.js tagged a row, so its ↗ link can be added.
    attributeFilter: ['hidden', 'aria-hidden', 'data-yps-playlist-id'],
  });

  run();
})();
