// supabase-config.js
const SUPABASE_CONFIG = {
  // 替换为你的Supabase项目URL
  url: 'https://bjmevmnctabebmmppqrf.supabase.co',
  // 替换为你的Supabase Anon Key
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbWV2bW5jdGFiZWJtbXBwcXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDY4MjUsImV4cCI6MjA4MDE4MjgyNX0.tBClz1Cjh5MbMH3mxICBoNPYrWfncK0qYR7T3S0kKas'
};

// 表名常量
const TABLE_NAMES = {
  guestbook: 'guestbook',
  admins: 'admins'
};

// 初始化Supabase客户端
function initSupabase() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.error('Supabase配置不完整，请检查supabase-config.js');
    Utils.showNotification('Supabase配置错误，请检查配置文件', 'error');
    return null;
  }
  
  try {
    const client = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false, // 禁用持久化，避免 Tracking Prevention 阻止 storage 访问（开发时使用）
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }
    );
    
    console.log('Supabase客户端初始化成功');
    return client;
  } catch (error) {
    console.error('Supabase客户端初始化失败:', error);
    Utils.showNotification('Supabase初始化失败', 'error');
    return null;
  }
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, TABLE_NAMES, initSupabase };
} else {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.TABLE_NAMES = TABLE_NAMES;
  window.initSupabase = initSupabase;
}