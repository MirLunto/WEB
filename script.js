/**
 * Mir-Lunto 个人空间 - 主JavaScript文件
 * 版本: 4.0.0 (支持多层嵌套评论)
 * 最后更新: 2024-01-20
 */

// ============================================================================
// 全局配置
// ============================================================================

const CONFIG = {
  // 性能配置
  CACHE_DURATION: 5 * 60 * 1000, // 5分钟
  DEBOUNCE_DELAY: 300,
  
  // 评论系统配置
  MAX_COMMENT_LENGTH: 500,
  MAX_USERNAME_LENGTH: 20,
  COMMENTS_PER_PAGE: 10,
  MAX_NESTING_DEPTH: 5, // 新增：最大嵌套层数
  
  // 本地存储键名
  STORAGE_KEYS: {
    COMMENTS_CACHE: 'comments-cache-v7',
    COMMENTS_TIMESTAMP: 'comments-cache-time-v3',
    WELCOME_SHOWN: 'welcomeShown-v2',
    PERFORMANCE_DATA: 'mir-lunto-perf-v2',
    USER_SETTINGS: 'user-settings-v2'
  }
};

// ============================================================================
// 工具函数
// ============================================================================

class Utils {
  /**
   * 安全的DOM元素获取
   */
  static getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`元素 #${id} 不存在`);
    }
    return element;
  }

  /**
   * 转义HTML，防止XSS攻击
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 格式化时间
   */
  static formatTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;

    if (diff < minute) return '刚刚';
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)}小时前`;
    if (diff < week) return `${Math.floor(diff / day)}天前`;
    if (diff < month) return `${Math.floor(diff / week)}周前`;
    
    return time.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * 生成唯一ID
   */
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 防抖函数
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 显示通知
   */
  static showNotification(message, type = 'info', duration = 3000) {
    const container = Utils.getElement('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getNotificationIcon(type)}</span>
      <span class="notification-message">${Utils.escapeHtml(message)}</span>
    `;

    container.appendChild(notification);

    // 自动移除
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%) scale(0.9)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * 获取通知图标
   */
  static getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * 验证邮箱格式
   */
  static validateEmail(email) {
    if (!email) return true; // 邮箱可选
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * 获取设备信息
   */
  static getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = '电脑';
    let browser = '未知浏览器';

    // 检测设备
    if (/mobile/i.test(ua)) device = '手机';
    else if (/tablet/i.test(ua)) device = '平板';

    // 检测浏览器
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    else if (/edge/i.test(ua)) browser = 'Edge';
    else if (/msie/i.test(ua) || /trident/i.test(ua)) browser = 'IE';

    return `${device} · ${browser}`;
  }
}

// ============================================================================
// 性能监控
// ============================================================================
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = performance.now();
    this.init();
  }

  init() {
    this.recordNavigationTiming();
    this.recordResourceTiming();
    this.setupPerformanceObserver();
    this.setupUserTiming();
  }

  recordNavigationTiming() {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        this.metrics.firstByte = navigation.responseStart - navigation.requestStart;
      }
    }
  }

  recordResourceTiming() {
    if (performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.includes('.css') || resource.name.includes('.js')) {
          this.metrics[resource.name] = resource.duration;
        }
      });
    }
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // 观察绘制性能
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'paint') {
            this.metrics[entry.name] = entry.startTime;
          }
        });
      });
      
      try {
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.log('Paint观察器初始化失败:', e);
      }
      // 观察长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          console.log('长任务检测:', entry.duration);
        });
      });
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('长任务观察器初始化失败:', e);
      }
    }
  }

  setupUserTiming() {
    // 自定义性能标记
    performance.mark('app_initialized');
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.metrics.timeOnPage = performance.now() - this.startTime;
      }
    });
  }

  report() {
    const totalLoad = performance.now() - this.startTime;
    this.metrics.totalLoad = totalLoad;
    
    // 记录到控制台
    console.group('🎯 性能指标');
    Object.entries(this.metrics).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    console.groupEnd();
    
    // 保存到本地存储
    this.saveToLocalStorage();
    
    // 发送到分析服务（可选）
    this.sendToAnalytics();
  }

  saveToLocalStorage() {
    try {
      const perfHistory = JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.PERFORMANCE_DATA) || '[]'
      );
      
      perfHistory.push({
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      
      // 只保留最近50条记录
      if (perfHistory.length > 50) {
        perfHistory.shift();
      }
      
      localStorage.setItem(
        CONFIG.STORAGE_KEYS.PERFORMANCE_DATA,
        JSON.stringify(perfHistory)
      );
    } catch (error) {
      console.log('性能数据保存失败:', error);
    }
  }

  sendToAnalytics() {
    // 这里可以集成Google Analytics或其他分析服务
    console.log('📊 性能监控数据已记录');
  }
}

// ============================================================================
// 视频优化器
// ============================================================================
class VideoOptimizer {
  constructor() {
    this.video = Utils.getElement('bgVideo');
    this.init();
  }

  init() {
    if (!this.video) {
      this.useStaticBackground();
      return;
    }
    
    if (this.isSlowNetwork()) {
      this.useStaticBackground();
      return;
    }
    
    this.optimizeVideoLoading();
    this.setupVideoEvents();
  }

  isSlowNetwork() {
    // 检测网络状况
    const connection = navigator.connection ||
                      navigator.mozConnection ||
                      navigator.webkitConnection;
    
    if (!connection) return false;
    
    const effectiveType = connection.effectiveType || '';
    const saveData = connection.saveData || false;
    
    // 如果是2G/3G网络或开启了省流量模式，使用静态背景
    return saveData ||
           effectiveType.includes('2g') ||
           effectiveType.includes('3g') ||
           effectiveType === 'slow-2g';
  }

  useStaticBackground() {
    const videoContainer = document.querySelector('.video-background');
    if (!videoContainer) return;
    
    videoContainer.innerHTML = `
      <div class="static-background"></div>
      <div class="video-overlay"></div>
    `;
    
    Utils.showNotification('已优化为静态背景以适应您的网络环境', 'info');
  }

  optimizeVideoLoading() {
    if (!this.video) return;
    
    // 优化视频加载
    this.video.preload = 'metadata';
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('webkit-playsinline', '');
    
    // 设置视频源
    const sources = this.video.querySelectorAll('source');
    sources.forEach(source => {
      source.setAttribute('type', source.getAttribute('type') || 'video/mp4');
    });
  }

  setupVideoEvents() {
    if (!this.video) return;
    
    this.video.addEventListener('loadstart', () => {
      console.log('视频开始加载');
    });
    
    this.video.addEventListener('canplay', () => {
      console.log('视频可以播放');
      this.video.play().catch(e => {
        console.log('视频自动播放被阻止:', e);
      });
    });
    
    this.video.addEventListener('error', (e) => {
      console.error('视频加载失败:', e);
      this.useStaticBackground();
    });
    
    this.video.addEventListener('waiting', () => {
      console.log('视频缓冲中...');
    });
    
    this.video.addEventListener('playing', () => {
      console.log('视频开始播放');
    });
  }
}

// ============================================================================
// 搜索引擎
// ============================================================================
class SearchEngine {
  constructor() {
    this.searchData = [];
    this.currentQuery = '';
    this.isSearching = false;
    this.init();
  }

  init() {
    this.collectSearchData();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();

    // 监听页面动态内容更新（由 loadProjects/loadArticles 派发）
    window.addEventListener('contentUpdated', (e) => {
      // 延迟一点以确保 DOM 完全渲染（防止 race）
      setTimeout(() => {
        this.collectSearchData();
        console.log('SearchEngine: contentUpdated -> 重新索引 DOM', e && e.detail);
      }, 120);
    });

    // 另外在 App 完成延迟组件初始化后也可能需要一次索引
    window.addEventListener('welcomeClosed', () => {
      setTimeout(() => this.collectSearchData(), 200);
    });
  }

  collectSearchData() {
    const selectors = 'h1, h2, h3, h4, h5, h6, p, article, section, .article-item, .project-item';
    const contentElements = document.querySelectorAll(selectors);
    this.searchData = Array.from(contentElements)
      .filter(el => {
        const text = (el.textContent || '').trim();
        return text.length > 5 &&
          !el.classList.contains('search-suggestion-item') &&
          !el.classList.contains('result-item');
      })
      .map(el => ({
        element: el,
        text: el.textContent.trim(),
        tag: el.tagName.toLowerCase(),
        id: el.id || (el.dataset && (el.dataset.id ? (el.tagName.toLowerCase() === 'article' ? `article-${el.dataset.id}` : `project-${el.dataset.id}`) : null)) || null,
        className: el.className || '',
        dataTags: el.dataset.tags || ''
      }));
    console.log(`SearchEngine: 已索引 ${this.searchData.length} 个内容元素`);
  }

