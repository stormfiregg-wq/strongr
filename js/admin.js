// Strong Russia — admin panel logic
(function(){
  const SESSION_KEY = 'sr_admin_session';
  let content = {settings:{}, news:[]};

  const $ = sel => document.querySelector(sel);
  const toast = msg => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  };

  // ---------- auth ----------
  function isLoggedIn(){
    return sessionStorage.getItem(SESSION_KEY) === 'ok';
  }
  function showDashboard(){
    $('#login-screen').style.display = 'none';
    $('#dashboard').style.display = 'block';
    boot();
  }
  function showLogin(){
    $('#login-screen').style.display = 'flex';
    $('#dashboard').style.display = 'none';
  }

  $('#login-btn').addEventListener('click', () => {
    const val = $('#pwd').value;
    if(val && val === ADMIN_PASSWORD){
      sessionStorage.setItem(SESSION_KEY, 'ok');
      $('#err').classList.remove('show');
      showDashboard();
    }else{
      $('#err').classList.add('show');
    }
  });
  $('#pwd').addEventListener('keydown', e => { if(e.key === 'Enter') $('#login-btn').click(); });
  $('#logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  // ---------- data ----------
  function saveDraft(){
    localStorage.setItem(SR.STORAGE_KEY, JSON.stringify(content));
  }

  async function boot(){
    content = await SR.loadContent();
    if(!content.settings) content.settings = {};
    if(!content.news) content.news = [];
    fillSettingsForm();
    renderList();
  }

  function fillSettingsForm(){
    const s = content.settings;
    $('#s-download-url').value = s.downloadUrl || '';
    $('#s-download-label').value = s.downloadLabel || '';
    $('#s-download-size').value = s.downloadSize || '';
    $('#s-discord-url').value = s.discordUrl || '';
    $('#s-tagline').value = s.tagline || '';
    $('#s-description').value = s.description || '';
  }

  $('#save-settings').addEventListener('click', () => {
    content.settings.downloadUrl = $('#s-download-url').value.trim();
    content.settings.downloadLabel = $('#s-download-label').value.trim();
    content.settings.downloadSize = $('#s-download-size').value.trim();
    content.settings.discordUrl = $('#s-discord-url').value.trim();
    content.settings.tagline = $('#s-tagline').value.trim();
    content.settings.description = $('#s-description').value.trim();
    saveDraft();
    toast('Настройки сохранены (черновик)');
  });

  // ---------- news CRUD ----------
  function renderList(){
    const list = $('#news-admin-list');
    const items = SR.newsSorted(content);
    if(!items.length){
      list.innerHTML = '<p class="hint">Новостей пока нет.</p>';
      return;
    }
    list.innerHTML = items.map(n => `
      <div class="list-row">
        <div>
          <div class="lr-title">${SR.escapeHtml(n.title)}</div>
          <div class="lr-date">${SR.formatDate(n.date)} · ${SR.escapeHtml(n.tag||'')}</div>
        </div>
        <div class="lr-actions">
          <button class="icon-btn" data-edit="${n.id}">Править</button>
          <button class="icon-btn danger" data-del="${n.id}">Удалить</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => loadIntoForm(btn.dataset.edit));
    });
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if(!confirm('Удалить эту новость?')) return;
        content.news = content.news.filter(n => n.id !== btn.dataset.del);
        saveDraft();
        renderList();
        toast('Новость удалена (черновик)');
      });
    });
  }

  function loadIntoForm(id){
    const n = content.news.find(x => x.id === id);
    if(!n) return;
    $('#n-id').value = n.id;
    $('#n-title').value = n.title;
    $('#n-date').value = n.date;
    $('#n-tag').value = n.tag || '';
    $('#n-excerpt').value = n.excerpt || '';
    $('#n-body').value = n.body || '';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function clearForm(){
    $('#n-id').value = '';
    $('#n-title').value = '';
    $('#n-date').value = new Date().toISOString().slice(0,10);
    $('#n-tag').value = '';
    $('#n-excerpt').value = '';
    $('#n-body').value = '';
  }
  $('#clear-form').addEventListener('click', clearForm);

  $('#save-news').addEventListener('click', () => {
    const title = $('#n-title').value.trim();
    const date = $('#n-date').value || new Date().toISOString().slice(0,10);
    if(!title){ toast('Укажите заголовок новости'); return; }

    let id = $('#n-id').value;
    const data = {
      id: id || 'n' + Date.now(),
      title,
      date,
      tag: $('#n-tag').value.trim() || 'Новость',
      excerpt: $('#n-excerpt').value.trim(),
      body: $('#n-body').value.trim()
    };

    const idx = content.news.findIndex(n => n.id === data.id);
    if(idx >= 0) content.news[idx] = data;
    else content.news.unshift(data);

    saveDraft();
    renderList();
    clearForm();
    toast('Новость опубликована (черновик)');
  });

  // ---------- export / import / reset ----------
  $('#export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Файл скачан — замените им data/content.json на хостинге');
  });

  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if(!file) return;
    try{
      const text = await file.text();
      const parsed = JSON.parse(text);
      content = parsed;
      saveDraft();
      fillSettingsForm();
      renderList();
      toast('Данные загружены в черновик');
    }catch(err){
      toast('Не удалось прочитать файл — проверьте формат JSON');
    }
    e.target.value = '';
  });

  $('#reset-btn').addEventListener('click', () => {
    if(!confirm('Отменить несохранённые правки в этом браузере и вернуться к data/content.json?')) return;
    localStorage.removeItem(SR.STORAGE_KEY);
    boot();
    toast('Черновик сброшен');
  });

  // ---------- init ----------
  if(isLoggedIn()) showDashboard();
  else showLogin();
})();
