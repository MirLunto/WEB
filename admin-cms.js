// 简单的 Admin CMS，依赖 getSupabaseService()
(async function() {
  const svc = getSupabaseService();
  if (!svc) return;

  // DOM
  const editorArea = document.getElementById('cmsEditorArea');
  const openProjectsBtn = document.getElementById('openProjectsEditor');
  const openArticlesBtn = document.getElementById('openArticlesEditor');

  function renderList(type, items) {
    editorArea.innerHTML = `
      <div class="cms-${type}">
        <button id="cmsAdd${type}" class="submit-btn" style="margin-bottom:10px;">新建 ${type.slice(0,-1)}</button>
        <div id="cmsList${type}">${items.map(it => `
          <div class="cms-item" data-id="${it.id}">
            <div class="cms-row" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:10px;">
                <strong>${Utils.escapeHtml(it.title)}</strong>
               ${it.published ? `<span class="project-tag" style="font-size:0.75rem; padding:4px 8px; margin-left:8px;">已发布</span>` : `<span style="font-size:0.75rem; padding:4px 8px; margin-left:8px; background:rgba(255,255,255,0.02); border-radius:6px; color:var(--text-secondary);">未发布</span>`}
              </div>
              <div class="cms-item-actions">
                <button class="cms-edit-btn" data-id="${it.id}" title="编辑">编辑</button>
                <button class="cms-delete-btn" data-id="${it.id}" title="删除">删除</button>
              </div>
            </div>
            <div class="cms-meta">${new Date(it.created_at).toLocaleString()}</div>
            <div class="cms-body">${Utils.escapeHtml(it.description || it.excerpt || '')}</div>
          </div>
        `).join('')}</div>
      </div>
    `;
    // bind
    document.querySelectorAll('.cms-edit-btn').forEach(b => b.addEventListener('click', (e) => {
      const id = b.dataset.id;
      if (window.app && typeof window.app.openCmsEditor === 'function') {
        window.app.openCmsEditor(type, id);
      }
    }));
    document.querySelectorAll('.cms-delete-btn').forEach(b => b.addEventListener('click', () => handleDelete(type, b.dataset.id)));
    const addBtn = document.getElementById(`cmsAdd${type}`);
    if (addBtn) addBtn.addEventListener('click', () => {
      if (window.app && typeof window.app.openCmsEditor === 'function') {
        window.app.openCmsEditor(type, null);
      }
    });
  }

  async function handleDelete(type, id) {
    if (!confirm('确定删除？')) return;
    try {
      if (type === 'projects') await svc.deleteProject(id);
      else await svc.deleteArticle(id);
      Utils.showNotification('删除成功', 'success');

      // 通知页面刷新
      if (window.app) {
        if (type === 'projects' && typeof window.app.loadProjects === 'function') window.app.loadProjects();
        if (type === 'articles' && typeof window.app.loadArticles === 'function') window.app.loadArticles();
      }

      // 同步刷新 admin 列表
      loadList(type);
    } catch (e) {
      console.error('删除失败', e);
      Utils.showNotification('删除失败', 'error');
    }
  }

  async function loadList(type) {
    if (!svc || !svc.isAdmin) {
      editorArea.innerHTML = '<p style="color:var(--text-secondary)">请先以管理员登录以管理内容。</p>';
      return;
    }
    if (type === 'projects') {
      const res = await svc.getProjects();
      if (res.success) renderList('projects', res.data);
      else editorArea.innerHTML = `<p>加载失败: ${res.error || '未知错误'}</p>`;
    } else {
      // 管理面板需要拉取所有文章（包括未发布），因此传入 publishedOnly = false
      const res = await svc.getArticles(100, 0, false);
      if (res.success) renderList('articles', res.data);
      else editorArea.innerHTML = `<p>加载失败: ${res.error || '未知错误'}</p>`;
    }
  }

  // 监听全局事件：当 CMS 内容变更时刷新当前编辑列表
  window.addEventListener('cmsContentChanged', (e) => {
    try {
      // 仅当 admin 面板正在显示时刷新
      if (!svc || !svc.isAdmin) return;
      // 简单刷新两类列表，保证 admin 面板同步（也可以按 e.detail.type 优化）
      const currentType = editorArea.querySelector('.cms-projects') ? 'projects' : 'articles';
      // 如果 editorArea 为空则不操作
      if (!editorArea || editorArea.innerHTML.trim() === '') return;
      // 触发当前类型刷新
      if (currentType) loadList(currentType);
    } catch (err) {
      console.warn('cmsContentChanged 事件处理异常', err);
    }
  });

  openProjectsBtn && openProjectsBtn.addEventListener('click', () => loadList('projects'));
  openArticlesBtn && openArticlesBtn.addEventListener('click', () => loadList('articles'));

  // 当管理员状态变化时刷新（可选）
  document.addEventListener('supabaseAuthChange', () => {
    if (svc.isAdmin) loadList('projects');
  });

})();