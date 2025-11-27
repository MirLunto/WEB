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
        if (this.isSlowNetwork()) {
            this.useStaticBackground();
            return;
        }
        this.optimizeVideoLoading();
    }

    isSlowNetwork() {
        const connection = navigator.connection;
        return connection && (
            connection.saveData || 
            connection.effectiveType.includes('2g') ||
            connection.effectiveType.includes('3g')
        );
    }

    useStaticBackground() {
        const videoContainer = document.querySelector('.video-background');
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

// 欢迎浮窗功能
const welcomeOverlay = document.getElementById('welcomeOverlay');
const closeWelcome = document.getElementById('closeWelcome');
const mainContent = document.querySelector('.main-content');

// 搜索功能元素
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');

// 模拟文章数据
const articles = [
    {
        title: "JavaScript 学习笔记",
        content: "关于 JavaScript 的一些学习心得和技巧...",
        tags: ["编程", "JavaScript", "前端"],
        link: "#"
    },
    {
        title: "现代网页设计趋势",
        content: "探讨当前网页设计的最新趋势和发展方向...",
        tags: ["设计", "UI", "用户体验"],
        link: "#"
    },
    {
        title: "我的学习方法论",
        content: "分享我个人的学习方法和效率技巧...",
        tags: ["生活", "思考", "个人成长"],
        link: "#"
    },
    {
        title: "数据库优化实践",
        content: "在实际项目中优化数据库性能的经验...",
        tags: ["技术", "后端", "数据库"],
        link: "#"
    }
];

// 关闭欢迎浮窗
closeWelcome.addEventListener('click', function() {
    welcomeOverlay.classList.remove('active');
    
    setTimeout(() => {
        mainContent.classList.add('visible');
    }, 300);
    
    localStorage.setItem('welcomeShown', 'true');
});

// 搜索功能
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        searchResults.classList.remove('active');
        return;
    }
    
    const filteredArticles = articles.filter(article => {
        return article.title.toLowerCase().includes(searchTerm) ||
               article.content.toLowerCase().includes(searchTerm) ||
               article.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });
    
    displaySearchResults(filteredArticles, searchTerm);
}

function displaySearchResults(results, searchTerm) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="result-item">没有找到相关文章</div>';
    } else {
        results.forEach(article => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.innerHTML = `
                <h4>${highlightText(article.title, searchTerm)}</h4>
                <p>${highlightText(article.content, searchTerm)}</p>
                <small>标签: ${article.tags.map(tag => highlightText(tag, searchTerm)).join(', ')}</small>
            `;
            resultItem.addEventListener('click', () => {
                alert(`跳转到: ${article.title}`);
                searchResults.classList.remove('active');
                searchInput.value = '';
            });
            searchResults.appendChild(resultItem);
        });
    }
    
    searchResults.classList.add('active');
}

// 高亮搜索关键词
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 搜索事件监听
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// 点击页面其他区域关闭搜索结果
document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
        searchResults.classList.remove('active');
    }
});

// 优化后的评论系统
class OptimizedCommentSystem {
    constructor() {
        this.comments = [];
        this.dataFileUrl = 'https://raw.githubusercontent.com/MirLunto/mir-lunto-data/main/comments.json';
        this.cacheKey = 'comments-cache-v2';
        this.cacheTimeKey = 'comments-cache-time';
        this.init();
    }

    async init() {
        await this.loadComments();
        this.displayComments();
        this.setupEventListeners();
    }

