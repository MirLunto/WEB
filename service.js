// supabase-service.js
class SupabaseService {
  constructor() {
    this.client = initSupabase();
    this.user = null;
    this.isAdmin = false;
    this.isConnected = false;
    // 只有在 client 初始化成功时才继续初始化
    if (this.client) {
      this.init();
    } else {
      console.warn('Supabase client 未初始化，已跳过服务初始化');
    }
  }

  async init() {
    if (!this.client) {
      console.error('Supabase客户端初始化失败');
      return;
    }

    // 测试连接
    await this.testConnection();
    
    // 检查当前会话
    await this.checkSession();
    
    // 监听认证状态变化
    this.setupAuthListener();
  }

  async testConnection() {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.guestbook)
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase连接测试失败:', error);
        this.isConnected = false;
        return false;
      }

      this.isConnected = true;
      console.log('Supabase连接成功');
      return true;
    } catch (error) {
      console.error('连接测试异常:', error);
      this.isConnected = false;
      return false;
    }
  }

  async checkSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) {
        console.error('获取会话失败:', error);
        return { session: null, user: null };
      }
      
      if (session) {
        this.user = session.user;
        await this.checkAdminStatus();
        console.log('当前用户:', this.user.email, '管理员:', this.isAdmin);
      } else {
        this.user = null;
        this.isAdmin = false;
      }
      
      return { session, user: this.user };
    } catch (error) {
      console.error('检查会话失败:', error);
      return { session: null, user: null };
    }
  }

  setupAuthListener() {
    if (!this.client) return;
    
    this.client.auth.onAuthStateChange(async (event, session) => {
      console.log('认证状态变化:', event);
      
      if (session) {
        this.user = session.user;
        await this.checkAdminStatus();
      } else {
        this.user = null;
        this.isAdmin = false;
      }
      
      // 触发UI更新
      if (window.app && window.app.updateLoginUI) {
        window.app.updateLoginUI();
      }
    });
  }

  async checkAdminStatus() {
    // 确保 client 已初始化 && user 存在
    if (!this.client || !this.user || !this.user.id) {
      this.isAdmin = false;
      return false;
    }

    try {
      const { data, error, status } = await this.client
        .from(TABLE_NAMES.admins)
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error) {
        // 更详尽的日志，便于在 Network/Logs 中排查
        console.error('checkAdminStatus 错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          status
        });
        this.isAdmin = false;
        return false;
      }

      this.isAdmin = !!data;
      return this.isAdmin;
    } catch (err) {
      console.error('checkAdminStatus 异常:', err);
      this.isAdmin = false;
      return false;
    }
  }

  // 管理员登录（增强日志，返回完整信息）
  async adminLogin(email, password) {
    try {
      const res = await this.client.auth.signInWithPassword({
        email: email,
        password: password
      });

      // signInWithPassword 返回 { data, error }
      if (res.error) {
        console.error('管理员登录失败（auth）:', res.error);
        return { success: false, error: res.error };
      }

      // ensure session/user present
      const session = res.data?.session ?? null;
      const user = res.data?.user ?? null;
      if (!user) {
        console.warn('管理员登录没有返回 user 对象', res);
        return { success: false, error: { message: '未返回用户信息', raw: res } };
      }

      this.user = user;
      // 记录 user id 以便手动在 Supabase 检查 admins 表
      console.log('登录成功，user id:', user.id, 'email:', user.email);

      await this.checkAdminStatus();

      return { success: true, user, isAdmin: this.isAdmin, session };
    } catch (error) {
      console.error('管理员登录异常:', error);
      return { success: false, error };
    }
  }

  // 登出
  async logout() {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;

      this.user = null;
      this.isAdmin = false;
      
      console.log('用户已登出');
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取留言
  async getComments(limit = 100, offset = 0) {
    try {
      const { data, error, count } = await this.client
        .from(TABLE_NAMES.guestbook)
        .select('*, parent:parent_id(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { 
        success: true, 
        data: data || [], 
        count: count || 0 
      };
    } catch (error) {
      console.error('获取留言失败:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message 
      };
    }
  }

  // 添加留言
  async addComment(commentData) {
    try {
      const comment = {
        author: commentData.author,
        email: commentData.email || null,
        content: commentData.content,
        mood: commentData.mood || '😊',
        device: commentData.device || '',
        is_admin: commentData.isAdmin || false
      };

      // 如果是回复，添加parent_id
      if (commentData.parent_id) {
        comment.parent_id = parseInt(commentData.parent_id);
      }

      const { data, error } = await this.client
        .from(TABLE_NAMES.guestbook)
        .insert([comment])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('添加留言失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新点赞数（更稳健，避免 single() 在未命中时触发 PGRST116）
  async updateLikes(commentId, likes) {
    if (!this.client) throw new Error('Supabase 客户端未初始化');
    if (commentId === undefined || commentId === null) {
      console.warn('updateLikes: commentId 缺失');
      return { error: { message: 'commentId 缺失' } };
    }

    // bigInt/ bigint 在前端用 Number 处理（PostgREST URL 会以数字形式匹配）
    const idNum = Number(commentId);
    if (Number.isNaN(idNum)) {
      console.warn('updateLikes: 无效的 commentId', commentId);
      return { error: { message: '无效的 commentId' } };
    }

    const likesInt = Number(likes) || 0;

    try {
      const { data, error, status } = await this.client
        .from(TABLE_NAMES.guestbook)
        .update({ likes: likesInt })
        .eq('id', idNum)
        .select()
        .maybeSingle();

      if (error) {
        console.error('更新点赞失败:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          status
        });
        return { error, status };
      }

      if (!data) {
        console.warn('更新点赞未命中任何记录，可能 id 值不存在', { idNum });
        return { error: { message: '未找到要更新的留言' }, status };
      }

      return { data };
    } catch (err) {
      console.error('更新点赞异常:', err);
      return { error: err };
    }
  }

  // 删除留言：前端先做权限判断，避免无意义请求
  async deleteComment(commentId) {
    if (!this.client) throw new Error('Supabase 客户端未初始化');
    if (!this.isAdmin) {
      console.warn('权限不足：只有管理员可删除留言');
      return { error: { message: '权限不足' } };
    }
    const idNum = Number(commentId);
    if (Number.isNaN(idNum)) {
      console.warn('deleteComment: 无效的 commentId', commentId);
      return { error: { message: '无效的 commentId' } };
    }
    try {
      const { data, error, status } = await this.client
        .from(TABLE_NAMES.guestbook)
        .delete()
        .eq('id', idNum)
        .select();

      if (error) {
        console.error('deleteComment 请求失败:', { message: error.message, details: error.details, status });
        return { error, status };
      }

      if (!data || data.length === 0) {
        console.warn('deleteComment: 未删除任何记录，id 可能不存在', { idNum });
        return { error: { message: '未找到要删除的留言' }, status };
      }

      return { data };
    } catch (err) {
      console.error('deleteComment 异常:', err);
      return { error: err };
    }
  }

  // 更新留言（示例：更新字段 obj）
  async updateComment(commentId, patchObj) {
    if (!this.client) throw new Error('Supabase 客户端未初始化');
    if (!this.isAdmin) {
      console.warn('权限不足：只有管理员可更新留言');
      return { error: { message: '权限不足' } };
    }
    const idNum = Number(commentId);
    if (Number.isNaN(idNum)) {
      console.warn('updateComment: 无效的 commentId', commentId);
      return { error: { message: '无效的 commentId' } };
    }
    try {
      const { data, error, status } = await this.client
        .from(TABLE_NAMES.guestbook)
        .update(patchObj)
        .eq('id', idNum)
        .select()
        .maybeSingle();

      if (error) {
        console.error('updateComment 请求失败:', { message: error.message, details: error.details, status });
        return { error, status };
      }

      if (!data) {
        console.warn('updateComment: 未命中任何记录，id 可能不存在', { idNum });
        return { error: { message: '未找到要更新的留言' }, status };
      }

      return { data };
    } catch (err) {
      console.error('updateComment 异常:', err);
      return { error: err };
    }
  }

  // 获取统计数据
  async getStats() {
    try {
      // 获取总留言数
      const { count: totalComments, error: countError } = await this.client
        .from(TABLE_NAMES.guestbook)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // 获取今日留言数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayComments, error: todayError } = await this.client
        .from(TABLE_NAMES.guestbook)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // 获取管理员留言数
      const { count: adminComments, error: adminError } = await this.client
        .from(TABLE_NAMES.guestbook)
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      if (adminError) throw adminError;

      return {
        success: true,
        data: {
          totalComments: totalComments || 0,
          todayComments: todayComments || 0,
          adminComments: adminComments || 0
        }
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取项目列表
  async getProjects(limit = 100, offset = 0) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.projects)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取项目失败:', err);
      return { success: false, error: err.message };
    }
  }

  async addProject(payload) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.projects)
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('添加项目失败:', err);
      return { success: false, error: err.message };
    }
  }

  async updateProject(id, patch) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.projects)
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', Number(id))
        .select()
        .maybeSingle();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('更新项目失败:', err);
      return { success: false, error: err.message };
    }
  }

  async deleteProject(id) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.projects)
        .delete()
        .eq('id', Number(id))
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('删除项目失败:', err);
      return { success: false, error: err.message };
    }
  }

  // Articles CRUD
  async getArticles(limit = 100, offset = 0) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.articles)
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('获取文章失败:', err);
      return { success: false, error: err.message };
    }
  }

  async addArticle(payload) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.articles)
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('添加文章失败:', err);
      return { success: false, error: err.message };
    }
  }

  async updateArticle(id, patch) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.articles)
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', Number(id))
        .select()
        .maybeSingle();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('更新文章失败:', err);
      return { success: false, error: err.message };
    }
  }

  async deleteArticle(id) {
    try {
      const { data, error } = await this.client
        .from(TABLE_NAMES.articles)
        .delete()
        .eq('id', Number(id))
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('删除文章失败:', err);
      return { success: false, error: err.message };
    }
  }
}

// 创建单例并导出
let supabaseInstance = null;
function getSupabaseService() {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseService();
  }
  return supabaseInstance;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseService, getSupabaseService };
} else {
  window.SupabaseService = SupabaseService;
  window.getSupabaseService = getSupabaseService;
}