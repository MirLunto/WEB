/**
 * Mir-Lunto 个人空间 - 主JavaScript文件
 * 版本: 2.0.0
 * 最后更新: 2024-01-20
 */

// ============================================================================
// 全局配置
// ============================================================================

const CONFIG = {
    // 安全配置
    ADMIN_PASSWORD: '297966',
    CONTACT_INFO_ENCRYPTED: true,
    
    // 性能配置
    CACHE_DURATION: 5 * 60 * 1000, // 5分钟
    DEBOUNCE_DELAY: 300,
    
    // 评论系统配置
    MAX_COMMENT_LENGTH: 500,
    MAX_USERNAME_LENGTH: 20,
    COMMENTS_PER_PAGE: 10,
    
    // GitHub配置
    GITHUB_REPO: 'MirLunto/WEB',
    GITHUB_API: 'https://api.github.com',
    
    // 本地存储键名
    STORAGE_KEYS: {
        COMMENTS: 'mir-lunto-comments-v2',
        COMMENTS_CACHE: 'comments-cache-v4',
        COMMENTS_TIMESTAMP: 'comments-cache-time-v2',
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
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 安全加密函数（简单示例）
     */
    static simpleEncrypt(text) {
        if (!CONFIG.CONTACT_INFO_ENCRYPTED) return text;
        return btoa(encodeURIComponent(text));
    }

    /**
     * 安全解密函数
     */
    static simpleDecrypt(encrypted) {
        if (!CONFIG.CONTACT_INFO_ENCRYPTED) return encrypted;
        try {
            return decodeURIComponent(atob(encrypted));
        } catch (e) {
            console.error('解密失败:', e);
            return '';
        }
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
    }

    collectSearchData() {
        // 收集页面内容用于搜索
        const selectors = 'h1, h2, h3, h4, h5, h6, p, article, section, .article-item, .project-item';
        const contentElements = document.querySelectorAll(selectors);
        
        this.searchData = Array.from(contentElements)
            .filter(el => {
                const text = el.textContent.trim();
                return text.length > 20 && 
                       !el.classList.contains('search-suggestion-item') &&
                       !el.classList.contains('result-item');
            })
            .map(el => ({
                element: el,
                text: el.textContent.trim(),
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                className: el.className || '',
                dataTags: el.dataset.tags || ''
            }));
        
        console.log(`已索引 ${this.searchData.length} 个内容元素`);
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
            .slice(0, 8); // 最多显示8个建议
        
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
        
        // 记录搜索历史
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
            
            // 避免重复记录
            if (!searchHistory.includes(query)) {
                searchHistory.unshift(query);
                
                // 只保留最近20条记录
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
// 评论系统
// ============================================================================

class CommentSystem {
    constructor() {
        this.comments = [];
        this.currentReplyTo = null;
        this.pendingDeleteId = null;
        this.pendingDeleteIsReply = false;
        this.currentPage = 1;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.loadComments();
        this.setupEventListeners();
        this.initEmojiPicker();
        this.renderComments();
    }

    // 数据管理
    async loadComments() {
        try {
            // 先尝试从缓存加载
            if (this.shouldUseCache()) {
                this.loadFromCache();
                return;
            }
            
            // 尝试从GitHub同步
            await this.syncFromGitHub();
        } catch (error) {
            console.warn('GitHub同步失败，使用本地存储:', error);
            this.loadFromLocalStorage();
        }
    }

    shouldUseCache() {
        const cacheTime = localStorage.getItem(CONFIG.STORAGE_KEYS.COMMENTS_TIMESTAMP);
        if (!cacheTime) return false;
        return Date.now() - parseInt(cacheTime) < CONFIG.CACHE_DURATION;
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.COMMENTS_CACHE);
            if (cached) {
                this.comments = JSON.parse(cached);
                console.log(`从缓存加载 ${this.comments.length} 条评论`);
                this.renderComments();
            }
        } catch (error) {
            console.error('缓存加载失败:', error);
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.COMMENTS);
            if (saved) {
                this.comments = JSON.parse(saved);
                console.log(`从本地存储加载 ${this.comments.length} 条评论`);
            } else {
                // 初始化示例评论
                this.comments = this.getInitialComments();
                this.saveToLocalStorage();
            }
            
            this.renderComments();
        } catch (error) {
            console.error('本地存储加载失败:', error);
            this.comments = this.getInitialComments();
            this.renderComments();
        }
    }

    getInitialComments() {
        return [
            {
                id: Utils.generateId(),
                author: 'Mir-Lunto',
                email: '',
                content: '欢迎来到我的个人空间！这里记录了我的学习历程、项目经验和生活思考。\n\n欢迎大家留言交流，分享想法！🎉',
                timestamp: new Date().toISOString(),
                likes: 8,
                replies: [],
                device: '电脑 · Chrome',
                isAdmin: true
            },
            {
                id: Utils.generateId(),
                author: '访客',
                email: '',
                content: '网站设计得真漂亮！特别喜欢这个玻璃态效果和动画。👍',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                likes: 3,
                replies: [
                    {
                        id: Utils.generateId(),
                        author: 'Mir-Lunto',
                        email: '',
                        content: '谢谢喜欢！我会继续改进的。',
                        timestamp: new Date(Date.now() - 1800000).toISOString(),
                        likes: 1,
                        device: '电脑 · Chrome',
                        isAdmin: true
                    }
                ],
                device: '手机 · Safari'
            }
        ];
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.COMMENTS, JSON.stringify(this.comments));
            this.saveToCache();
        } catch (error) {
            console.error('本地存储保存失败:', error);
            Utils.showNotification('评论保存失败', 'error');
        }
    }

    saveToCache() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.COMMENTS_CACHE, JSON.stringify(this.comments));
            localStorage.setItem(CONFIG.STORAGE_KEYS.COMMENTS_TIMESTAMP, Date.now().toString());
        } catch (error) {
            console.error('缓存保存失败:', error);
        }
    }

    // 事件处理
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
            syncBtn.addEventListener('click', () => this.syncToGitHub());
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
                this.toggleEmojiModal(false);
            }
        });
        
        // 点击模态框外部关闭
        document.addEventListener('click', (e) => {
            const emojiModal = Utils.getElement('emojiModal');
            const deleteModal = Utils.getElement('deleteModal');
            
            if (emojiModal && e.target === emojiModal) {
                this.toggleEmojiModal(false);
            }
            
            if (deleteModal && e.target === deleteModal) {
                this.hideDeleteModal();
            }
        });
    }

    // 评论处理
    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const authorName = Utils.getElement('authorName').value.trim();
        const authorEmail = Utils.getElement('authorEmail').value.trim();
        const content = Utils.getElement('commentContent').value.trim();
        
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
        
        // 创建评论对象
        const comment = {
            id: Utils.generateId(),
            author: authorName,
            email: authorEmail,
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: [],
            device: Utils.getDeviceInfo(),
            isAdmin: authorEmail === 'admin@mir-lunto.com' // 示例管理标识
        };
        
        // 添加评论或回复
        if (this.currentReplyTo) {
            this.addReply(comment, this.currentReplyTo);
            this.cancelReply();
        } else {
            this.addComment(comment);
        }
        
        // 重置表单
        Utils.getElement('commentForm').reset();
        Utils.showNotification('留言发布成功！', 'success');
        
        // 自动滚动到新评论
        setTimeout(() => {
            const newComment = document.querySelector(`[data-id="${comment.id}"]`);
            if (newComment) {
                newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    addComment(comment) {
        this.comments.unshift(comment);
        this.saveToLocalStorage();
        this.renderComments();
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('commentAdded', { detail: comment }));
    }

    addReply(reply, parentCommentId) {
        const parentComment = this.findCommentById(parentCommentId);
        if (parentComment) {
            if (!parentComment.replies) {
                parentComment.replies = [];
            }
            
            // 设置回复的父ID
            reply.parentId = parentCommentId;
            parentComment.replies.push(reply);
            
            this.saveToLocalStorage();
            this.renderComments();
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('replyAdded', { detail: reply }));
        }
    }

    // 查找评论
    findCommentById(id) {
        // 在主评论中查找
        for (let comment of this.comments) {
            if (comment.id === id) return comment;
            
            // 在回复中查找
            if (comment.replies && comment.replies.length > 0) {
                const found = comment.replies.find(reply => reply.id === id);
                if (found) return found;
            }
        }
        return null;
    }

    // 渲染评论
    renderComments() {
        const container = Utils.getElement('commentsContainer');
        if (!container) return;
        
        if (this.comments.length === 0) {
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
        
        // 计算分页
        const startIndex = (this.currentPage - 1) * CONFIG.COMMENTS_PER_PAGE;
        const endIndex = startIndex + CONFIG.COMMENTS_PER_PAGE;
        const pageComments = this.comments.slice(startIndex, endIndex);
        
        // 渲染评论
        container.innerHTML = pageComments.map(comment => this.renderComment(comment)).join('');
        
        // 添加分页控件
        const totalPages = Math.ceil(this.comments.length / CONFIG.COMMENTS_PER_PAGE);
        if (totalPages > 1) {
            container.innerHTML += this.renderPagination(totalPages);
        }
        
        this.updateCommentsCount();
        this.attachCommentEvents();
    }

    renderComment(comment, isReply = false) {
        const time = Utils.formatTime(comment.timestamp);
        const repliesHtml = comment.replies && comment.replies.length > 0
            ? `<div class="comment-replies">${
                comment.replies.map(reply => this.renderComment(reply, true)).join('')
              }</div>`
            : '';
        
        // 管理标识
        const adminBadge = comment.isAdmin ? '<span class="admin-badge">站长</span>' : '';
        
        // 删除按钮（所有人都能看到，但需要密码验证）
        const deleteButton = `<button class="delete-btn" data-id="${comment.id}" data-is-reply="${isReply}" title="删除留言">🗑️</button>`;
        
        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" data-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="author-avatar" style="background: ${this.getAvatarColor(comment.author)}">
                            ${comment.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="author-info">
                            <h4>${Utils.escapeHtml(comment.author)} ${adminBadge}</h4>
                            <div class="comment-time">${time} · ${comment.device || '未知设备'}</div>
                        </div>
                    </div>
                    <div class="comment-actions">
                        <button class="reply-btn" data-id="${comment.id}">
                            <span>💬</span> 回复
                        </button>
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

    renderPagination(totalPages) {
        let paginationHtml = '<div class="pagination">';
        
        // 上一页按钮
        if (this.currentPage > 1) {
            paginationHtml += `<button class="page-btn" data-page="${this.currentPage - 1}">← 上一页</button>`;
        }
        
        // 页码
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // 下一页按钮
        if (this.currentPage < totalPages) {
            paginationHtml += `<button class="page-btn" data-page="${this.currentPage + 1}">下一页 →</button>`;
        }
        
        paginationHtml += '</div>';
        return paginationHtml;
    }

    processContent(content) {
        // 处理换行和基本格式
        return Utils.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
            .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
            .replace(/\[code\](.*?)\[\/code\]/g, '<code>$1</code>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    getAvatarColor(name) {
        const colors = [
            'linear-gradient(135deg, #4fc3f7, #29b6f6)',
            'linear-gradient(135deg, #9575cd, #7e57c2)',
            'linear-gradient(135deg, #4caf50, #2e7d32)',
            'linear-gradient(135deg, #ff9800, #f57c00)',
            'linear-gradient(135deg, #f44336, #d32f2f)'
        ];
        
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    // 评论事件绑定
    attachCommentEvents() {
        this.attachReplyEvents();
        this.attachLikeEvents();
        this.attachDeleteEvents();
        this.attachPaginationEvents();
    }

    attachReplyEvents() {
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.closest('.reply-btn').dataset.id;
                this.setupReply(commentId);
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
                const isReply = btn.dataset.isReply === 'true';
                this.showDeleteModal(commentId, isReply);
            });
        });
    }

    attachPaginationEvents() {
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderComments();
                    
                    // 滚动到评论区域顶部
                    const commentsSection = document.getElementById('comments');
                    if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // 回复功能
    setupReply(commentId) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;
        
        this.currentReplyTo = commentId;
        
        const replyPreview = Utils.getElement('replyPreview');
        const replyContent = Utils.getElement('replyContent');
        
        if (replyContent) {
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
            textarea.value = `@${comment.author} `;
        }
        
        Utils.showNotification(`正在回复 ${comment.author}`, 'info');
    }

    cancelReply() {
        this.currentReplyTo = null;
        const replyPreview = Utils.getElement('replyPreview');
        if (replyPreview) {
            replyPreview.style.display = 'none';
        }
    }

    // 点赞功能
    likeComment(commentId) {
        const comment = this.findCommentById(commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            this.saveToLocalStorage();
            
            // 只更新点赞数，避免重新渲染整个列表
            const likeBtn = document.querySelector(`.like-btn[data-id="${commentId}"]`);
            if (likeBtn) {
                likeBtn.innerHTML = `<span>❤️</span> ${comment.likes}`;
                
                // 添加动画效果
                likeBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    likeBtn.style.transform = '';
                }, 300);
            }
            
            Utils.showNotification('点赞成功！', 'success');
        }
    }

    // 更新评论计数
    updateCommentsCount() {
        const count = this.getTotalCommentsCount();
        const countElement = Utils.getElement('commentsCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    getTotalCommentsCount() {
        let count = this.comments.length;
        this.comments.forEach(comment => {
            count += comment.replies ? comment.replies.length : 0;
        });
        return count;
    }

    // 删除功能
    showDeleteModal(commentId, isReply = false) {
        this.pendingDeleteId = commentId;
        this.pendingDeleteIsReply = isReply;
        
        const comment = this.findCommentById(commentId);
        if (!comment) return;
        
        const deleteModal = Utils.getElement('deleteModal');
        const deleteConfirmText = Utils.getElement('deleteConfirmText');
        const deleteModalTitle = Utils.getElement('deleteModalTitle');
        const adminAuthSection = Utils.getElement('adminAuthSection');
        
        if (!deleteModal || !deleteConfirmText || !deleteModalTitle || !adminAuthSection) return;
        
        // 设置模态框内容
        if (isReply) {
            deleteModalTitle.textContent = '确认删除回复';
            deleteConfirmText.textContent = `您确定要删除 ${Utils.escapeHtml(comment.author)} 的回复吗？此操作不可撤销。`;
        } else {
            deleteModalTitle.textContent = '确认删除留言';
            const repliesCount = comment.replies ? comment.replies.length : 0;
            
            if (repliesCount > 0) {
                deleteConfirmText.textContent = `您确定要删除 ${Utils.escapeHtml(comment.author)} 的主留言吗？这将同时删除 ${repliesCount} 条回复。`;
            } else {
                deleteConfirmText.textContent = `您确定要删除 ${Utils.escapeHtml(comment.author)} 的留言吗？此操作不可撤销。`;
            }
        }
        
        // 显示管理员验证
        adminAuthSection.style.display = 'block';
        const adminPassword = Utils.getElement('adminPassword');
        if (adminPassword) {
            adminPassword.value = '';
            adminPassword.focus();
        }
        
        deleteModal.classList.add('active');
    }

    hideDeleteModal() {
        const deleteModal = Utils.getElement('deleteModal');
        const adminAuthSection = Utils.getElement('adminAuthSection');
        
        if (deleteModal) deleteModal.classList.remove('active');
        if (adminAuthSection) adminAuthSection.style.display = 'none';
        
        this.pendingDeleteId = null;
        this.pendingDeleteIsReply = false;
    }

    confirmDelete() {
        if (!this.pendingDeleteId) return;
        
        const passwordInput = Utils.getElement('adminPassword');
        const password = passwordInput ? passwordInput.value.trim() : '';
        
        // 验证管理员密码
        if (password !== CONFIG.ADMIN_PASSWORD) {
            Utils.showNotification('管理员密码错误', 'error');
            
            // 密码错误动画
            if (passwordInput) {
                passwordInput.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    passwordInput.style.animation = '';
                }, 500);
            }
            return;
        }
        
        let success = false;
        
        if (this.pendingDeleteIsReply) {
            success = this.deleteReply(this.pendingDeleteId);
        } else {
            success = this.deleteComment(this.pendingDeleteId);
        }
        
        if (success) {
            Utils.showNotification('删除成功！', 'success');
        } else {
            Utils.showNotification('删除失败，请重试', 'error');
        }
        
        this.hideDeleteModal();
    }

    deleteComment(commentId) {
        try {
            const commentIndex = this.comments.findIndex(comment => comment.id === commentId);
            
            if (commentIndex !== -1) {
                this.comments.splice(commentIndex, 1);
                this.saveToLocalStorage();
                this.renderComments();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('删除评论时出错:', error);
            return false;
        }
    }

    deleteReply(replyId) {
        try {
            for (let i = 0; i < this.comments.length; i++) {
                const comment = this.comments[i];
                if (comment.replies && comment.replies.length > 0) {
                    const replyIndex = comment.replies.findIndex(reply => reply.id === replyId);
                    if (replyIndex !== -1) {
                        comment.replies.splice(replyIndex, 1);
                        this.saveToLocalStorage();
                        this.renderComments();
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('删除回复时出错:', error);
            return false;
        }
    }

    // 表情选择器
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
        
        // 表情数据
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
        
        // 常用表情
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

    // GitHub同步功能
    async syncToGitHub() {
        try {
            Utils.showNotification('正在同步数据...', 'info');
            
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 这里可以添加实际的GitHub API调用
            // 示例：将评论数据推送到GitHub
            
            Utils.showNotification('数据同步完成！', 'success');
        } catch (error) {
            console.error('GitHub同步失败:', error);
            Utils.showNotification('同步失败，请检查网络连接', 'error');
        }
    }

    async syncFromGitHub() {
        // 模拟从GitHub获取数据
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('GitHub API未配置');
    }

    // 导出功能
    exportComments() {
        try {
            const data = {
                exportTime: new Date().toISOString(),
                totalComments: this.getTotalCommentsCount(),
                comments: this.comments
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
        
        // 使用简单的混淆显示联系信息
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
        // 简单的电话号码混淆
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
    }
    
    obfuscateEmail(email) {
        // 简单的邮箱混淆
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
        this.init();
    }
    
    async init() {
        try {
            // 隐藏加载指示器
            this.hideLoadingIndicator();
            
            // 初始化各模块
            this.initModules();
            
            // 设置欢迎浮窗
            this.setupWelcomeOverlay();
            
            // 设置导航
            this.setupNavigation();
            
            // 确保视频播放
            this.setupVideo();
            
            // 设置全局错误处理
            this.setupErrorHandling();
            
            // 标记初始化完成
            this.isInitialized = true;
            
            console.log('🎉 应用初始化完成');
            
            // 延迟初始化复杂组件
            setTimeout(() => {
                this.initDelayedComponents();
            }, 100);
            
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
        // 初始化视频优化器
        new VideoOptimizer();
        
        // 初始化联系信息加载器
        new ContactInfoLoader();
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
                    // 可以在这里添加播放按钮或其他处理
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
            
            // 可以在这里发送错误报告
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
            
            // 性能报告
            const perfMonitor = new PerformanceMonitor();
            setTimeout(() => perfMonitor.report(), 1000);
            
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
                
                .admin-badge {
                    background: linear-gradient(135deg, #ff9800, #f57c00);
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
            `;
            document.head.appendChild(style);
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
    
    // 可以在这里添加加载完成后的操作
    setTimeout(() => {
        Utils.showNotification('欢迎来到 Mir-Lunto 的私人空间！', 'info', 2000);
    }, 1000);
});

// 页面关闭前保存数据
window.addEventListener('beforeunload', function(e) {
    // 如果有未保存的数据，可以提示用户
    // 注意：现代浏览器限制了这个功能
});

// 添加到全局对象，方便调试
window.Utils = Utils;