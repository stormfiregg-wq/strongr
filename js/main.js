// Strong Russia — shared site logic
// Content source of truth: /data/content.json (edit via admin panel + export,
// or by hand). If the admin has made unpublished edits in this browser only,
// a localStorage draft ("sr_content_draft") takes precedence so they can
// preview before exporting.

const SR = {
  STORAGE_KEY: 'sr_content_draft',

  async loadContent(){
    let fileContent = null;
    try{
      const res = await fetch('data/content.json', {cache:'no-store'});
      if(res.ok) fileContent = await res.json();
    }catch(e){ /* ignore, fall back below */ }

    let draft = null;
    try{
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if(raw) draft = JSON.parse(raw);
    }catch(e){ /* ignore corrupt draft */ }

    return draft || fileContent || {settings:{}, news:[]};
  },

  formatDate(iso){
    try{
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'});
    }catch(e){ return iso; }
  },

  escapeHtml(str){
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  },

  applyLinks(content){
    document.querySelectorAll('[data-download-link]').forEach(el => {
      el.href = content.settings.downloadUrl || '#';
    });
    document.querySelectorAll('[data-discord-link]').forEach(el => {
      el.href = content.settings.discordUrl || '#';
    });
    document.querySelectorAll('[data-download-label]').forEach(el => {
      el.textContent = content.settings.downloadLabel || 'Скачать';
    });
    document.querySelectorAll('[data-download-size]').forEach(el => {
      el.textContent = content.settings.downloadSize || '';
    });
    document.querySelectorAll('[data-tagline]').forEach(el => {
      el.textContent = content.settings.tagline || '';
    });
    document.querySelectorAll('[data-description]').forEach(el => {
      el.textContent = content.settings.description || '';
    });
  },

  newsSorted(content){
    return [...(content.news||[])].sort((a,b) => (a.date < b.date ? 1 : -1));
  },

  renderNewsCards(container, items){
    if(!items.length){
      container.innerHTML = '<div class="empty-state">Пока нет опубликованных новостей.</div>';
      return;
    }
    container.innerHTML = items.map(n => `
      <article class="news-card">
        <span class="news-tag">${this.escapeHtml(n.tag||'Новость')}</span>
        <span class="news-date">${this.formatDate(n.date)}</span>
        <h3>${this.escapeHtml(n.title)}</h3>
        <p>${this.escapeHtml(n.excerpt||'')}</p>
        <a class="read" href="news.html?id=${encodeURIComponent(n.id)}">Читать</a>
      </article>
    `).join('');
  },

  renderNewsRows(container, items){
    if(!items.length){
      container.innerHTML = '<div class="empty-state">Пока нет опубликованных новостей.</div>';
      return;
    }
    container.innerHTML = items.map(n => `
      <a class="news-row" href="news.html?id=${encodeURIComponent(n.id)}">
        <span class="news-date">${this.formatDate(n.date)}</span>
        <div>
          <h3>${this.escapeHtml(n.title)}</h3>
          <p>${this.escapeHtml(n.excerpt||'')}</p>
        </div>
        <span class="news-tag">${this.escapeHtml(n.tag||'Новость')}</span>
      </a>
    `).join('');
  }
};

function initNav(){
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if(!burger || !nav) return;
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.textContent = '☰';
  }));
}

document.addEventListener('DOMContentLoaded', initNav);
