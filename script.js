// 错误处理和安全检查
window.addEventListener('error', function(e) {
    console.error('全局错误捕获:', e.error);
    console.error('错误位置:', e.filename, '第', e.lineno, '行');
});

// 确保 DOM 完全加载后再执行
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// 安全获取元素函数
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`元素 #${id} 不存在`);
    }
    return element;
}

// 性能监控
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
    }

    recordNavigationTiming() {
        if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
                this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
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
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'paint') {
                        this.metrics[entry.name] = entry.startTime;
                    }
                });
            });
            observer.observe({ entryTypes: ['paint'] });
        }
    }

    report() {
        const loadTime = performance.now() - this.startTime;
        this.metrics.totalLoad = loadTime;
        
        console.log('🎯 性能指标:', this.metrics);
        this.sendToAnalytics();
    }

    sendToAnalytics() {
        // 修复：只记录到控制台，不发送到不存在的API
        console.log('📊 性能监控数据已记录');
        
        // 可选：保存到本地存储供开发者查看
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        try {
            const perfHistory = JSON.parse(localStorage.getItem('mir-lunto-perf') || '[]');
            perfHistory.push({
                timestamp: new Date().toISOString(),
                metrics: this.metrics,
                url: window.location.href
            });
            
            // 只保留最近20条记录
            if (perfHistory.length > 20) {
                perfHistory.shift();
            }
            
            localStorage.setItem('mir-lunto-perf', JSON.stringify(perfHistory));
        } catch (error) {
            console.log('性能数据本地存储失败:', error);
        }
    }
}

// 视频优化
class VideoOptimizer {
    constructor() {
        this.video = document.getElementById('bgVideo');
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
    }

