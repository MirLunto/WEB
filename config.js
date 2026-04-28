// ==================== Supabase 配置文件 ====================
// 本文件负责：
// 1. 定义 Supabase 项目连接参数（URL 和匿名密钥）
// 2. 定义数据库表名常量，方便统一管理和修改
// 3. 封装 Supabase 客户端初始化逻辑
// 4. 同时支持浏览器全局变量和 Node.js 模块两种导出方式

// supabase-config.js

// -------------------- Supabase 项目配置 --------------------
const SUPABASE_CONFIG = {
  // 替换为你的Supabase项目URL
  // 每个 Supabase 项目都有唯一的 URL，用于访问数据库和认证服务
  url: 'https://bjmevmnctabebmmppqrf.supabase.co',
  
  // 替换为你的Supabase Anon Key
  // 这是公开的匿名密钥（anon key），用于前端安全地访问数据库
  // 它受 Supabase 的行级安全策略（RLS）约束，不会暴露敏感数据
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbWV2bW5jdGFiZWJtbXBwcXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY4MjUsImV4cCI6MjA4MDE4MjgyNX0.tBClz1Cjh5MbMH3mxICBoNPYrWfncK0qYR7T3S0kKas'
};

// -------------------- 数据库表名常量 --------------------
// 将表名集中定义为常量，有以下好处：
// 1. 避免在多个文件中硬编码字符串，减少拼写错误
// 2. 如果表名需要修改，只需改这一处即可
const TABLE_NAMES = {
  guestbook: 'guestbook',   // 留言/评论表
  admins: 'admins',         // 管理员账户表
  projects: 'projects',     // 项目展示表
  articles: 'articles'      // 文章内容表
};

// -------------------- Supabase 客户端初始化函数 --------------------
// 调用此函数会创建并返回一个 Supabase 客户端实例
// 所有与数据库的交互（增删改查、认证）都通过这个客户端进行
function initSupabase() {
  // 安全检查：确保配置信息已填写
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.error('Supabase配置不完整，请检查supabase-config.js');
    return null;  // 返回 null，调用方可以据此判断初始化失败
  }
  
  try {
    // 使用 Supabase JS SDK 的 createClient 方法创建客户端
    // 传入项目 URL 和匿名密钥，以及可选的配置对象
    const client = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        // --- 认证相关配置 ---
        auth: {
          autoRefreshToken: true,
          // 自动刷新访问令牌（access token），避免用户登录态过期
          
          persistSession: false,
          // 不将会话持久化到本地存储（localStorage）
          // 适用于需要更高安全性的场景，用户刷新页面后需重新登录
          
          detectSessionInUrl: true
          // 自动检测 URL 中的会话信息（如 OAuth 回调时附带的 token）
        },
        
        // --- 全局请求配置 ---
        global: {
          headers: {
            // 明确 charset 以减少兼容性警告（注意：服务端也应正确返回 Content-Type）
            // 设置请求头的内容类型为 JSON，并指定 UTF-8 编码
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      }
    );
    
    // 初始化成功，打印确认信息到控制台
    console.log('Supabase客户端初始化成功');
    return client;  // 返回创建好的客户端实例
  } catch (error) {
    // 捕获初始化过程中可能出现的异常
    console.error('Supabase客户端初始化失败:', error);
    return null;
  }
}

// -------------------- 模块导出逻辑 --------------------
// 这段代码兼容两种运行环境：

// 1. Node.js 环境（如使用构建工具时）
//    检查是否存在 module.exports，如果有则用 CommonJS 方式导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, TABLE_NAMES, initSupabase };
} 
// 2. 浏览器环境（直接在 HTML 中通过 <script> 引入）
//    将配置和函数挂载到全局 window 对象上，其他 JS 文件可以直接访问
else {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.TABLE_NAMES = TABLE_NAMES;
  window.initSupabase = initSupabase;
}