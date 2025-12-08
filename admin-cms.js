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
          <div class="cms-item" data-id="${it.id}" style="border:1px solid rgba(255,255,255,0.06); padding:10px; margin-bottom:8px;">
            <strong>${it.title}</strong>
            <div style="margin-top:6px;">
              <button class="cms-edit-btn" data-id="${it.id}">编辑</button>
              <button class="cms-delete-btn" data-id="${it.id}">删除</button>
            </div>
            <div class="cms-meta" style="color:var(--text-secondary); font-size:0.9rem;">${new Date(it.created_at).toLocaleString()}</div>
            <div class="cms-body" style="margin-top:8px;">${(it.description||it.excerpt||'')}</div>
          </div>
        `).join('')}</div>
      </div>
    `;
    // bind
    document.querySelectorAll('.cms-edit-btn').forEach(b => b.addEventListener('click', () => openEditForm(type, b.dataset.id)));
    document.querySelectorAll('.cms-delete-btn').forEach(b => b.addEventListener('click', () => handleDelete(type, b.dataset.id)));
    const addBtn = document.getElementById(`cmsAdd${type}`);
    if (addBtn) addBtn.addEventListener('click', () => openEditForm(type, null));
  }

  function openEditForm(type, id = null) {
    // 简易表单
    editorArea.innerHTML = `
      <div class="cms-form">
        <h3>${id ? '编辑' : '新建'} ${type.slice(0,-1)}</h3>
        <div>
          <input id="cmsTitle" placeholder="标题" style="width:100%; padding:8px; margin-bottom:8px;">
        </div>
        <div>
          <textarea id="cmsBody" placeholder="内容/描述" style="width:100%; min-height:120px; padding:8px;"></textarea>
        </div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          <button id="cmsSave" class="submit-btn">${id ? '保存' : '创建'}</button>
          <button id="cmsCancel" class="btn-secondary">取消</button>
        </div>
      </div>
    `;
    // 如果有 id，加载数据填充
    if (id) {
      (async () => {
        const loader = type === 'projects' ? await svc.getProjects(1,0) : await svc.getArticles(1,0);
        // 更稳妥做法应通过专门 fetch 单条接口；此处简单查找
        const list = loader && loader.success ? loader.data : [];
        const item = list.find(x => String(x.id) === String(id));
        if (item) {
          document.getElementById('cmsTitle').value = item.title || '';
          document.getElementById('cmsBody').value = item.description || item.content || '';
        }
      })();
    }
    document.getElementById('cmsCancel').addEventListener('click', () => loadList(type));
    document.getElementById('cmsSave').addEventListener('click', async () => {
      const title = document.getElementById('cmsTitle').value.trim();
      const body = document.getElementById('cmsBody').value.trim();
      if (!title) return Utils.showNotification('请输入标题', 'error');
      try {
        if (id) {
          if (type === 'projects') {
            await svc.updateProject(id, { title, description: body });
          } else {
            await svc.updateArticle(id, { title, content: body });
          }
          Utils.showNotification('保存成功', 'success');
        } else {
          if (type === 'projects') {
            await svc.addProject({ title, description: body });
          } else {
            await svc.addArticle({ title, content: body, published: true });
          }
          Utils.showNotification('创建成功', 'success');
        }
      } catch (e) {
        console.error('保存失败', e);
        Utils.showNotification('保存失败', 'error');
      } finally {
        loadList(type);
      }
    });
  }

  async function handleDelete(type, id) {
    if (!confirm('确定删除？')) return;
    try {
      if (type === 'projects') await svc.deleteProject(id);
      else await svc.deleteArticle(id);
      Utils.showNotification('删除成功', 'success');
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
      const res = await svc.getArticles();
      if (res.success) renderList('articles', res.data);
      else editorArea.innerHTML = `<p>加载失败: ${res.error || '未知错误'}</p>`;
    }
  }

  openProjectsBtn && openProjectsBtn.addEventListener('click', () => loadList('projects'));
  openArticlesBtn && openArticlesBtn.addEventListener('click', () => loadList('articles'));

  // 当管理员状态变化时刷新（可选）
  document.addEventListener('supabaseAuthChange', () => {
    if (svc.isAdmin) loadList('projects');
  });

})();