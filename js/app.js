console.log('app.js loaded successfully');

// タスク管理クラス
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentEditId = null;
        
        // DOM要素の取得
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.editModal = document.getElementById('editModal');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.saveEditBtn = document.getElementById('saveEditBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        
        // イベントリスナーの設定
        this.initializeEventListeners();
        
        // 初期表示
        this.renderTasks();
    }
    
    // ローカルストレージからタスクを読み込む
    loadTasks() {
        const savedTasks = localStorage.getItem('todoTasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    }
    
    // タスクをローカルストレージに保存
    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }
    
    // イベントリスナーの初期化
    initializeEventListeners() {
        // タスク追加
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // フィルターボタン
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // モーダル操作
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        
        // モーダル外をクリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
    }
    
    // 新しいタスクを追加
    addTask() {
        const title = this.taskInput.value.trim();
        if (!title) return;
        
        const newTask = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks.unshift(newTask);
        this.saveTasks();
        this.taskInput.value = '';
        this.renderTasks();
        this.showNotification('タスクを追加しました');
    }
    
    // タスクの完了状態を切り替え
    toggleTaskStatus(taskId) {
        this.tasks = this.tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    completed: !task.completed,
                    updatedAt: new Date().toISOString()
                };
            }
            return task;
        });
        
        this.saveTasks();
        this.renderTasks();
    }
    
    // タスク編集モーダルを開く
    openEditModal(task) {
        this.currentEditId = task.id;
        this.editTaskInput.value = task.title;
        this.editModal.style.display = 'flex';
        this.editTaskInput.focus();
    }
    
    // タスク編集を保存
    saveEdit() {
        const newTitle = this.editTaskInput.value.trim();
        if (!newTitle) return;
        
        this.tasks = this.tasks.map(task => {
            if (task.id === this.currentEditId) {
                return {
                    ...task,
                    title: newTitle,
                    updatedAt: new Date().toISOString()
                };
            }
            return task;
        });
        
        this.saveTasks();
        this.closeEditModal();
        this.renderTasks();
        this.showNotification('タスクを更新しました');
    }
    
    // 編集モーダルを閉じる
    closeEditModal() {
        this.editModal.style.display = 'none';
        this.currentEditId = null;
    }
    
    // タスクを削除
    deleteTask(taskId) {
        if (!confirm('このタスクを削除してもよろしいですか？')) return;
        
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.showNotification('タスクを削除しました');
    }
    
    // フィルターを設定
    setFilter(filter) {
        this.currentFilter = filter;
        this.renderTasks();
        
        // アクティブなフィルターボタンのスタイルを更新
        this.filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
    }
    
    // タスクをフィルタリング
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return [...this.tasks];
        }
    }
    
    // タスクを描画
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = `
                <li class="no-tasks">
                    ${this.currentFilter === 'all' ? 'タスクがありません' : 
                      this.currentFilter === 'active' ? '未完了のタスクはありません' : 
                      '完了したタスクはありません'}
                </li>
            `;
            return;
        }
        
        this.taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${this.escapeHtml(task.title)}</span>
                <div class="task-actions">
                    <button class="edit-btn" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `).join('');
        
        // チェックボックスのイベントリスナー
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            const taskId = checkbox.closest('.task-item').dataset.id;
            checkbox.addEventListener('change', () => this.toggleTaskStatus(taskId));
        });
        
        // 編集ボタンのイベントリスナー
        document.querySelectorAll('.edit-btn').forEach(button => {
            const taskId = button.closest('.task-item').dataset.id;
            const task = this.tasks.find(t => t.id === taskId);
            button.addEventListener('click', () => this.openEditModal(task));
        });
        
        // 削除ボタンのイベントリスナー
        document.querySelectorAll('.delete-btn').forEach(button => {
            const taskId = button.closest('.task-item').dataset.id;
            button.addEventListener('click', () => this.deleteTask(taskId));
        });
    }
    
    // 通知を表示
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // スタイルを適用
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
        });
        
        document.body.appendChild(notification);
        
        // 表示アニメーション
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 3秒後にフェードアウトして削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // HTMLエスケープ
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
});
