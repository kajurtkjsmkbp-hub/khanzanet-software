// Khanza.NET Portal Main JS

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Copy RAR Password function
  window.copyPassword = function(btn, text) {
    if (!text) text = 'Khanza.NET';
    navigator.clipboard.writeText(text).then(() => {
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check text-green-400 mr-1"></i> Tersalin!';
      btn.classList.add('bg-green-600/30', 'text-green-400', 'border-green-500');
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.classList.remove('bg-green-600/30', 'text-green-400', 'border-green-500');
      }, 2000);
    }).catch(err => {
      prompt('Salin password:', text);
    });
  };

  // Live Search with Debounce
  const searchInput = document.getElementById('navSearchInput');
  const searchResults = document.getElementById('navSearchResults');
  let debounceTimeout = null;

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimeout);

      if (query.length < 2) {
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
        return;
      }

      debounceTimeout = setTimeout(() => {
        fetch(`/api/search-suggest?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              let html = '';
              data.forEach(item => {
                html += `
                  <a href="/software/${item.slug}" class="search-item group">
                    <img src="${item.thumbnail}" alt="${item.title}" class="w-10 h-10 object-cover rounded shadow" onerror="this.src='/uploads/default.png'">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold truncate group-hover:text-white">${item.title}</div>
                      <div class="text-xs text-slate-400 group-hover:text-slate-200 flex items-center gap-2">
                        <span><i class="fa-solid fa-folder text-blue-400 mr-1"></i>${item.category_name || 'Software'}</span>
                        ${item.file_size ? `<span>• ${item.file_size}</span>` : ''}
                      </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-xs text-slate-400 group-hover:text-white"></i>
                  </a>
                `;
              });
              searchResults.innerHTML = html;
              searchResults.classList.remove('hidden');
            } else {
              searchResults.innerHTML = '<div class="p-3 text-sm text-slate-400 text-center">Tidak ada software ditemukan</div>';
              searchResults.classList.remove('hidden');
            }
          })
          .catch(err => {
            console.error('Search error:', err);
          });
      }, 250);
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });

    // Keyboard shortcut '/' to focus search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Lightbox Modal for Screenshots
  const screenshotThumbs = document.querySelectorAll('.screenshot-thumb');
  const imageModal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const closeModal = document.getElementById('closeModal');

  if (screenshotThumbs && imageModal && modalImg) {
    screenshotThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const fullSrc = thumb.getAttribute('data-full') || thumb.src;
        modalImg.src = fullSrc;
        imageModal.classList.remove('hidden');
      });
    });

    if (closeModal) {
      closeModal.addEventListener('click', () => {
        imageModal.classList.add('hidden');
      });
    }

    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        imageModal.classList.add('hidden');
      }
    });
  }

  // Initialize theme icons & bookmark badge
  updateThemeIcons();
  updateBookmarkBadge();
  syncBookmarkButtons();
});

// Theme Switcher Function
window.toggleTheme = function() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
  updateThemeIcons();
};

function updateThemeIcons() {
  const sunIcon = document.getElementById('themeSunIcon');
  const moonIcon = document.getElementById('themeMoonIcon');
  const isDark = document.documentElement.classList.contains('dark');
  if (sunIcon && moonIcon) {
    if (isDark) {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
      moonIcon.classList.add('inline-block');
    } else {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
      sunIcon.classList.add('inline-block');
    }
  }
}

// Bookmarks Helper Functions
window.getBookmarks = function() {
  try {
    return JSON.parse(localStorage.getItem('khanza_bookmarks')) || [];
  } catch (e) {
    return [];
  }
};

window.isBookmarked = function(id) {
  const list = getBookmarks();
  return list.some(item => String(item.id) === String(id));
};

window.toggleBookmark = function(item, btn) {
  let list = getBookmarks();
  const index = list.findIndex(p => String(p.id) === String(item.id));
  let added = false;

  if (index > -1) {
    list.splice(index, 1);
    showToast(`"${item.title.slice(0, 30)}..." dihapus dari favorit.`, 'info');
  } else {
    list.unshift({
      id: item.id,
      title: item.title,
      slug: item.slug,
      thumbnail: item.thumbnail,
      version: item.version || ''
    });
    added = true;
    showToast(`"${item.title.slice(0, 30)}..." disimpan ke favorit!`, 'success');
  }

  localStorage.setItem('khanza_bookmarks', JSON.stringify(list));
  updateBookmarkBadge();
  syncBookmarkButtons();
};

window.updateBookmarkBadge = function() {
  const badge = document.getElementById('navBookmarkCount');
  if (!badge) return;
  const list = getBookmarks();
  if (list.length > 0) {
    badge.textContent = list.length > 99 ? '99+' : list.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
};

window.syncBookmarkButtons = function() {
  const btns = document.querySelectorAll('[data-bookmark-id]');
  btns.forEach(btn => {
    const id = btn.getAttribute('data-bookmark-id');
    const icon = btn.querySelector('i');
    if (isBookmarked(id)) {
      btn.classList.add('text-rose-500');
      if (icon) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
      }
    } else {
      btn.classList.remove('text-rose-500');
      if (icon) {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
      }
    }
  });
};

// Copy All Links for IDM & JDownloader Batch
window.copyAllLinks = function() {
  const linkElems = document.querySelectorAll('.server-dl-link');
  if (!linkElems || linkElems.length === 0) {
    showToast('Tidak ada link unduhan yang ditemukan.', 'error');
    return;
  }
  const urls = [];
  linkElems.forEach(el => {
    const url = el.getAttribute('data-url') || el.href;
    if (url && !url.includes('javascript:')) urls.push(url);
  });

  if (urls.length === 0) {
    showToast('Tidak ada tautan untuk disalin.', 'error');
    return;
  }

  const allUrls = urls.join('\n');
  navigator.clipboard.writeText(allUrls).then(() => {
    showToast(`${urls.length} link berhasil disalin! Buka IDM -> Tasks -> Add batch download.`, 'success');
  }).catch(() => {
    prompt('Salin semua link di bawah:', allUrls);
  });
};

// Simple Toast Notification
window.showToast = function(msg, type = 'info') {
  let toast = document.getElementById('khanzaToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'khanzaToast';
    toast.className = 'fixed bottom-5 right-5 z-50 transition-all duration-300 transform translate-y-12 opacity-0 pointer-events-none';
    document.body.appendChild(toast);
  }

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const bgClass = isSuccess ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : (isError ? 'bg-rose-950 border-rose-700 text-rose-200' : 'bg-slate-900 border-slate-700 text-slate-200');
  const iconClass = isSuccess ? 'fa-solid fa-circle-check text-emerald-400' : (isError ? 'fa-solid fa-circle-xmark text-rose-400' : 'fa-solid fa-bell text-sky-400');

  toast.innerHTML = `
    <div class="px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${bgClass}">
      <i class="${iconClass} text-sm"></i>
      <span>${msg}</span>
    </div>
  `;

  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }, 3500);
};
