(() => {
  'use strict';

  // Runs in YouTube's own page context, the only place that can see the data
  // YouTube keeps on each "Save to..." row. It copies each row's playlist ID
  // onto the row as an attribute so content.js can link to the playlist.
  // Nothing is stored or sent anywhere.
  const LISTS = 'ytd-popup-container yt-list-view-model, ytd-add-to-playlist-renderer #playlists';
  const ID_ATTR = 'data-yps-playlist-id';
  const VALID_ID = /^[A-Za-z0-9_-]{2,64}$/;

  function findPlaylistId(data, depth = 0) {
    if (!data || typeof data !== 'object' || depth > 14) return null;
    if (typeof data.playlistId === 'string') return data.playlistId;
    for (const key of Object.keys(data)) {
      const found = findPlaylistId(data[key], depth + 1);
      if (found) return found;
    }
    return null;
  }

  function tagRows() {
    for (const list of document.querySelectorAll(LISTS)) {
      // The closed dialog stays in the page; only look at it while it's open.
      if (list.offsetParent === null) continue;
      for (const row of list.children) {
        // YouTube can reuse a row for a different playlist, so always refresh.
        const id = findPlaylistId(row.data || row.__data);
        if (id && VALID_ID.test(id)) {
          if (row.getAttribute(ID_ATTR) !== id) row.setAttribute(ID_ATTR, id);
        } else if (row.hasAttribute(ID_ATTR)) {
          row.removeAttribute(ID_ATTR);
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
      tagRows();
    }, 120);
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    // The dialog opening shows up as these attributes changing.
    attributes: true,
    attributeFilter: ['hidden', 'aria-hidden'],
  });

  tagRows();
})();