    async loadComments() {
        if (this.shouldUseCache()) {
            this.loadFromCache();
            return;
        }

        try {
            const response = await fetch(this.dataFileUrl + '?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                this.comments = data.comments || [];
                console.log('从GitHub加载评论成功:', this.comments.length, '条');
                this.saveToCache();
            } else {
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.warn('GitHub数据加载失败，使用本地存储:', error);
            this.loadFromLocalStorage();
        }
    }

    shouldUseCache() {
        const cacheTime = localStorage.getItem(this.cacheTimeKey);
        if (!cacheTime) return false;
        return Date.now() - parseInt(cacheTime) < 5 * 60 * 1000; // 5分钟缓存
    }

    loadFromCache() {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            this.comments = JSON.parse(cached);
            console.log('从缓存加载评论:', this.comments.length, '条');
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
                    id: 1,
                    name: 'Mir-Lunto',
                    content: '欢迎来到我的空间！这里记录了我的学习历程和项目经验。',
                    time: new Date().toLocaleString('zh-CN'),
                    device: '示例数据'
                }
            ];
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('mir-lunto-comments', JSON.stringify(this.comments));
    }

    async submitComment(name, content) {
        const startTime = performance.now();
        
        const newComment = {
            id: Date.now(),
            name: name.trim(),
            content: content.trim(),
            time: new Date().toLocaleString('zh-CN'),
            device: this.getDeviceInfo()
        };

        this.comments.unshift(newComment);
        this.saveToLocalStorage();
        this.saveToCache();
        this.displayComments();
        
        const endTime = performance.now();
        console.log(`评论提交耗时: ${(endTime - startTime).toFixed(2)}ms`);
        
        this.showMessage('评论发布成功！', 'success');
        return true;
    }

    displayComments() {
        const container = document.getElementById('commentsContainer');
        if (!container) return;
        
        if (this.comments.length === 0) {
            container.innerHTML = '<div class="no-comments">暂无评论，快来留下第一条吧！</div>';
            return;
        }

        container.innerHTML = this.comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <strong>${this.escapeHtml(comment.name)}</strong>
                    <span class="comment-time">${comment.time}</span>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                ${comment.device ? `<div class="comment-device">来自: ${comment.device}</div>` : ''}
            </div>
        `).join('');
    }

    setupEventListeners() {
        const submitBtn = document.getElementById('submitComment');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        const contentInput = document.getElementById('commentContent');
        if (contentInput) {
            contentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleSubmit();
                }
            });
        }
    }

    async handleSubmit() {
        const nameInput = document.getElementById('commentName');
        const contentInput = document.getElementById('commentContent');
        
        const name = nameInput?.value.trim() || '';
        const content = contentInput?.value.trim() || '';

        if (!name) {
            this.showMessage('请填写您的名字', 'error');
            return;
        }
        if (!content) {
            this.showMessage('请填写评论内容', 'error');
            return;
        }
        if (content.length > 500) {
            this.showMessage('评论内容不能超过500字', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitComment');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '发布中...';
        submitBtn.disabled = true;

        try {
            await this.submitComment(name, content);
            if (nameInput) nameInput.value = '';
            if (contentInput) contentInput.value = '';
        } catch (error) {
            this.showMessage('发布失败: ' + error.message, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) existingMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 12px 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white; border-radius: 5px; z-index: 10000;
            animation: slideIn 0.3s ease; max-width: 300px;
        `;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全局变量
let commentSystem;
const perfMonitor = new PerformanceMonitor();

// 主初始化函数
document.addEventListener('DOMContentLoaded', function() {
    // 隐藏加载指示器
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // 初始化视频优化
    new VideoOptimizer();

    // 检查保存的设置
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (welcomeShown === 'true') {
        welcomeOverlay.classList.remove('active');
        mainContent.classList.add('visible');
    }

    // 确保视频播放
    const bgVideo = document.getElementById('bgVideo');
    bgVideo.play().catch(error => {
        console.log('视频自动播放被阻止:', error);
    });

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

    // 初始化评论系统
    commentSystem = new OptimizedCommentSystem();
    
    // 确保评论容器存在
    if (!document.getElementById('commentsContainer')) {
        const articlesSection = document.querySelector('#articles');
        if (articlesSection) {
            articlesSection.insertAdjacentHTML('afterend', `
                <section id="comments" class="content-section">
                    <h2>💬 留言区</h2>
                    <div class="comment-form">
                        <input type="text" id="commentName" placeholder="怎么称呼您？" maxlength="20">
                        <textarea id="commentContent" placeholder="分享您的想法...（支持Ctrl+Enter快捷提交）" maxlength="500"></textarea>
                        <button id="submitComment">发布留言</button>
                    </div>
                    <div id="commentsContainer" class="comments-list">
                        <!-- 评论将动态加载到这里 -->
                    </div>
                </section>
            `);
        }
    }

    // 性能报告
    setTimeout(() => perfMonitor.report(), 1000);
});

// 视频错误处理
const bgVideo = document.getElementById('bgVideo');
bgVideo.addEventListener('error', function() {
    console.error('视频加载失败，请检查文件路径');
});