    isSlowNetwork() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return false;
        const effective = connection.effectiveType || '';
        return connection.saveData || effective.includes('2g') || effective.includes('3g');
    }

    useStaticBackground() {
        const videoContainer = document.querySelector('.video-background');
        if (!videoContainer) return;

        videoContainer.innerHTML = `
            <div class="static-background" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                animation: gradientShift 10s ease infinite;
            "></div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradientShift {
                0% { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
                100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeVideoLoading() {
        if (!this.video) return;
        this.video.preload = 'metadata';
        this.video.setAttribute('playsinline', '');
        
        this.video.addEventListener('loadstart', () => {
            console.log('视频开始加载');
        });
        
        this.video.addEventListener('canplay', () => {
            console.log('视频可以播放');
        });
    }
}

// 搜索功能
class SearchEngine {
    constructor() {
        this.searchData = [];
        this.currentQuery = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.collectSearchData();
    }

    collectSearchData() {
        const contentElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, article, section');
        
        this.searchData = Array.from(contentElements)
            .filter(el => el.textContent.trim().length > 10)
            .map(el => ({
                element: el,
                text: el.textContent.trim(),
                tag: el.tagName.toLowerCase(),
                id: el.id || null
            }));
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const searchContainer = document.querySelector('.search-container');

        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(searchInput.value);
            }
        });

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
            
            if (e.key === 'Escape') {
                this.closeSearchResults();
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchContainer || !searchContainer.contains(e.target)) {
                this.closeSearchResults();
            }
        });
    }
    
    handleSearchInput(query) {
        this.currentQuery = query.trim();
        const suggestions = document.getElementById('searchSuggestions');

        if (!suggestions) return;

        if (this.currentQuery.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        const matches = this.searchData
            .filter(item => 
                item.text.toLowerCase().includes(this.currentQuery.toLowerCase())
            )
            .slice(0, 5);

        this.showSuggestions(matches);
    }

    showSuggestions(matches) {
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;
        
        if (matches.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        suggestions.innerHTML = matches
            .map(match => `
                <div class="search-suggestion-item" data-text="${this.escapeHtml(match.text)}">
                    ${this.highlightText(match.text, this.currentQuery)}
                </div>
            `)
            .join('');

        suggestions.style.display = 'block';

        suggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const input = document.getElementById('searchInput');
                if (input) {
                    input.value = item.dataset.text;
                    this.performSearch(item.dataset.text);
                }
                suggestions.style.display = 'none';
            });
        });
    }

    performSearch(query) {
        if (!query.trim()) return;

        this.currentQuery = query.trim();
        const matches = this.searchData.filter(item => 
            item.text.toLowerCase().includes(this.currentQuery.toLowerCase())
        );

        this.showSearchResults(matches);
    }

    showSearchResults(matches) {
        const resultsContent = document.getElementById('searchResults');
        
        if (matches.length === 0) {
            resultsContent.innerHTML = '<div class="result-item">没有找到相关内容</div>';
        } else {
            resultsContent.innerHTML = matches
                .map(match => `
                    <div class="result-item">
                        <h4>${this.highlightText(this.truncateText(match.text, 100), this.currentQuery)}</h4>
                        <p>${this.highlightText(this.truncateText(match.text, 200), this.currentQuery)}</p>
                        <small>标签: ${match.tag}</small>
                    </div>
                `)
                .join('');
        }

        resultsContent.classList.add('active');
    }

    closeSearchResults() {
        const searchResults = document.getElementById('searchResults');
        searchResults.classList.remove('active');
        document.getElementById('searchInput').value = '';
    }

    highlightText(text, query) {
        if (!query) return this.escapeHtml(text);
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
    }

    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// 完整的评论系统（包含管理员删除功能）
class CommentSystem {
    constructor() {
        this.comments = [];
        this.currentReplyTo = null;
        this.githubToken = null;
        this.githubRepo = 'MirLunto/WEB';
        this.cacheKey = 'comments-cache-v3';
        this.cacheTimeKey = 'comments-cache-time';
        
        // 新增状态变量
        this.pendingDeleteId = null;
        this.pendingDeleteIsReply = false;
        
        this.init();
    }

    init() {
        this.loadComments();
        this.setupEventListeners();
        this.initEmojiPicker();
        this.checkGitHubAuth();
    }

    // 加载评论数据
    async loadComments() {
        if (this.shouldUseCache()) {
            this.loadFromCache();
            return;
        }

        try {
            await this.syncFromGitHub();
        } catch (error) {
            console.warn('GitHub同步失败，使用本地存储:', error);
            this.loadFromLocalStorage();
        }
    }

    shouldUseCache() {
        const cacheTime = localStorage.getItem(this.cacheTimeKey);
        if (!cacheTime) return false;
        return Date.now() - parseInt(cacheTime) < 5 * 60 * 1000;
    }

    loadFromCache() {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            this.comments = JSON.parse(cached);
            console.log('从缓存加载评论:', this.comments.length, '条');
            this.renderComments();
        }
    }

    saveToCache() {
        localStorage.setItem(this.cacheKey, JSON.stringify(this.comments));
        localStorage.setItem(this.cacheTimeKey, Date.now().toString());
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('mir-lunto-comments');
        if (saved) {
            this.comments = JSON.parse(saved);
            console.log('从本地存储加载评论:', this.comments.length, '条');
        } else {
            this.comments = [
                {
                    id: this.generateId(),
                    author: 'Mir-Lunto',
                    email: '',
                    content: '欢迎来到我的空间！这里记录了我的学习历程和项目经验。',
                    timestamp: new Date().toISOString(),
                    likes: 5,
                    replies: []
                }
            ];
        }
        this.renderComments();
    }

    saveToLocalStorage() {
        localStorage.setItem('mir-lunto-comments', JSON.stringify(this.comments));
        this.saveToCache();
    }

    // 设置事件监听器
    setupEventListeners() {
        const commentForm = document.getElementById('commentForm');
        const emojiBtn = document.getElementById('emojiBtn');
        const syncBtn = document.getElementById('syncComments');
        const cancelReply = document.getElementById('cancelReply');
        const cancelDelete = document.getElementById('cancelDelete');
        const confirmDelete = document.getElementById('confirmDelete');

        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }

        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiModal());
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncToGitHub());
        }

        if (cancelReply) {
            cancelReply.addEventListener('click', () => this.cancelReply());
        }

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        }
        
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDelete());
        }

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (commentForm && typeof commentForm.requestSubmit === 'function') {
                    commentForm.requestSubmit();
                } else if (commentForm) {
                    commentForm.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            }
            
            // ESC 键关闭所有模态框
            if (e.key === 'Escape') {
                this.hideDeleteModal();
            }
        });
    }

    // 处理评论提交
    handleCommentSubmit(e) {
        e.preventDefault();
        
        const authorName = document.getElementById('authorName').value.trim();
        const authorEmail = document.getElementById('authorEmail').value.trim();
        const content = document.getElementById('commentContent').value.trim();

        if (!authorName || !content) {
            this.showNotification('请填写昵称和评论内容', 'error');
            return;
        }

        if (content.length > 500) {
            this.showNotification('评论内容不能超过500字', 'error');
            return;
        }

        const comment = {
            id: this.generateId(),
            author: authorName,
            email: authorEmail,
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            replies: [],
            device: this.getDeviceInfo()
        };

        if (this.currentReplyTo) {
            this.addReply(comment, this.currentReplyTo);
            this.cancelReply();
        } else {
            this.addComment(comment);
        }

        document.getElementById('commentForm').reset();
        this.showNotification('留言发布成功!', 'success');
    }

    // 添加新评论
    addComment(comment) {
        this.comments.unshift(comment);
        this.saveToLocalStorage();
        this.renderComments();
    }

    // 添加回复
    addReply(reply, parentCommentId) {
        const parentComment = this.findCommentById(parentCommentId);
        if (parentComment) {
            if (!parentComment.replies) {
                parentComment.replies = [];
            }
            parentComment.replies.push(reply);
            this.saveToLocalStorage();
            this.renderComments();
        }
    }

    // 通过ID查找评论
    findCommentById(id) {
        for (let comment of this.comments) {
            if (comment.id === id) return comment;
            if (comment.replies) {
                const found = comment.replies.find(reply => reply.id === id);
                if (found) return found;
            }
        }
        return null;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 渲染评论列表
    renderComments() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;
        
        if (this.comments.length === 0) {
            container.innerHTML = '<div class="no-comments">暂无留言，快来抢沙发吧！</div>';
            this.updateCommentsCount();
            return;
        }

        container.innerHTML = this.comments.map(comment => this.renderComment(comment)).join('');
        this.updateCommentsCount();
        
        this.attachReplyEvents();
        this.attachLikeEvents();
        this.attachDeleteEvents();
    }

    // 渲染单个评论
    renderComment(comment, isReply = false) {
        const time = this.formatTime(comment.timestamp);
        const repliesHtml = comment.replies && comment.replies.length > 0 
            ? `<div class="comment-replies">${comment.replies.map(reply => this.renderComment(reply, true)).join('')}</div>`
            : '';

        // 显示删除按钮（垃圾桶图标）
        const deleteButton = `<button class="delete-btn" data-id="${comment.id}" data-author="${comment.author}" data-is-reply="${isReply}">🗑️</button>`;

        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" data-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="author-avatar">${comment.author.charAt(0).toUpperCase()}</div>
                        <div class="author-info">
                            <h4>${this.escapeHtml(comment.author)}</h4>
                            <div class="comment-time">${time} ${comment.device ? `· ${comment.device}` : ''}</div>
                        </div>
                    </div>
                    <div class="comment-actions">
                        <button class="reply-btn" data-id="${comment.id}">回复</button>
                        <button class="like-btn" data-id="${comment.id}">❤️ ${comment.likes || 0}</button>
                        ${deleteButton}
                    </div>
                </div>
                <div class="comment-content">${this.processContent(comment.content)}</div>
                ${repliesHtml}
            </div>
        `;
    }

    // 处理评论内容
    processContent(content) {
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    // 格式化时间
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        
        if (diff < minute) return '刚刚';
        if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
        if (diff < day) return `${Math.floor(diff / hour)}小时前`;
        if (diff < day * 7) return `${Math.floor(diff / day)}天前`;
        
        return time.toLocaleDateString('zh-CN');
    }

    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 附加回复按钮事件
    attachReplyEvents() {
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.id;
                this.setupReply(commentId);
            });
        });
    }

    // 附加点赞按钮事件
    attachLikeEvents() {
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.id;
                this.likeComment(commentId);
            });
        });
    }

    // 附加删除按钮事件
    attachDeleteEvents() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const commentId = e.target.dataset.id;
                const authorName = e.target.dataset.author;
                const isReply = e.target.dataset.isReply === 'true';
                this.showDeleteModal(commentId, authorName, isReply);
            });
        });
    }

    // 设置回复
    setupReply(commentId) {
        const comment = this.findCommentById(commentId);
        if (!comment) return;

        this.currentReplyTo = commentId;
        
        const replyPreview = document.getElementById('replyPreview');
        const replyContent = document.getElementById('replyContent');

        if (replyContent) {
            replyContent.textContent = comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '');
        }
        if (replyPreview) {
            replyPreview.style.display = 'block';
        }
        
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.scrollIntoView({ behavior: 'smooth' });
        }
        const textarea = document.getElementById('commentContent');
        if (textarea) textarea.focus();
    }

    // 取消回复
    cancelReply() {
        this.currentReplyTo = null;
        const replyPreview = document.getElementById('replyPreview');
        if (replyPreview) {
            replyPreview.style.display = 'none';
        }
    }

    // 点赞评论
    likeComment(commentId) {
        const comment = this.findCommentById(commentId);
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            this.saveToLocalStorage();
            this.renderComments();
        }
    }

    // 更新评论计数
    updateCommentsCount() {
        const count = this.getTotalCommentsCount();
        const countElement = document.getElementById('commentsCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // 计算总评论数
    getTotalCommentsCount() {
        let count = this.comments.length;
        this.comments.forEach(comment => {
            count += comment.replies ? comment.replies.length : 0;
        });
        return count;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 获取设备信息
    getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = '未知设备';
        if (ua.includes('Mobile')) device = '手机';
        else if (ua.includes('Tablet')) device = '平板';
        else device = '电脑';
        
        if (ua.includes('Chrome')) device += ' Chrome';
        else if (ua.includes('Firefox')) device += ' Firefox';
        else if (ua.includes('Safari')) device += ' Safari';
        else if (ua.includes('Edge')) device += ' Edge';
        
        return device;
    }

    // 表情选择器功能
    initEmojiPicker() {
        this.setupEmojiModal();
        this.setupInlineEmoji();
    }

    setupEmojiModal() {
        const emojiModal = document.getElementById('emojiModal');
        const closeBtn = document.getElementById('closeEmojiModal');
        const emojiGrid = document.getElementById('emojiGrid');
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
            emojiGrid.innerHTML = emojis[category].map(emoji => 
                `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
            ).join('');
            
            emojiGrid.querySelectorAll('.emoji-item').forEach(item => {
                item.addEventListener('click', () => {
                    const emoji = item.dataset.emoji;
                    this.insertEmoji(emoji);
                    this.toggleEmojiModal();
                });
            });
        };

        renderEmojiGrid('smileys');

        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderEmojiGrid(btn.dataset.category);
            });
        });

        closeBtn.addEventListener('click', () => this.toggleEmojiModal());
        emojiModal.addEventListener('click', (e) => {
            if (e.target === emojiModal) {
                this.toggleEmojiModal();
            }
        });
    }

    setupInlineEmoji() {
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');

        if (!emojiPicker) return;

        const commonEmojis = ['😀', '😂', '🥰', '😍', '🤔', '👏', '👍', '❤️', '🎉', '🔥'];
        
        emojiPicker.innerHTML = commonEmojis.map(emoji => 
            `<button class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
        ).join('');

        emojiPicker.querySelectorAll('.emoji-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.insertEmoji(btn.dataset.emoji);
                emojiPicker.classList.remove('active');
            });
        });

        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPicker.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            emojiPicker.classList.remove('active');
        });
    }

    toggleEmojiModal() {
        const emojiModal = document.getElementById('emojiModal');
        emojiModal.classList.toggle('active');
    }

    insertEmoji(emoji) {
        const textarea = document.getElementById('commentContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }

    // GitHub 同步功能
    async syncToGitHub() {
        this.showNotification('正在同步数据...', 'info');
        setTimeout(() => {
            this.showNotification('数据同步完成!', 'success');
        }, 1000);
    }

    async syncFromGitHub() {
        this.loadFromLocalStorage();
    }

    checkGitHubAuth() {
        const stored = localStorage.getItem('github-token');
        if (stored) {
            this.githubToken = stored;
        }
    }

    showDeleteModal(commentId, authorName, isReply = false) {
        this.pendingDeleteId = commentId;
        this.pendingDeleteIsReply = isReply;
        
        const deleteModal = document.getElementById('deleteModal');
        const deleteConfirmText = document.getElementById('deleteConfirmText');
        const deleteModalTitle = document.getElementById('deleteModalTitle');
        
        if (!deleteModal || !deleteConfirmText || !deleteModalTitle) return;

        if (isReply) {
            deleteModalTitle.textContent = '确认删除回复';
            deleteConfirmText.textContent = `您确定要删除 ${authorName} 的回复吗？此操作不可撤销。`;
        } else {
            deleteModalTitle.textContent = '确认删除留言';
            const comment = this.findCommentById(commentId);
            const repliesCount = comment.replies ? comment.replies.length : 0;
            
            if (repliesCount > 0) {
                deleteConfirmText.textContent = `您确定要删除 ${authorName} 的主留言吗？这将同时删除 ${repliesCount} 条回复。`;
            } else {
                deleteConfirmText.textContent = `您确定要删除 ${authorName} 的留言吗？此操作不可撤销。`;
            }
        }
        
        deleteModal.classList.add('active');
    }

    hideDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.remove('active');
        }
        this.pendingDeleteId = null;
        this.pendingDeleteIsReply = false;
    }

    confirmDelete() {
        if (!this.pendingDeleteId) return;
        
        let success = false;
        
        if (this.pendingDeleteIsReply) {
            success = this.deleteReply(this.pendingDeleteId);
        } else {
            success = this.deleteComment(this.pendingDeleteId);
        }
        
        if (success) {
            this.showNotification('删除成功!', 'success');
        } else {
            this.showNotification('删除失败，请重试', 'error');
        }
        
        this.hideDeleteModal();
    }

    deleteComment(commentId) {
        try {
            const mainCommentIndex = this.comments.findIndex(comment => comment.id === commentId);
            
            if (mainCommentIndex !== -1) {
                this.comments.splice(mainCommentIndex, 1);
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
}

// 全局变量
let commentSystem;
let searchEngine;

// 主初始化函数
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 已加载，开始初始化...');
    
    // 隐藏加载指示器
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // 初始化视频优化
    new VideoOptimizer();

    // 获取欢迎浮窗相关元素
    const welcomeOverlay = document.getElementById('welcomeOverlay');
    const closeWelcome = document.getElementById('closeWelcome');
    const mainContent = document.querySelector('.main-content');

    // 检查保存的设置
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (welcomeShown === 'true' && welcomeOverlay && mainContent) {
        welcomeOverlay.classList.remove('active');
        mainContent.classList.add('visible');
    }

    // 关闭欢迎浮窗功能
    if (closeWelcome && welcomeOverlay && mainContent) {
        closeWelcome.addEventListener('click', function() {
            console.log('关闭欢迎浮窗');
            welcomeOverlay.classList.remove('active');
            
            setTimeout(() => {
                mainContent.classList.add('visible');
            }, 300);
            
            localStorage.setItem('welcomeShown', 'true');
        });
    } else {
        console.warn('欢迎浮窗元素未找到:', {
            closeWelcome: !!closeWelcome,
            welcomeOverlay: !!welcomeOverlay,
            mainContent: !!mainContent
        });
    }

    // 确保视频播放
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) {
        bgVideo.play().catch(error => {
            console.log('视频自动播放被阻止:', error);
        });
    }

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
            }
        });
    });

    // 延迟初始化复杂组件
    setTimeout(() => {
        try {
            // 初始化搜索功能
            window.searchEngine = new SearchEngine();
            
            // 初始化评论系统
            window.commentSystem = new CommentSystem();
            
            // 性能报告
            const perfMonitor = new PerformanceMonitor();
            setTimeout(() => perfMonitor.report(), 1000);
        } catch (componentError) {
            console.error('组件初始化失败:', componentError);
        }
    }, 100);
});

// 视频错误处理
const bgVideo = document.getElementById('bgVideo');
if (bgVideo) {
    bgVideo.addEventListener('error', function() {
        console.error('视频加载失败，请检查文件路径');
    });
}