  setupEventListeners() {
    const searchInput = Utils.getElement('searchInput');
    const searchBtn = Utils.getElement('searchBtn');
    const searchContainer = document.querySelector('.search-container');
    if (!searchInput) return;
    // 输入事件 - 防抖处理
    searchInput.addEventListener('input', Utils.debounce((e) => {
      this.handleSearchInput(e.target.value);
    }, CONFIG.DEBOUNCE_DELAY));
    // 回车搜索
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(searchInput.value);
      }
    });
    // 搜索按钮点击
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch(searchInput.value);
      });
    }
    // 点击外部关闭搜索结果
    document.addEventListener('click', (e) => {
      if (!searchContainer || !searchContainer.contains(e.target)) {
        this.closeSearchResults();
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K 或 Cmd+K 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = Utils.getElement('searchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      // ESC 关闭搜索结果
      if (e.key === 'Escape') {
        this.closeSearchResults();
        const searchInput = Utils.getElement('searchInput');
        if (searchInput) searchInput.blur();
      }
    });
  }

  handleSearchInput(query) {
    this.currentQuery = query.trim();
    const suggestions = Utils.getElement('searchSuggestions');
    if (!suggestions) return;
    if (this.currentQuery.length < 2) {
      suggestions.style.display = 'none';
      return;
    }
    const matches = this.searchData
      .filter(item =>
        item.text.toLowerCase().includes(this.currentQuery.toLowerCase()) ||
        item.dataTags.toLowerCase().includes(this.currentQuery.toLowerCase())
      )
      .slice(0, 8);
    this.showSuggestions(matches);
  }

  showSuggestions(matches) {
    const suggestions = Utils.getElement('searchSuggestions');
    if (!suggestions) return;
    if (matches.length === 0) {
      suggestions.innerHTML = `
        <div class="search-suggestion-item">
          没有找到相关建议
        </div>
      `;
      suggestions.style.display = 'block';
      return;
    }
    suggestions.innerHTML = matches
      .map(match => `
        <div class="search-suggestion-item" data-text="${Utils.escapeHtml(match.text)}">
          <div class="suggestion-title">${this.highlightText(this.truncateText(match.text, 60), this.currentQuery)}</div>
          <div class="suggestion-meta">
            <span class="suggestion-tag">${match.tag}</span>
            ${match.dataTags ? `<span class="suggestion-tags">${match.dataTags}</span>` : ''}
          </div>
        </div>
      `)
      .join('');
    suggestions.style.display = 'block';
    // 添加点击事件
    suggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const input = Utils.getElement('searchInput');
        if (input) {
          input.value = item.dataset.text;
          this.performSearch(item.dataset.text);
        }
        suggestions.style.display = 'none';
      });
    });
  }

  performSearch(query) {
    if (!query.trim() || this.isSearching) return;
    
    this.isSearching = true;
    this.currentQuery = query.trim();
    const matches = this.searchData.filter(item =>
      item.text.toLowerCase().includes(this.currentQuery.toLowerCase()) ||
      item.dataTags.toLowerCase().includes(this.currentQuery.toLowerCase())
    );
    this.showSearchResults(matches);
    this.isSearching = false;
    this.saveSearchHistory(query);
  }

  showSearchResults(matches) {
    const resultsContent = Utils.getElement('searchResults');
    if (!resultsContent) return;
    if (matches.length === 0) {
      resultsContent.innerHTML = `
        <div class="no-results">
          <h3>没有找到相关内容</h3>
          <p>尝试使用不同的关键词搜索</p>
        </div>
      `;
    } else {
      resultsContent.innerHTML = matches
        .map(match => `
          <div class="result-item" data-id="${match.id || ''}">
            <h4>${this.highlightText(this.truncateText(match.text, 80), this.currentQuery)}</h4>
            <p>${this.highlightText(this.truncateText(match.text, 150), this.currentQuery)}</p>
            <div class="result-meta">
              <span class="result-tag">${match.tag.toUpperCase()}</span>
              ${match.dataTags ? `<span class="result-tags">${match.dataTags}</span>` : ''}
            </div>
          </div>
        `)
        .join('');
      // 添加点击事件
      resultsContent.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
          const targetId = item.dataset.id;
          if (targetId) {
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth' });
              // 添加高亮效果
              targetElement.style.animation = 'highlightFlash 2s ease';
              setTimeout(() => {
                targetElement.style.animation = '';
              }, 2000);
            }
          }
          this.closeSearchResults();
        });
      });
    }
    resultsContent.classList.add('active');
    // 添加高亮动画样式
    if (!document.querySelector('style#highlight-animation')) {
      const style = document.createElement('style');
      style.id = 'highlight-animation';
      style.textContent = `
        @keyframes highlightFlash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(79, 195, 247, 0.3); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  closeSearchResults() {
    const searchResults = Utils.getElement('searchResults');
    const suggestions = Utils.getElement('searchSuggestions');
    
    if (searchResults) searchResults.classList.remove('active');
    if (suggestions) suggestions.style.display = 'none';
    
    const searchInput = Utils.getElement('searchInput');
    if (searchInput) searchInput.value = '';
  }

  saveSearchHistory(query) {
    try {
      const searchHistory = JSON.parse(
        localStorage.getItem('search-history') || '[]'
      );
      if (!searchHistory.includes(query)) {
        searchHistory.unshift(query);
        if (searchHistory.length > 20) {
          searchHistory.pop();
        }
        localStorage.setItem('search-history', JSON.stringify(searchHistory));
      }
    } catch (error) {
      console.log('搜索历史保存失败:', error);
    }
  }

  highlightText(text, query) {
    if (!query) return Utils.escapeHtml(text);
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return Utils.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
  }

  truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ============================================================================
// 评论系统（支持多层嵌套）
// ============================================================================
class CommentSystem {
  constructor() {
    this.comments = [];
    this.commentsTree = []; // 树形结构
    this.currentReplyTo = null;
    this.pendingDeleteId = null;
    this.pendingDeleteIsReply = false;
    this.supabaseService = getSupabaseService();
    // 不使用本地示例/缓存，仍初始化组件并加载后端数据
    this.init();
  }

  async init() {
    await this.loadComments();
    this.setupEventListeners();
    this.initEmojiPicker();
  }

  // ==================== 数据管理 ====================
  /**
   * 将扁平数据转换为树形结构（新增方法）
   */
  buildCommentTree(flatComments) {
    const commentMap = new Map();
    const rootComments = [];

    // 先建立 map（用 String(id) 作为键，防止类型不一致）
    flatComments.forEach(comment => {
      const key = String(comment.id);
      commentMap.set(key, {
        ...comment,
        // 保留原 id 类型，但在 map 中用字符串键索引
        depth: 0,
        replies: comment.replies && Array.isArray(comment.replies) ? comment.replies.slice() : []
      });
    });

    // 构建树结构
    flatComments.forEach(comment => {
      const key = String(comment.id);
      const parentKey = comment.parent_id === null || comment.parent_id === undefined ? null : String(comment.parent_id);
      const node = commentMap.get(key);
      if (!node) return;
      if (parentKey && commentMap.has(parentKey)) {
        const parent = commentMap.get(parentKey);
        node.depth = (parent.depth || 0) + 1;
        if (node.depth <= CONFIG.MAX_NESTING_DEPTH) {
          parent.replies.push(node);
        } else {
          // 超出深度限制时当作根节点处理
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    // 递归排序（按时间降序：新发布的在上）
    const sortComments = (comments) => {
      comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      comments.forEach(c => {
        if (c.replies && c.replies.length) sortComments(c.replies);
      });
    };
    sortComments(rootComments);
    
    return rootComments;
  }

  async loadComments() {
    // 显示加载状态
    const container = Utils.getElement('commentsContainer');
    if (container) {
      container.innerHTML = '<div class="loading-comments">加载留言中...</div>';
    }
    try {
      // 尝试从Supabase加载
      if (this.supabaseService && this.supabaseService.isConnected) {
        const result = await this.supabaseService.getComments();
        
        if (result.success && Array.isArray(result.data)) {
          // 统一数据格式，避免 id 类型/字段名差异造成匹配失败
          this.comments = result.data.map(r => ({
            // 保留原字段并做容错
            id: r.id,
            parent_id: r.parent_id === undefined ? null : r.parent_id,
            created_at: r.created_at || r.timestamp || new Date().toISOString(),
            content: r.content || r.body || '',
            author: r.author || r.name || '匿名',
            likes: Number(r.likes) || 0,
            device: r.device || '',
            is_admin: !!r.is_admin,
            // 如果需要后续同步到 supabase，保留原 id
            supabase_id: r.id
          }));
          this.commentsTree = this.buildCommentTree(this.comments);
          this.saveToCache();
          this.renderComments();
          return;
        }
      }
      // 如果Supabase失败，尝试从缓存加载
      console.log('Supabase连接失败，尝试从缓存加载');
      this.loadFromCache();
      
    } catch (error) {
      console.error('加载评论失败:', error);
      this.loadFromCache();
    }
  }

  shouldUseCache() {
    const cacheTime = localStorage.getItem(CONFIG.STORAGE_KEYS.COMMENTS_TIMESTAMP);
    if (!cacheTime) return false;
    return Date.now() - parseInt(cacheTime) < CONFIG.CACHE_DURATION;
  }

  loadFromCache() {
    // 已移除本地示例与缓存逻辑，故直接显示空列表（或等待后端加载）
    this.comments = [];
    this.commentsTree = [];
    this.renderComments();
  }

  getInitialComments() {
    // 移除内置示例数据；后端 Supabase 为唯一数据源
    return [];
  }

  saveToCache() {
    // 不再使用本地缓存，故空实现以免其他代码调用报错
    return;
  }

  // ==================== 事件处理 ====================
  setupEventListeners() {
    // 评论表单提交
    const commentForm = Utils.getElement('commentForm');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }
    // 表情按钮
    const emojiBtn = Utils.getElement('emojiBtn');
    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => this.toggleEmojiModal());
    }
    // 同步按钮
    const syncBtn = Utils.getElement('syncComments');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncToSupabase());
    }
    // 导出按钮
    const exportBtn = Utils.getElement('exportComments');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportComments());
    }
    // 取消回复
    const cancelReply = Utils.getElement('cancelReply');
    if (cancelReply) {
      cancelReply.addEventListener('click', () => this.cancelReply());
    }
    // 删除模态框相关
    const cancelDelete = Utils.getElement('cancelDelete');
    const confirmDelete = Utils.getElement('confirmDelete');
    const closeDeleteModal = Utils.getElement('closeDeleteModal');
    if (cancelDelete) cancelDelete.addEventListener('click', () => this.hideDeleteModal());
    if (confirmDelete) confirmDelete.addEventListener('click', () => this.confirmDelete());
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', () => this.hideDeleteModal());
    // 管理员登录相关
    const adminLoginBtn = Utils.getElement('adminLoginBtn');
    const adminLogoutBtn = Utils.getElement('adminLogoutBtn');
    const submitAdminLogin = Utils.getElement('submitAdminLogin');
    const closeAdminLogin = Utils.getElement('closeAdminLogin');
    const cancelAdminLogin = Utils.getElement('cancelAdminLogin');
    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', () => this.showAdminLoginModal());
    }
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => this.adminLogout());
    }
    if (submitAdminLogin) {
      submitAdminLogin.addEventListener('click', () => this.handleAdminLogin());
    }
    if (closeAdminLogin) {
      closeAdminLogin.addEventListener('click', () => this.hideAdminLoginModal());
    }
    if (cancelAdminLogin) {
      cancelAdminLogin.addEventListener('click', () => this.hideAdminLoginModal());
    }
    // 管理员面板按钮
    const exportCommentsAdmin = Utils.getElement('exportCommentsAdmin');
    const refreshStats = Utils.getElement('refreshStats');
    if (exportCommentsAdmin) {
      exportCommentsAdmin.addEventListener('click', () => this.exportComments());
    }
    if (refreshStats) {
      refreshStats.addEventListener('click', () => this.loadAdminStats());
    }
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl+Enter 提交评论
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const commentForm = Utils.getElement('commentForm');
        if (commentForm) {
          commentForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
      // ESC 键关闭所有模态框
      if (e.key === 'Escape') {
        this.hideDeleteModal();
        this.hideAdminLoginModal();
        this.toggleEmojiModal(false);
      }
    });
    // 点击模态框外部关闭
    document.addEventListener('click', (e) => {
      const emojiModal = Utils.getElement('emojiModal');
      const deleteModal = Utils.getElement('deleteModal');
      const adminLoginModal = Utils.getElement('adminLoginModal');
      if (emojiModal && e.target === emojiModal) {
        this.toggleEmojiModal(false);
      }
      if (deleteModal && e.target === deleteModal) {
        this.hideDeleteModal();
      }
      if (adminLoginModal && e.target === adminLoginModal) {
        this.hideAdminLoginModal();
      }
    });
    // 绑定删除按钮：把要删除的 id 存到 deleteModal.dataset.pendingId
    document.addEventListener('click', function (e) {
      const btn = e.target.closest && e.target.closest('.delete-btn');
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.id || btn.dataset.commentId;
      if (!id) {
        console.warn('删除按钮未携带 data-id');
        return;
      }
      const deleteModal = document.getElementById('deleteModal');
      if (!deleteModal) {
        console.warn('删除模态不存在');
        return;
      }
      deleteModal.dataset.pendingId = id;
      // 显示模态（依据你项目的显示逻辑）
      deleteModal.style.display = 'block';
      console.log('confirmDelete: pendingId 已设置为', id);
    });
  }

  // ==================== 评论处理 ====================
  async handleCommentSubmit(e) {
    e.preventDefault();
    // 安全获取表单元素，避免 null 引用导致脚本中断
    const authorEl = Utils.getElement('authorName');
    const emailEl = Utils.getElement('authorEmail');
    const contentEl = Utils.getElement('commentContent');
    const submitBtn = Utils.getElement('submitComment');
    if (!authorEl || !contentEl || !submitBtn) {
      Utils.showNotification('表单元素缺失，请刷新页面', 'error');
      return;
    }
    const authorName = authorEl.value.trim();
    const authorEmail = emailEl ? emailEl.value.trim() : '';
    const content = contentEl.value.trim();
    // 验证输入
    if (!authorName || !content) {
      Utils.showNotification('请填写昵称和评论内容', 'error');
      return;
    }
    if (authorName.length > CONFIG.MAX_USERNAME_LENGTH) {
      Utils.showNotification(`昵称不能超过${CONFIG.MAX_USERNAME_LENGTH}个字符`, 'error');
      return;
    }
    if (content.length > CONFIG.MAX_COMMENT_LENGTH) {
      Utils.showNotification(`评论内容不能超过${CONFIG.MAX_COMMENT_LENGTH}个字符`, 'error');
      return;
    }
    if (authorEmail && !Utils.validateEmail(authorEmail)) {
      Utils.showNotification('邮箱格式不正确', 'error');
      return;
    }
    const commentData = {
      author: authorName,
      email: authorEmail,
      content: content,
      device: Utils.getDeviceInfo(),
      mood: '😊'
    };
    // 检查是否是管理员
    if (this.supabaseService && this.supabaseService.isAdmin) {
      commentData.isAdmin = true;
    }
    // 如果有回复对象
    if (this.currentReplyTo) {
      const parentComment = this.findCommentInTree(this.currentReplyTo, this.commentsTree);
      if (parentComment && parentComment.depth >= CONFIG.MAX_NESTING_DEPTH) {
        Utils.showNotification(`回复层数已达最大限制(${CONFIG.MAX_NESTING_DEPTH}层)`, 'warning');
        return;
      }
      commentData.parent_id = this.currentReplyTo;
    }
    // 显示提交中状态
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    try {
      // 保存到Supabase
      let result;
      if (this.supabaseService && this.supabaseService.isConnected) {
        result = await this.supabaseService.addComment(commentData);
      }
      if (result && result.success) {
        // 成功保存到Supabase
        const newComment = {
          id: result.data.id,
          ...commentData,
          created_at: new Date().toISOString(),
          is_admin: result.data.is_admin || false,
          parent_id: commentData.parent_id || null,
          likes: 0,
          replies: []
        };
        // 添加到评论列表
        this.comments.push(newComment);
        // 重新构建树形结构
        this.commentsTree = this.buildCommentTree(this.comments);
        this.saveToCache();
        this.renderComments();
        // 重置表单
        Utils.getElement('commentForm').reset();
        Utils.showNotification('留言发布成功!', 'success');
        this.cancelReply();
      } else {
        // Supabase失败，保存到本地缓存
        this.saveCommentLocally(commentData);
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      this.saveCommentLocally(commentData);
    } finally {
      // 恢复按钮状态
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  saveCommentLocally(commentData) {
    // 不再保留本地保存逻辑，提示并重置表单
    Utils.showNotification('留言未提交，网络不可用时暂不支持本地保存，请稍后重试', 'error');
    const form = Utils.getElement('commentForm');
    if (form) form.reset();
    this.cancelReply();
    return false;
  }

  // ==================== 评论查找和渲染 ====================
  /**
   * 递归查找评论（新增方法）
   */
  findCommentInTree(id, comments = this.commentsTree) {
    for (let comment of comments) {
      if (comment.id == id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = this.findCommentInTree(id, comment.replies);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 递归删除评论（新增方法）
   */
  deleteCommentFromTree(id, comments = this.commentsTree) {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      if (comment.id == id) {
        // 递归删除所有子回复
        const deleteReplies = (replies) => {
          replies.forEach(reply => {
            // 从主评论列表中删除
            const index = this.comments.findIndex(c => c.id == reply.id);
            if (index !== -1) {
              this.comments.splice(index, 1);
            }
            if (reply.replies && reply.replies.length > 0) {
              deleteReplies(reply.replies);
            }
          });
        };
        deleteReplies(comment.replies);
        // 从主评论列表中删除
        const mainIndex = this.comments.findIndex(c => c.id == id);
        if (mainIndex !== -1) {
          this.comments.splice(mainIndex, 1);
        }
        // 从树中删除
        comments.splice(i, 1);
        return true;
      }
      if (comment.replies && comment.replies.length > 0) {
        const deleted = this.deleteCommentFromTree(id, comment.replies);
        if (deleted) return true;
      }
    }
    return false;
  }

  /**
   * 渲染评论树（新增方法）
   */
  renderComments() {
    const container = Utils.getElement('commentsContainer');
    if (!container) return;
    if (this.commentsTree.length === 0) {
      container.innerHTML = `
        <div class="no-comments">
          <p>暂无留言，快来抢沙发吧！</p>
          <button onclick="document.getElementById('commentContent').focus()" class="btn-secondary">
            发表第一条留言
          </button>
        </div>
      `;
      this.updateCommentsCount();
      return;
    }
    container.innerHTML = this.commentsTree.map(comment => this.renderComment(comment)).join('');
    this.updateCommentsCount();
    this.attachCommentEvents();
  }

  /**
   * 递归渲染单个评论（修改后的方法）
   */
  renderComment(comment, depth = 0) {
    const time = Utils.formatTime(comment.created_at);
    // 管理员标识
    const adminBadge = comment.is_admin ? '<span class="admin-badge">站长</span>' : '';
    // 本地数据标识
    const localBadge = comment.local ? '<span class="local-badge">本地</span>' : '';
    // 删除按钮（管理员模式下显示）
    const deleteButton = (this.supabaseService && this.supabaseService.isAdmin)
      ? `<button class="delete-btn" data-id="${comment.id}" title="删除留言">🗑️</button>`
      : '';
    // 根据深度计算样式
    const depthClass = depth > 0 ? 'comment-nested' : '';
    const depthStyle = depth > 0 ? `style="margin-left: ${depth * 30}px;"` : '';
    // 渲染子回复
    const repliesHtml = comment.replies && comment.replies.length > 0
      ? comment.replies.map(reply => this.renderComment(reply, depth + 1)).join('')
      : '';
    return `
      <div class="comment ${depthClass}" data-id="${comment.id}" data-depth="${depth}" ${depthStyle}>
        <div class="comment-header">
          <div class="comment-author">
            <div class="author-avatar" style="${comment.is_admin ? 'background: linear-gradient(135deg, #ff5722, #f57c00);' : ''}">
              ${comment.author.charAt(0).toUpperCase()}
            </div>
            <div class="author-info">
              <h4>${Utils.escapeHtml(comment.author)} ${adminBadge} ${localBadge}</h4>
              <div class="comment-time">${time} · ${comment.device || '未知设备'}</div>
            </div>
          </div>
          <div class="comment-actions">
            ${depth < CONFIG.MAX_NESTING_DEPTH ? 
              `<button class="reply-btn" data-id="${comment.id}" data-author="${Utils.escapeHtml(comment.author)}">
                <span>💬</span> 回复
              </button>` : ''}
            <button class="like-btn" data-id="${comment.id}">
              <span>❤️</span> ${comment.likes || 0}
            </button>
            ${deleteButton}
          </div>
        </div>
        <div class="comment-content">${this.processContent(comment.content)}</div>
        ${repliesHtml}
      </div>
    `;
  }

  processContent(content) {
    return Utils.escapeHtml(content)
      .replace(/\n/g, '<br>')
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
      .replace(/\[code\](.*?)\[\/code\]/g, '<code>$1</code>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  // ==================== 评论事件绑定 ====================
  attachCommentEvents() {
    this.attachReplyEvents();
    this.attachLikeEvents();
    this.attachDeleteEvents();
  }

  attachReplyEvents() {
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const commentId = e.target.closest('.reply-btn').dataset.id;
        const authorName = e.target.closest('.reply-btn').dataset.author;
        this.setupReply(commentId, authorName);
      });
    });
  }

  attachLikeEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const commentId = e.target.closest('.like-btn').dataset.id;
        this.likeComment(commentId);
      });
    });
  }

  attachDeleteEvents() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const commentId = btn.dataset.id;
        this.showDeleteModal(commentId);
      });
    });
  }

  // ==================== 回复功能 ====================
  setupReply(commentId, authorName) {
    this.currentReplyTo = commentId;
    const replyPreview = Utils.getElement('replyPreview');
    const replyContent = Utils.getElement('replyContent');
    // 查找评论内容
    const comment = this.findCommentInTree(commentId);
    if (replyContent && comment) {
      replyContent.textContent = comment.content.substring(0, 100) +
        (comment.content.length > 100 ? '...' : '');
    }
    if (replyPreview) {
      replyPreview.style.display = 'block';
    }
    // 滚动到表单并聚焦
    const commentForm = Utils.getElement('commentForm');
    if (commentForm) {
      commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const textarea = Utils.getElement('commentContent');
    if (textarea) {
      textarea.focus();
      textarea.value = `@${authorName} `;
    }
    Utils.showNotification(`正在回复 ${authorName}`, 'info');
  }

  cancelReply() {
    this.currentReplyTo = null;
    const replyPreview = Utils.getElement('replyPreview');
    if (replyPreview) {
      replyPreview.style.display = 'none';
    }
  }

  // ==================== 点赞功能 ====================
  async likeComment(commentId) {
    const comment = this.findCommentInTree(commentId);
    if (!comment) return;
    comment.likes = (comment.likes || 0) + 1;
    // 立即更新UI
    const likeBtn = document.querySelector(`.like-btn[data-id="${commentId}"]`);
    if (likeBtn) {
      likeBtn.innerHTML = `<span>❤️</span> ${comment.likes}`;
      likeBtn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        likeBtn.style.transform = '';
      }, 300);
    }
    // 保存到缓存
    this.saveToCache();
    // 尝试同步到Supabase
    if (this.supabaseService && this.supabaseService.isConnected && comment.supabase_id) {
      try {
        await this.supabaseService.updateLikes(parseInt(comment.supabase_id), comment.likes);
        console.log('点赞同步成功');
      } catch (error) {
        console.error('点赞同步失败:', error);
      }
    }
    Utils.showNotification('点赞成功！', 'success');
  }

  // ==================== 更新评论计数 ====================
  updateCommentsCount() {
    const count = this.getTotalCommentsCount();
    const countElement = Utils.getElement('commentsCount');
    if (countElement) {
      countElement.textContent = count;
    }
  }

  getTotalCommentsCount() {
    const countRecursive = (comments) => {
      let count = 0;
      comments.forEach(comment => {
        count++;
        if (comment.replies && comment.replies.length > 0) {
          count += countRecursive(comment.replies);
        }
      });
      return count;
    };
    return countRecursive(this.commentsTree);
  }

  // ==================== 删除功能 ====================
  showDeleteModal(commentId) {
    // 检查是否已登录管理员
    if (!this.supabaseService || !this.supabaseService.isAdmin) {
      Utils.showNotification('请先登录管理员账户', 'error');
      this.showAdminLoginModal();
      return;
    }
    this.pendingDeleteId = commentId;
    const comment = this.findCommentInTree(commentId);
    if (!comment) return;
    const deleteModal = Utils.getElement('deleteModal');
    const deleteConfirmText = Utils.getElement('deleteConfirmText');
    const deleteModalTitle = Utils.getElement('deleteModalTitle');
    if (!deleteModal || !deleteConfirmText || !deleteModalTitle) return;
    
    // 将 pendingId 同步到 modal dataset（确保 confirmDelete 能读取）
    deleteModal.dataset.pendingId = String(commentId);
    deleteModal.dataset.pendingIsReply = 'false';

    // 计算回复数量
    const countReplies = (replies) => {
      let count = 0;
      replies.forEach(reply => {
        count++;
        if (reply.replies && reply.replies.length > 0) {
          count += countReplies(reply.replies);
        }
      });
      return count;
    };
    
    const repliesCount = comment.replies ? countReplies(comment.replies) : 0;
    deleteModalTitle.textContent = '确认删除留言';
    if (repliesCount > 0) {
      deleteConfirmText.textContent = `您确定要删除 ${Utils.escapeHtml(comment.author)} 的留言吗？这将同时删除 ${repliesCount} 条回复。`;
    } else {
      deleteConfirmText.textContent = `您确定要删除 ${Utils.escapeHtml(comment.author)} 的留言吗？此操作不可撤销。`;
    }
    
    deleteModal.classList.add('active');
  }

  hideDeleteModal() {
    const deleteModal = Utils.getElement('deleteModal');
    if (deleteModal) deleteModal.classList.remove('active');
    this.pendingDeleteId = null;
  }

  async confirmDelete() {
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) return;

    // 先尝试从 modal dataset 读取，回退到 this.pendingDeleteId
    const pendingId = deleteModal.dataset.pendingId || this.pendingDeleteId;
    if (!pendingId) {
      console.warn('confirmDelete: 无待删除 id');
      this.hideDeleteModal();
      return;
    }

    const svc = this.supabaseService || (typeof getSupabaseService === 'function' ? getSupabaseService() : null);
    if (!svc) {
      console.error('Supabase 服务实例未找到，无法删除');
      Utils && typeof Utils.showNotification === 'function' && Utils.showNotification('服务未初始化，无法删除', 'error');
      this.hideDeleteModal();
      return;
    }

    try {
      // 调用后端删除
      const result = await svc.deleteComment(Number(pendingId));
      console.log('confirmDelete: supabase delete result =>', result);

      // 处理返回值（稳健判断）
      if (!result) {
        console.info('confirmDelete: 后端返回空，假定删除成功');
        Utils && typeof Utils.showNotification === 'function' && Utils.showNotification('删除成功', 'success');
      } else if (result.error) {
        console.error('从Supabase删除失败:', result.error);
        const msg = result.error.message || JSON.stringify(result.error);
        Utils && typeof Utils.showNotification === 'function' && Utils.showNotification(`删除失败: ${msg}`, 'error');
        this.hideDeleteModal();
        return;
      } else {
        Utils && typeof Utils.showNotification === 'function' && Utils.showNotification('删除成功', 'success');
      }

      // 从本地树删除（本地状态同步）
      this.deleteCommentFromTree(pendingId);
      // 重新渲染或从后端刷新（优先从后端刷新）
      if (typeof this.loadComments === 'function') {
        await this.loadComments();
      } else {
        this.renderComments();
      }
    } catch (err) {
      console.error('confirmDelete 异常:', err);
      Utils && typeof Utils.showNotification === 'function' && Utils.showNotification('删除时发生异常', 'error');
    } finally {
      // 清理并关闭模态（同步两处状态）
      delete deleteModal.dataset.pendingId;
      delete deleteModal.dataset.pendingIsReply;
      this.pendingDeleteId = null;
      this.hideDeleteModal();
    }
  }

  // ==================== 管理员功能 ====================
  showAdminLoginModal() {
    const loginModal = Utils.getElement('adminLoginModal');
    if (loginModal) {
      loginModal.classList.add('active');
      // 清空输入框
      const adminEmail = Utils.getElement('adminEmail');
      const adminPassword = Utils.getElement('adminPassword');
      if (adminEmail) adminEmail.value = '';
      if (adminPassword) adminPassword.value = '';
      // 隐藏错误信息
      const loginError = Utils.getElement('loginError');
      if (loginError) loginError.style.display = 'none';
    }
  }

  hideAdminLoginModal() {
    const loginModal = Utils.getElement('adminLoginModal');
    if (loginModal) loginModal.classList.remove('active');
  }

  async handleAdminLogin() {
    const email = Utils.getElement('adminEmail').value.trim();
    const password = Utils.getElement('adminPassword').value.trim();
    const errorEl = Utils.getElement('loginError');
    if (!email || !password) {
      Utils.showNotification('请输入邮箱和密码', 'error');
      return;
    }
    const result = await this.supabaseService.adminLogin(email, password);
    
    if (result.success) {
      Utils.showNotification('登录成功', 'success');
      this.hideAdminLoginModal();
      this.renderComments(); // 重新渲染以显示删除按钮
      
      // 加载管理员统计数据
      this.loadAdminStats();
    } else {
      if (errorEl) {
        errorEl.textContent = result.error || '登录失败';
        errorEl.style.display = 'block';
      }
      Utils.showNotification('登录失败: ' + (result.error || '未知错误'), 'error');
    }
  }

  async adminLogout() {
    const result = await this.supabaseService.logout();
    if (result.success) {
      Utils.showNotification('已退出登录', 'info');
      this.renderComments(); // 重新渲染以隐藏删除按钮
    } else {
      Utils.showNotification('退出登录失败', 'error');
    }
  }

  async loadAdminStats() {
    if (!this.supabaseService || !this.supabaseService.isAdmin) return;
    
    try {
      const statsResult = await this.supabaseService.getStats();
      if (statsResult.success) {
        const stats = statsResult.data;
        const totalCommentsStat = Utils.getElement('totalCommentsStat');
        const adminCommentsStat = Utils.getElement('adminCommentsStat');
        const todayCommentsStat = Utils.getElement('todayCommentsStat');
        
        if (totalCommentsStat) totalCommentsStat.textContent = stats.totalComments;
        if (adminCommentsStat) adminCommentsStat.textContent = stats.adminComments;
        if (todayCommentsStat) todayCommentsStat.textContent = stats.todayComments;
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }

  // ==================== 同步到Supabase ====================
  async syncToSupabase() {
    Utils.showNotification('正在同步数据到Supabase...', 'info');
    
    try {
      // 重新加载数据
      await this.loadComments();
      Utils.showNotification('数据同步完成!', 'success');
    } catch (error) {
      console.error('同步失败:', error);
      Utils.showNotification('同步失败: ' + error.message, 'error');
    }
  }

  // ==================== 导出功能 ====================
  exportComments() {
    try {
      const data = {
        exportTime: new Date().toISOString(),
        totalComments: this.getTotalCommentsCount(),
        comments: this.comments,
        commentsTree: this.commentsTree
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mir-lunto-comments-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Utils.showNotification('评论数据已导出', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      Utils.showNotification('导出失败', 'error');
    }
  }

  // ==================== 表情选择器 ====================
  initEmojiPicker() {
    this.setupEmojiModal();
    this.setupInlineEmoji();
  }

  setupEmojiModal() {
    const emojiModal = Utils.getElement('emojiModal');
    const closeBtn = Utils.getElement('closeEmojiModal');
    const emojiGrid = Utils.getElement('emojiGrid');
    const categoryBtns = document.querySelectorAll('.emoji-category');
    if (!emojiModal || !closeBtn || !emojiGrid) return;
    const emojis = {
      smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
      animals: ['🐵', '🐒', '🦍', '🐶', '🐕', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽'],
      food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕'],
      travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '✈️', '🛩️', '🚁', '🚀', '🛸'],
      objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻'],
      symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️']
    };
    const renderEmojiGrid = (category) => {
      emojiGrid.innerHTML = emojis[category].map(emoji => `
        <button class="emoji-item" data-emoji="${emoji}">${emoji}</button>
      `).join('');
      emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', () => {
          const emoji = item.dataset.emoji;
          this.insertEmoji(emoji);
          this.toggleEmojiModal(false);
        });
      });
    };
    // 初始渲染
    renderEmojiGrid('smileys');
    // 分类切换
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEmojiGrid(btn.dataset.category);
      });
    });
    // 关闭按钮
    closeBtn.addEventListener('click', () => this.toggleEmojiModal(false));
  }

  setupInlineEmoji() {
    const emojiBtn = Utils.getElement('emojiBtn');
    const emojiPicker = Utils.getElement('emojiPicker');
    if (!emojiBtn || !emojiPicker) return;
    const commonEmojis = ['😀', '😂', '🥰', '😍', '🤔', '👏', '👍', '❤️', '🎉', '🔥', '✨', '🌟', '💯', '🙏', '😊', '😎', '🤗', '😴', '🥳'];
    emojiPicker.innerHTML = commonEmojis.map(emoji => `
      <button class="emoji-option" data-emoji="${emoji}">${emoji}</button>
    `).join('');
    // 内联表情点击事件
    emojiPicker.querySelectorAll('.emoji-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.insertEmoji(btn.dataset.emoji);
        emojiPicker.classList.remove('active');
      });
    });
    // 显示/隐藏内联表情选择器
    emojiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      emojiPicker.classList.toggle('active');
    });
    // 点击外部关闭
    document.addEventListener('click', () => {
      emojiPicker.classList.remove('active');
    });
  }

  toggleEmojiModal(show) {
    const emojiModal = Utils.getElement('emojiModal');
    if (!emojiModal) return;
    if (typeof show === 'boolean') {
      if (show) {
        emojiModal.classList.add('active');
      } else {
        emojiModal.classList.remove('active');
      }
    } else {
      emojiModal.classList.toggle('active');
    }
  }

  insertEmoji(emoji) {
    const textarea = Utils.getElement('commentContent');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + emoji + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    
    // 触发input事件以更新字符计数
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ============================================================================
// 联系信息加载器
// ============================================================================
class ContactInfoLoader {
  constructor() {
    this.contactInfo = {
      tel: '1358501649',
      email: '2979661763@qq.com',
      github: 'MirLunto',
      location: '中国'
    };
    this.init();
  }

  init() {
    this.loadContactInfo();
    this.setupLastUpdate();
  }

  loadContactInfo() {
    const contactContainer = Utils.getElement('contactInfo');
    if (!contactContainer) return;
    const displayTel = this.obfuscatePhone(this.contactInfo.tel);
    const displayEmail = this.obfuscateEmail(this.contactInfo.email);
    contactContainer.innerHTML = `
      <div class="contact-method">
        <div class="contact-icon">📱</div>
        <div class="contact-details">
          <h4>电话</h4>
          <p>${displayTel}</p>
        </div>
      </div>
      <div class="contact-method">
        <div class="contact-icon">📧</div>
        <div class="contact-details">
          <h4>邮箱</h4>
          <p>${displayEmail}</p>
        </div>
      </div>
      <div class="contact-method">
        <div class="contact-icon">🐱</div>
        <div class="contact-details">
          <h4>GitHub</h4>
          <p>${this.contactInfo.github}</p>
        </div>
      </div>
      <div class="contact-method">
        <div class="contact-icon">📍</div>
        <div class="contact-details">
          <h4>位置</h4>
          <p>${this.contactInfo.location}</p>
        </div>
      </div>
    `;
  }

  obfuscatePhone(phone) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
  }

  obfuscateEmail(email) {
    const [name, domain] = email.split('@');
    if (name.length <= 3) {
      return '***@' + domain;
    }
    return name.charAt(0) + '***' + name.slice(-1) + '@' + domain;
  }

  setupLastUpdate() {
    const lastUpdateElement = Utils.getElement('lastUpdate');
    if (lastUpdateElement) {
      const now = new Date();
      lastUpdateElement.textContent = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}

// ============================================================================
// 主初始化函数
// ============================================================================
class App {
  constructor() {
    this.isInitialized = false;
    this.supabaseService = null;
    this.cmsBindingsInitialized = false; // 新增：标记 CMS 绑定是否已初始化
    this.init();
  }

  async init() {
    try {
      // 隐藏加载指示器
      this.hideLoadingIndicator();
      
      // 初始化Supabase服务
      this.supabaseService = getSupabaseService();
      
      // 等待Supabase连接
      setTimeout(async () => {
        await this.supabaseService.testConnection();
        
        // 检查管理员状态
        await this.supabaseService.checkSession();
        
        // 更新UI显示登录状态
        this.updateLoginUI();
        
        // 继续其他初始化
        this.initModules();
        this.setupWelcomeOverlay();
        this.setupNavigation();
        this.setupVideo();
        this.setupErrorHandling();
        this.isInitialized = true;
        
        console.log('🎉 应用初始化完成');
        
        // 延迟初始化复杂组件
        setTimeout(() => {
          this.initDelayedComponents();
        }, 100);
        
      }, 500);
      
    } catch (error) {
      console.error('应用初始化失败:', error);
      Utils.showNotification('应用初始化失败，请刷新页面', 'error');
    }
  }

  hideLoadingIndicator() {
    const loadingIndicator = Utils.getElement('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.style.opacity = '0';
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 300);
    }
  }

  initModules() {
    // 初始化联系信息加载器
    new ContactInfoLoader();

    // 加载项目与文章到前端（普通用户也能看到）
    if (this.supabaseService) {
      this.loadProjects();
      this.loadArticles();
    }

    // 绑定 CMS 弹窗的关闭事件（只绑定一次）
    if (!this.cmsBindingsInitialized) {
      this.setupCmsBindings();
      this.cmsBindingsInitialized = true;
    }
  }
 
  // 绑定 CMS 弹窗的关闭按钮/遮罩/ESC 行为
  setupCmsBindings() {
    // 防止重复绑定
    if (this._cmsBindingsDone) return;
    this._cmsBindingsDone = true;

    const topClose = document.getElementById('cmsModalClose');
    if (topClose) topClose.addEventListener('click', (e) => { e.stopPropagation(); this.closeCmsModal(); });
    const bottomClose = document.getElementById('cmsCloseBtn');
    if (bottomClose) bottomClose.addEventListener('click', (e) => { e.stopPropagation(); this.closeCmsModal(); });

    // 遮罩点击关闭（只当点击到遮罩本身）
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('cmsModal');
      if (!modal) return;
      if (e.target === modal) this.closeCmsModal();
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('cmsModal');
        if (modal && modal.classList.contains('active')) this.closeCmsModal();
      }
    });
  }

  updateLoginUI() {
    const loginBtn = Utils.getElement('adminLoginBtn');
    const logoutBtn = Utils.getElement('adminLogoutBtn');
    const adminPanel = Utils.getElement('adminPanel');
    
    if (!this.supabaseService || !this.supabaseService.user) {
      // 未登录状态
      if (loginBtn) loginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'none';
    } else {
      // 已登录状态
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      
      // 如果是管理员，显示管理面板
      if (this.supabaseService.isAdmin && adminPanel) {
        adminPanel.style.display = 'block';
        // 加载统计数据
        if (window.commentSystem && window.commentSystem.loadAdminStats) {
          window.commentSystem.loadAdminStats();
        }
      }
    }
  }

  setupWelcomeOverlay() {
    const welcomeOverlay = Utils.getElement('welcomeOverlay');
    const closeWelcome = Utils.getElement('closeWelcome');
    const mainContent = document.querySelector('.main-content');
    if (!welcomeOverlay || !closeWelcome || !mainContent) {
      console.warn('欢迎浮窗元素未找到');
      return;
    }
    // 检查保存的设置
    const welcomeShown = localStorage.getItem(CONFIG.STORAGE_KEYS.WELCOME_SHOWN);
    if (welcomeShown === 'true') {
      welcomeOverlay.classList.remove('active');
      mainContent.classList.add('visible');
    }
    // 关闭欢迎浮窗
    closeWelcome.addEventListener('click', () => {
      console.log('关闭欢迎浮窗');
      welcomeOverlay.classList.remove('active');
      setTimeout(() => {
        mainContent.classList.add('visible');
      }, 300);
      localStorage.setItem(CONFIG.STORAGE_KEYS.WELCOME_SHOWN, 'true');
      
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('welcomeClosed'));
    });
    // 可选：5秒后自动关闭欢迎浮窗
    setTimeout(() => {
      if (welcomeOverlay.classList.contains('active')) {
        closeWelcome.click();
      }
    }, 5000);
  }

  setupNavigation() {
    // 平滑滚动导航
    document.querySelectorAll('.main-nav a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // 更新URL哈希（不滚动）
          history.pushState(null, null, targetId);
        }
      });
    });
    // 监听hash变化以高亮当前部分
    window.addEventListener('hashchange', () => {
      this.highlightCurrentSection();
    });
    // 初始高亮
    setTimeout(() => this.highlightCurrentSection(), 100);
  }

  highlightCurrentSection() {
    const hash = window.location.hash;
    if (!hash) return;
    document.querySelectorAll('.main-nav a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      }
    });
  }

  setupVideo() {
    const bgVideo = Utils.getElement('bgVideo');
    if (bgVideo) {
      // 尝试自动播放
      const playPromise = bgVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('视频自动播放被阻止:', error);
        });
      }
      // 视频错误处理
      bgVideo.addEventListener('error', function() {
        console.error('视频加载失败，请检查文件路径');
        Utils.showNotification('背景视频加载失败，已切换为静态背景', 'warning');
      });
    }
  }

  setupErrorHandling() {
    // 全局错误处理
    window.addEventListener('error', function(e) {
      console.error('全局错误捕获:', e.error);
      console.error('错误位置:', e.filename, '第', e.lineno, '行');
      
      if (e.error && e.error.message) {
        Utils.showNotification(`发生错误: ${e.error.message}`, 'error');
      }
    });
    // 未处理的Promise rejection
    window.addEventListener('unhandledrejection', function(e) {
      console.error('未处理的Promise rejection:', e.reason);
      Utils.showNotification('操作失败，请重试', 'error');
    });
  }

  initDelayedComponents() {
    try {
      // 初始化搜索功能
      window.searchEngine = new SearchEngine();
      
      // 初始化评论系统
      window.commentSystem = new CommentSystem();
      
      // 添加CSS动画
      this.addAnimations();
    } catch (componentError) {
      console.error('组件初始化失败:', componentError);
      Utils.showNotification('部分功能加载失败', 'warning');
    }
  }

  addAnimations() {
    // 添加CSS动画
    if (!document.querySelector('style#custom-animations')) {
      const style = document.createElement('style');
      style.id = 'custom-animations';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .local-badge {
          background: linear-gradient(135deg, #4caf50, #2e7d32);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-left: 5px;
          vertical-align: middle;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          gap: 5px;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        
        .page-btn {
          padding: 8px 12px;
          border: 1px solid var(--glass-border);
          background: var(--secondary-bg);
          color: var(--text-color);
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          font-size: 0.9rem;
          min-width: 40px;
        }
        
        .page-btn:hover {
          background: rgba(79, 195, 247, 0.1);
          border-color: var(--accent-color);
        }
        
        .page-btn.active {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }
        
        .suggestion-meta {
          display: flex;
          gap: 8px;
          margin-top: 5px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        
        .suggestion-tag {
          background: rgba(79, 195, 247, 0.2);
          color: var(--accent-color);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .suggestion-tags {
          color: #9575cd;
        }
        
        .result-meta {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          font-size: 0.8rem;
        }
        
        .result-tag {
          background: rgba(149, 117, 205, 0.2);
          color: #9575cd;
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .result-tags {
          color: var(--text-secondary);
        }
        
        .no-results {
          text-align: center;
          padding: 30px;
          color: var(--text-secondary);
        }
        
        .no-results h3 {
          margin-bottom: 10px;
          color: var(--text-color);
        }
        
        .no-comments {
          text-align: center;
          padding: 50px 20px;
        }
        
        .no-comments p {
          margin-bottom: 20px;
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        
        /* 多层嵌套评论样式 */
        .comment-nested {
          border-left: 2px solid rgba(255, 255, 255, 0.1);
          padding-left: 20px;
          margin-top: 15px;
          transition: all 0.3s ease;
        }
        
        .comment-nested:hover {
          border-left-color: var(--accent-color);
        }
        
        /* 限制最大缩进 */
        .comment[data-depth="5"] {
          margin-left: 120px !important;
        }
        
        .comment[data-depth="6"] {
          margin-left: 120px !important;
        }
        
        /* 移动端调整 */
        @media (max-width: 768px) {
          .comment-nested {
            margin-left: 10px !important;
            padding-left: 10px;
          }
          
          .comment[data-depth] {
            margin-left: 10px !important;
          }
          
          .comment[data-depth="3"] {
            margin-left: 30px !important;
          }
          
          .comment[data-depth="4"],
          .comment[data-depth="5"],
          .comment[data-depth="6"] {
            margin-left: 40px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

   // 从 Supabase 加载项目并渲染到页面（覆盖静态项）
  async loadProjects() {
    try {
      const svc = this.supabaseService || (typeof getSupabaseService === 'function' ? getSupabaseService() : null);
      const container = document.querySelector('.project-list');
      if (!container || !svc) return;
      const res = await svc.getProjects();
      if (res && res.success) {
        container.innerHTML = res.data.map(p => `
          <div id="project-${p.id}" class="project-item" data-id="${p.id}">
            <h3>${Utils.escapeHtml(p.title || '无标题')}</h3>
            <p>${Utils.escapeHtml(p.description || '')}</p>
            ${p.tags ? `<span class="project-tag">${Utils.escapeHtml(p.tags)}</span>` : ''}
          </div>
        `).join('');

        // 绑定点击打开查看（普通用户）
        container.querySelectorAll('.project-item').forEach(el => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => this.openCmsViewer('projects', el.dataset.id, false));
        });

        // 告知其它组件（例如 SearchEngine）内容已更新
        window.dispatchEvent(new CustomEvent('contentUpdated', { detail: { type: 'projects' } }));
      } else {
        console.warn('loadProjects: 无数据或获取失败', res && res.error);
      }
    } catch (err) {
      console.error('loadProjects 异常:', err);
    }
  }

  // 从 Supabase 加载文章并渲染到页面（仅显示已发布）
  async loadArticles() {
    try {
      const svc = this.supabaseService || (typeof getSupabaseService === 'function' ? getSupabaseService() : null);
      const container = document.querySelector('.articles-list');
      if (!container || !svc) return;
      const res = await svc.getArticles(100, 0, true); // 仅拉取 published = true
      if (res && res.success) {
        container.innerHTML = res.data.map(a => `
          <article id="article-${a.id}" class="article-item" data-id="${a.id}" data-tags="${Utils.escapeHtml(a.tags || '')}">
            <h3>${Utils.escapeHtml(a.title || '无标题')}</h3>
            <p>${Utils.escapeHtml((a.excerpt || a.content || '').slice(0, 180))}${(a.content||'').length>180? '...':''}</p>
            <div class="article-meta">
              <span class="article-date">${new Date(a.created_at).toLocaleDateString()}</span>
              <span class="article-tags">${Utils.escapeHtml(a.tags || '')}</span>
            </div>
          </article>
        `).join('');
        // 绑定点击事件以打开查看弹窗（普通用户查看）
        container.querySelectorAll('.article-item').forEach(el => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => this.openCmsViewer('articles', el.dataset.id, false));
        });

        // 通知内容已更新（SearchEngine 监听此事件并重新索引）
        window.dispatchEvent(new CustomEvent('contentUpdated', { detail: { type: 'articles' } }));
      } else {
        console.warn('loadArticles: 无数据或获取失败', res && res.error);
      }
    } catch (err) {
      console.error('loadArticles 异常:', err);
    }
  }

  // 打开查看/编辑弹窗（editable: 管理员可编辑）
  async openCmsViewer(type, id, editable = false) {
    try {
      const svc = this.supabaseService || (typeof getSupabaseService === 'function' ? getSupabaseService() : null);
      if (!svc) return;
      let res;
      if (type === 'projects') res = await svc.getProjectById(id);
      else res = await svc.getArticleById(id);

      if (!res || !res.success) {
        Utils.showNotification('加载内容失败', 'error');
        return;
      }

      const item = res.data || {};
      document.getElementById('cmsModalTitle').textContent = editable ? '编辑' : '查看';
      const fldTitle = document.getElementById('cmsFieldTitle');
      const fldTags = document.getElementById('cmsFieldTags');
      const fldBody = document.getElementById('cmsFieldBody');
      const fldPub = document.getElementById('cmsFieldPublished');

      if (fldTitle) fldTitle.value = item.title || '';
      if (fldTags) fldTags.value = item.tags || '';
      if (fldBody) fldBody.value = item.description || item.content || '';
      // 显式设置 checkbox
      if (fldPub) fldPub.checked = !!(item.published === true || item.published === 't' || item.published === 'true');

      // 控制输入可用性
      const inputs = [fldTitle, fldTags, fldBody, fldPub];
      inputs.forEach(i => { if (i) i.disabled = !editable; });

      // 绑定并替换保存处理（使用 addEventListener，打开时绑定，关闭时解绑）
      const saveBtn = document.getElementById('cmsSaveBtn');
      if (saveBtn) {
        // 解绑旧处理
        if (this._cmsSaveHandler) saveBtn.removeEventListener('click', this._cmsSaveHandler);
        // 新的处理（确保在执行时重新验证 session/admin）
        this._cmsSaveHandler = async (evt) => {
          evt && evt.preventDefault && evt.preventDefault();
          // 重新确认会话/管理员状态，避免切后台导致 state 失效
          if (svc && typeof svc.checkSession === 'function') await svc.checkSession();
          if (!svc || !svc.isAdmin) {
            Utils.showNotification('需要管理员权限或登录已过期，请重新登录', 'error');
            return;
          }
          await this.saveCmsModal(type, id);
        };
        saveBtn.addEventListener('click', this._cmsSaveHandler);
        saveBtn.style.display = editable ? 'inline-block' : 'none';
      }

      // 打开 modal 并触发动画类
      const modal = document.getElementById('cmsModal');
      const content = modal ? modal.querySelector('.cms-modal-content') : null;
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        // 强制重绘以触发 CSS 动画（确保过渡从初始态开始）
        if (content) {
          content.classList.remove('opening');
          // 下一帧添加类
          requestAnimationFrame(() => content.classList.add('opening'));
        }
      }
    } catch (err) {
      console.error('openCmsViewer 错误:', err);
    }
  }

  // openCmsEditor 保持一致：新建时也绑定保存处理
  async openCmsEditor(type, id = null) {
    if (!this.supabaseService || !this.supabaseService.isAdmin) {
      Utils.showNotification('需要管理员权限', 'error');
      return;
    }
    if (id) {
      await this.openCmsViewer(type, id, true);
    } else {
      document.getElementById('cmsModalTitle').textContent = '新建';
      const fldTitle = document.getElementById('cmsFieldTitle');
      const fldTags = document.getElementById('cmsFieldTags');
      const fldBody = document.getElementById('cmsFieldBody');
      const fldPub = document.getElementById('cmsFieldPublished');
      [fldTitle, fldTags, fldBody].forEach(i => { if (i) i.value = ''; });
      if (fldPub) fldPub.checked = true;
      [fldTitle, fldTags, fldBody, fldPub].forEach(i => { if (i) i.disabled = false; });

      // 绑定保存（与 openCmsViewer 相同逻辑）
      const saveBtn = document.getElementById('cmsSaveBtn');
      if (saveBtn) {
        if (this._cmsSaveHandler) saveBtn.removeEventListener('click', this._cmsSaveHandler);
        this._cmsSaveHandler = async (evt) => {
          evt && evt.preventDefault && evt.preventDefault();
          // 再次确认 session/admin
          if (this.supabaseService && typeof this.supabaseService.checkSession === 'function') {
            await this.supabaseService.checkSession();
          }
          if (!this.supabaseService || !this.supabaseService.isAdmin) {
            Utils.showNotification('需要管理员权限或登录已过期，请重新登录', 'error');
            return;
          }
          await this.saveCmsModal(type, null);
        };
        saveBtn.addEventListener('click', this._cmsSaveHandler);
        saveBtn.style.display = 'inline-block';
      }

      const modal = document.getElementById('cmsModal');
      const content = modal ? modal.querySelector('.cms-modal-content') : null;
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        if (content) {
          content.classList.remove('opening');
          requestAnimationFrame(() => content.classList.add('opening'));
        }
      }
    }
  }

  // 保存 modal 中的内容（新增/更新）
  async saveCmsModal(type, id = null) {
    try {
      const svc = this.supabaseService || (typeof getSupabaseService === 'function' ? getSupabaseService() : null);
      // 确保再次刷新 session 状态
      if (svc && typeof svc.checkSession === 'function') await svc.checkSession();
      if (!svc || !svc.isAdmin) {
        Utils.showNotification('需要管理员权限或登录已过期，请重新登录', 'error');
        return;
      }

      const fldTitle = document.getElementById('cmsFieldTitle');
      const fldTags = document.getElementById('cmsFieldTags');
      const fldBody = document.getElementById('cmsFieldBody');
      const fldPub = document.getElementById('cmsFieldPublished');

      const payload = {
        title: fldTitle ? fldTitle.value.trim() : '',
        tags: fldTags ? fldTags.value.trim() : '',
        description: fldBody ? fldBody.value.trim() : '',
        content: fldBody ? fldBody.value.trim() : '',
        published: fldPub ? !!fldPub.checked : true
      };

      console.log('saveCmsModal: payload ->', payload, 'id=', id, 'type=', type);
      if (!payload.title) {
        Utils.showNotification('标题不能为空', 'error');
        return;
      }

      let result;
      if (id) {
        if (type === 'projects') result = await svc.updateProject(id, { title: payload.title, description: payload.description, tags: payload.tags, published: payload.published });
        else result = await svc.updateArticle(id, { title: payload.title, content: payload.content, excerpt: payload.description, tags: payload.tags, published: payload.published });
        Utils.showNotification('更新成功', 'success');
      } else {
        if (type === 'projects') result = await svc.addProject({ title: payload.title, description: payload.description, tags: payload.tags, published: payload.published });
        else result = await svc.addArticle({ title: payload.title, content: payload.content, excerpt: payload.description, tags: payload.tags, published: payload.published });
        Utils.showNotification('创建成功', 'success');
      }

      console.log('saveCmsModal: service result ->', result);
      this.closeCmsModal();
      if (typeof this.loadProjects === 'function') await this.loadProjects();
      if (typeof this.loadArticles === 'function') await this.loadArticles();

      // 通知 admin-cms 或其他监听者：内容已变更（create/update）
      try {
        window.dispatchEvent(new CustomEvent('cmsContentChanged', {
          detail: { type: type, id: id || (result && result.data && result.data.id) || null, action: id ? 'update' : 'create' }
        }));
      } catch (e) {
        console.warn('cmsContentChanged 事件派发失败', e);
      }
    } catch (err) {
      console.error('saveCmsModal 错误:', err);
      Utils.showNotification('保存失败', 'error');
    }
  }

  closeCmsModal() {
    const modal = document.getElementById('cmsModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    const content = modal.querySelector('.cms-modal-content');
    if (content) content.classList.remove('opening');
    // 解绑保存处理
    const saveBtn = document.getElementById('cmsSaveBtn');
    if (saveBtn && this._cmsSaveHandler) {
      saveBtn.removeEventListener('click', this._cmsSaveHandler);
      this._cmsSaveHandler = null;
    }
  }
}

// ============================================================================
// 页面加载完成后的初始化
// ============================================================================
// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM 已加载，开始初始化应用...');
  // 设置页面标题动态效果
  const originalTitle = document.title;
  let isBlurred = false;
  window.addEventListener('blur', () => {
    if (!isBlurred) {
      document.title = '👋 快回来看看 ~ ' + originalTitle;
      isBlurred = true;
    }
  });
  window.addEventListener('focus', () => {
    if (isBlurred) {
      document.title = originalTitle;
      isBlurred = false;
    }
  });
  // 初始化应用
  window.app = new App();
});

// 页面完全加载后执行
window.addEventListener('load', function() {
  console.log('页面完全加载');
  
  setTimeout(() => {
    Utils.showNotification('欢迎来到 Mir-Lunto 的私人空间！', 'info', 2000);
  }, 1000);
});

// 页面关闭前保存数据
window.addEventListener('beforeunload', function(e) {
  // 可以在这里添加数据保存逻辑



});

// 添加到全局对象，方便调试
window.Utils = Utils;