// TaskFlow - Exotic Task Manager JavaScript
// Complete functionality for the gamified productivity app

class TaskFlowApp {
    constructor() {
        this.tasks = [];
        this.user = {
            name: 'TaskFlow Master',
            level: 1,
            xp: 0,
            streak: 0,
            totalPoints: 0,
            badges: new Set(),
            mood: 'focused'
        };
        
        this.pomodoroTimer = {
            duration: 25 * 60, // 25 minutes in seconds
            remaining: 25 * 60,
            isActive: false,
            isBreak: false,
            interval: null
        };
        
        this.motivationalQuotes = [
            "Every completed task is a step towards mastery! 🚀",
            "You're building momentum - keep conquering those quests! ⚡",
            "Legendary productivity requires legendary dedication! 💎",
            "Your future self will thank you for every task completed today! 🏆",
            "Progress over perfection - you're doing amazing! 🌟",
            "Each quest completed unlocks new possibilities! 🗝️",
            "Your productivity streak is on fire! 🔥",
            "Master your tasks, master your destiny! ⭐"
        ];
        
        this.aiSuggestions = [
            "Review project documentation for clarity",
            "Organize workspace for better focus",
            "Take a 10-minute energizing break",
            "Plan tomorrow's priority tasks",
            "Celebrate today's accomplishments"
        ];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.startParticleSystem();
        this.updateUI();
        this.showMotivation();
        this.setupAISuggestions();
        this.checkDailyStreak();
        
        // Initialize mood system
        this.setMood(this.user.mood);
        
        // Show welcome message for first-time users
        if (this.tasks.length === 0) {
            setTimeout(() => {
                this.showNotification("Welcome to TaskFlow! Add your first epic quest to begin your productivity journey! 🚀", 'info');
            }, 1000);
        }
    }
    
    setupEventListeners() {
        // Task input
        const taskInput = document.getElementById('taskInput');
        const addButton = document.querySelector('.add-btn');
        
        taskInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        addButton?.addEventListener('click', () => this.addTask());
        
        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                this.setMood(mood);
            });
        });
        
        // Theme controls
        document.getElementById('focusMode')?.addEventListener('click', () => this.toggleFocusMode());
        document.getElementById('pomodoroTimer')?.addEventListener('click', () => this.togglePomodoro());
        document.getElementById('themeToggle')?.addEventListener('click', () => this.cycleTheme());
        
        // Pomodoro controls
        document.getElementById('startTimer')?.addEventListener('click', () => this.startPomodoro());
        document.getElementById('pauseTimer')?.addEventListener('click', () => this.pausePomodoro());
        document.getElementById('resetTimer')?.addEventListener('click', () => this.resetPomodoro());
        
        // Data controls
        document.querySelector('[onclick="exportTasks()"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportTasks();
        });
        
        document.querySelector('[onclick="addSampleData()"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.addSampleData();
        });
        
        document.querySelector('[onclick="clearAllTasks()"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearAllTasks();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('taskInput')?.focus();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFocusMode();
                        break;
                    case 't':
                        e.preventDefault();
                        this.togglePomodoro();
                        break;
                }
            }
        });
    }
    
    addTask() {
        const input = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const categorySelect = document.getElementById('categorySelect');
        
        const title = input?.value.trim();
        if (!title) {
            this.showNotification('Your quest needs a name, brave explorer! 📝', 'warning');
            return;
        }
        
        const priority = prioritySelect?.value || 'medium';
        const category = categorySelect?.value || 'work';
        
        const task = {
            id: this.generateId(),
            title,
            priority,
            category,
            status: 'todo',
            createdAt: new Date().toISOString(),
            completedAt: null,
            points: this.calculatePoints(priority),
            timeSpent: 0
        };
        
        this.tasks.push(task);
        this.saveData();
        this.renderTasks();
        this.updateStats();
        this.checkAchievements();
        
        // Clear input
        if (input) input.value = '';
        
        // Show success message
        const priorityEmoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🔴',
            'legendary': '💎'
        }[priority];
        
        this.showNotification(`New ${priority} quest added! ${priorityEmoji} Let's conquer it!`, 'success');
        
        // Add entrance animation
        setTimeout(() => {
            const newTaskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            newTaskElement?.classList.add('slide-in');
        }, 100);
        
        this.hideAISuggestions();
    }
    
    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const oldStatus = task.status;
        task.status = newStatus;
        
        if (newStatus === 'completed' && oldStatus !== 'completed') {
            task.completedAt = new Date().toISOString();
            this.awardXP(task.points);
            this.showTaskCompletionEffect(task);
            this.updateStreak();
            
            // Show completion notification
            const priorityEmoji = {
                'low': '🟢',
                'medium': '🟡', 
                'high': '🔴',
                'legendary': '💎'
            }[task.priority];
            
            this.showNotification(`Quest completed! +${task.points} XP ${priorityEmoji}`, 'success');
        }
        
        this.saveData();
        this.renderTasks();
        this.updateStats();
        this.checkAchievements();
    }
    
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.tasks[taskIndex];
        
        // Show confirmation for important tasks
        if (task.priority === 'legendary' || task.priority === 'high') {
            if (!confirm(`Are you sure you want to delete this ${task.priority} priority quest?`)) {
                return;
            }
        }
        
        this.tasks.splice(taskIndex, 1);
        this.saveData();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('Quest removed from your board! 🗑️', 'info');
    }
    
    editTask(taskId, newTitle) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !newTitle.trim()) return;
        
        task.title = newTitle.trim();
        this.saveData();
        this.renderTasks();
        
        this.showNotification('Quest updated successfully! ✏️', 'info');
    }
    
    renderTasks() {
        const todoList = document.getElementById('todoList');
        const progressList = document.getElementById('progressList');
        const completedList = document.getElementById('completedList');
        
        if (!todoList || !progressList || !completedList) return;
        
        // Clear existing tasks
        [todoList, progressList, completedList].forEach(list => {
            const tasks = list.querySelectorAll('.task-item');
            tasks.forEach(task => task.remove());
        });
        
        // Render tasks in appropriate columns
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch(task.status) {
                case 'todo':
                    todoList.appendChild(taskElement);
                    break;
                case 'progress':
                    progressList.appendChild(taskElement);
                    break;
                case 'completed':
                    completedList.appendChild(taskElement);
                    break;
            }
        });
        
        // Update empty states
        this.updateEmptyStates();
        this.updateColumnCounts();
    }
    
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item priority-${task.priority}`;
        div.dataset.taskId = task.id;
        
        const priorityLabels = {
            'low': '🟢 Chill Priority',
            'medium': '🟡 Standard Priority', 
            'high': '🔴 Epic Priority',
            'legendary': '💎 Legendary Priority'
        };
        
        const categoryLabels = {
            'work': '💼 Work',
            'personal': '🏠 Personal',
            'creative': '🎨 Creative',
            'health': '💪 Health',
            'learning': '📚 Learning',
            'fun': '🎮 Fun'
        };
        
        const timeAgo = this.getTimeAgo(task.createdAt);
        const isCompleted = task.status === 'completed';
        
        div.innerHTML = `
            <div class="task-header">
                <div class="task-title" ${isCompleted ? '' : 'contenteditable="true"'}>${task.title}</div>
                <div class="task-meta">
                    <span class="task-priority">${priorityLabels[task.priority] || task.priority}</span>
                    <span class="task-category">${categoryLabels[task.category] || task.category}</span>
                </div>
            </div>
            <div class="task-info">
                <span class="task-time">Created ${timeAgo}</span>
                <span class="task-points">+${task.points} XP</span>
            </div>
            <div class="task-actions">
                ${this.getTaskActions(task)}
            </div>
        `;
        
        // Add event listeners
        this.addTaskEventListeners(div, task);
        
        return div;
    }
    
    getTaskActions(task) {
        switch(task.status) {
            case 'todo':
                return `
                    <button class="action-btn primary" onclick="app.updateTaskStatus('${task.id}', 'progress')">
                        🚀 Start Quest
                    </button>
                    <button class="action-btn secondary" onclick="app.deleteTask('${task.id}')">
                        🗑️ Remove
                    </button>
                `;
            case 'progress':
                return `
                    <button class="action-btn primary" onclick="app.updateTaskStatus('${task.id}', 'completed')">
                        ✅ Complete
                    </button>
                    <button class="action-btn secondary" onclick="app.updateTaskStatus('${task.id}', 'todo')">
                        ⏸️ Pause
                    </button>
                `;
            case 'completed':
                return `
                    <button class="action-btn secondary" onclick="app.updateTaskStatus('${task.id}', 'todo')">
                        🔄 Redo
                    </button>
                    <button class="action-btn secondary" onclick="app.deleteTask('${task.id}')">
                        🗑️ Remove
                    </button>
                `;
            default:
                return '';
        }
    }
    
    addTaskEventListeners(element, task) {
        const titleElement = element.querySelector('.task-title');
        
        if (titleElement && task.status !== 'completed') {
            titleElement.addEventListener('blur', () => {
                const newTitle = titleElement.textContent.trim();
                if (newTitle !== task.title) {
                    this.editTask(task.id, newTitle);
                }
            });
            
            titleElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    titleElement.blur();
                }
            });
        }
    }
    
    updateEmptyStates() {
        const columns = [
            { list: 'todoList', status: 'todo' },
            { list: 'progressList', status: 'progress' },
            { list: 'completedList', status: 'completed' }
        ];
        
        columns.forEach(({ list, status }) => {
            const listElement = document.getElementById(list);
            const emptyState = listElement?.querySelector('.empty-state');
            const hasTasks = this.tasks.some(task => task.status === status);
            
            if (emptyState) {
                emptyState.style.display = hasTasks ? 'none' : 'flex';
            }
        });
    }
    
    updateColumnCounts() {
        const todoCount = this.tasks.filter(t => t.status === 'todo').length;
        const progressCount = this.tasks.filter(t => t.status === 'progress').length;
        const completedCount = this.tasks.filter(t => t.status === 'completed').length;
        
        const todoEl = document.getElementById('todoCount');
        const progressEl = document.getElementById('progressCount');
        const completedEl = document.getElementById('completedCount');
        
        if (todoEl) todoEl.textContent = todoCount;
        if (progressEl) progressEl.textContent = progressCount;
        if (completedEl) completedEl.textContent = completedCount;
    }
    
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = this.tasks.filter(t => t.status === 'progress').length;
        const totalPoints = this.tasks
            .filter(t => t.status === 'completed')
            .reduce((sum, task) => sum + task.points, 0);
        
        // Update DOM elements
        const elements = {
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            inProgressTasks: document.getElementById('inProgressTasks'),
            totalPoints: document.getElementById('totalPoints')
        };
        
        if (elements.totalTasks) elements.totalTasks.textContent = totalTasks;
        if (elements.completedTasks) elements.completedTasks.textContent = completedTasks;
        if (elements.inProgressTasks) elements.inProgressTasks.textContent = inProgressTasks;
        if (elements.totalPoints) elements.totalPoints.textContent = totalPoints;
        
        // Update user total points
        this.user.totalPoints = totalPoints;
        this.saveData();
    }
    
    awardXP(amount) {
        this.user.xp += amount;
        
        // Check for level up
        const xpForNextLevel = this.user.level * 100;
        if (this.user.xp >= xpForNextLevel) {
            this.levelUp();
        }
        
        this.updateXPDisplay();
        this.saveData();
    }
    
    levelUp() {
        this.user.level++;
        this.user.xp = 0; // Reset XP for next level
        
        this.showNotification(`🎉 LEVEL UP! You are now Level ${this.user.level}! 🎉`, 'legendary');
        this.showConfetti();
        this.updateLevelDisplay();
    }
    
    updateXPDisplay() {
        const xpFill = document.getElementById('xpFill');
        const xpText = document.getElementById('xpText');
        const xpForLevel = this.user.level * 100;
        const percentage = (this.user.xp / xpForLevel) * 100;
        
        if (xpFill) xpFill.style.width = `${percentage}%`;
        if (xpText) xpText.textContent = `${this.user.xp} / ${xpForLevel} XP`;
    }
    
    updateLevelDisplay() {
        const levelBadge = document.getElementById('levelBadge');
        if (levelBadge) levelBadge.textContent = `Lvl ${this.user.level}`;
    }
    
    checkAchievements() {
        const completedTasks = this.tasks.filter(t => t.status === 'completed');
        const achievements = [];
        
        // First task achievement
        if (completedTasks.length >= 1 && !this.user.badges.has('first-task')) {
            this.unlockBadge('first-task', 'First Steps - Complete your first task! 🌟');
            achievements.push('first-task');
        }
        
        // Streak achievement
        if (this.user.streak >= 3 && !this.user.badges.has('streak-3')) {
            this.unlockBadge('streak-3', 'On Fire - 3 day streak! 🔥');
            achievements.push('streak-3');
        }
        
        // Power user achievement
        const today = new Date().toDateString();
        const todayTasks = completedTasks.filter(task => 
            new Date(task.completedAt).toDateString() === today
        );
        
        if (todayTasks.length >= 10 && !this.user.badges.has('power-user')) {
            this.unlockBadge('power-user', 'Power User - 10 tasks in one day! ⚡');
            achievements.push('power-user');
        }
        
        // Legendary achievement
        const legendaryTasks = completedTasks.filter(task => task.priority === 'legendary');
        if (legendaryTasks.length >= 1 && !this.user.badges.has('legendary')) {
            this.unlockBadge('legendary', 'Legend - Complete a legendary task! 💎');
            achievements.push('legendary');
        }
        
        // Show achievement notifications
        achievements.forEach((badge, index) => {
            setTimeout(() => {
                this.showNotification(`🏆 Achievement Unlocked: ${badge}`, 'achievement');
                this.showConfetti();
            }, index * 1000);
        });
    }
    
    unlockBadge(badgeId, description) {
        this.user.badges.add(badgeId);
        
        const badgeElement = document.querySelector(`[data-badge="${badgeId}"]`);
        if (badgeElement) {
            badgeElement.classList.remove('locked');
            badgeElement.classList.add('unlocked');
            badgeElement.title = description;
        }
        
        this.saveData();
    }
    
    setMood(mood) {
        this.user.mood = mood;
        
        // Update active mood button
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mood === mood);
        });
        
        // Apply mood theme
        document.body.className = `mood-${mood}`;
        
        this.saveData();
        this.showNotification(`Mood set to ${mood}! 🎨`, 'info');
    }
    
    toggleFocusMode() {
        document.body.classList.toggle('focus-mode');
        const isActive = document.body.classList.contains('focus-mode');
        
        this.showNotification(`Focus mode ${isActive ? 'activated' : 'deactivated'}! ${isActive ? '🔕' : '🔊'}`, 'info');
    }
    
    togglePomodoro() {
        const container = document.getElementById('pomodoroContainer');
        if (container) {
            container.classList.toggle('hidden');
            const isVisible = !container.classList.contains('hidden');
            
            this.showNotification(`Pomodoro timer ${isVisible ? 'opened' : 'closed'}! ⏱️`, 'info');
        }
    }
    
    startPomodoro() {
        if (this.pomodoroTimer.isActive) return;
        
        this.pomodoroTimer.isActive = true;
        this.pomodoroTimer.interval = setInterval(() => {
            this.pomodoroTimer.remaining--;
            this.updatePomodoroDisplay();
            
            if (this.pomodoroTimer.remaining <= 0) {
                this.pomodoroComplete();
            }
        }, 1000);
        
        this.showNotification('Pomodoro started! Focus time! 🍅', 'info');
    }
    
    pausePomodoro() {
        if (!this.pomodoroTimer.isActive) return;
        
        this.pomodoroTimer.isActive = false;
        if (this.pomodoroTimer.interval) {
            clearInterval(this.pomodoroTimer.interval);
            this.pomodoroTimer.interval = null;
        }
        
        this.showNotification('Pomodoro paused! ⏸️', 'info');
    }
    
    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroTimer.remaining = this.pomodoroTimer.duration;
        this.updatePomodoroDisplay();
        
        this.showNotification('Pomodoro reset! Ready for a new session! 🔄', 'info');
    }
    
    pomodoroComplete() {
        this.pausePomodoro();
        
        if (!this.pomodoroTimer.isBreak) {
            // Work session complete
            this.awardXP(25); // Bonus XP for completing pomodoro
            this.showNotification('🍅 Pomodoro complete! Take a 5-minute break!', 'success');
            this.pomodoroTimer.duration = 5 * 60; // 5 minute break
            this.pomodoroTimer.isBreak = true;
        } else {
            // Break complete
            this.showNotification('Break time over! Ready for another productive session? 🚀', 'info');
            this.pomodoroTimer.duration = 25 * 60; // 25 minute work session
            this.pomodoroTimer.isBreak = false;
        }
        
        this.pomodoroTimer.remaining = this.pomodoroTimer.duration;
        this.updatePomodoroDisplay();
        this.showConfetti();
    }
    
    updatePomodoroDisplay() {
        const timeElement = document.getElementById('timerTime');
        const progressElement = document.getElementById('timerProgress');
        
        const minutes = Math.floor(this.pomodoroTimer.remaining / 60);
        const seconds = this.pomodoroTimer.remaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeElement) timeElement.textContent = timeString;
        
        if (progressElement) {
            const progress = ((this.pomodoroTimer.duration - this.pomodoroTimer.remaining) / this.pomodoroTimer.duration) * 283;
            progressElement.style.strokeDashoffset = 283 - progress;
        }
    }
    
    cycleTheme() {
        const themes = ['focused', 'creative', 'energetic', 'calm'];
        const currentIndex = themes.indexOf(this.user.mood);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setMood(themes[nextIndex]);
    }
    
    exportTasks() {
        const data = {
            tasks: this.tasks,
            user: this.user,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskflow-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Tasks exported successfully! 📊', 'success');
    }
    
    addSampleData() {
        if (this.tasks.length > 0) {
            if (!confirm('This will add sample tasks to your existing data. Continue?')) {
                return;
            }
        }
        
        const sampleTasks = [
            { title: 'Review quarterly project goals', priority: 'high', category: 'work' },
            { title: 'Learn new JavaScript framework', priority: 'medium', category: 'learning' },
            { title: 'Morning workout routine', priority: 'medium', category: 'health' },
            { title: 'Write creative short story', priority: 'low', category: 'creative' },
            { title: 'Plan weekend adventure', priority: 'low', category: 'fun' },
            { title: 'Master productivity system', priority: 'legendary', category: 'personal' }
        ];
        
        sampleTasks.forEach(sample => {
            const task = {
                id: this.generateId(),
                title: sample.title,
                priority: sample.priority,
                category: sample.category,
                status: 'todo',
                createdAt: new Date().toISOString(),
                completedAt: null,
                points: this.calculatePoints(sample.priority),
                timeSpent: 0
            };
            
            this.tasks.push(task);
        });
        
        this.saveData();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification('Sample quests added to your board! 🎮', 'success');
    }
    
    clearAllTasks() {
        if (!confirm('Are you sure you want to reset your entire TaskFlow universe? This cannot be undone!')) {
            return;
        }
        
        this.tasks = [];
        this.user = {
            name: this.user.name,
            level: 1,
            xp: 0,
            streak: 0,
            totalPoints: 0,
            badges: new Set(),
            mood: 'focused'
        };
        
        this.saveData();
        this.renderTasks();
        this.updateStats();
        this.updateXPDisplay();
        this.updateLevelDisplay();
        
        // Reset badge states
        document.querySelectorAll('.badge').forEach(badge => {
            badge.classList.remove('unlocked');
            badge.classList.add('locked');
        });
        
        this.showNotification('TaskFlow universe reset! Ready for a fresh start! 🧹', 'info');
    }
    
    showTaskCompletionEffect(task) {
        // Create floating points animation
        this.createFloatingPoints(task.points);
        
        // Show confetti for high priority tasks
        if (task.priority === 'high' || task.priority === 'legendary') {
            this.showConfetti();
        }
        
        // Play completion sound (if audio enabled)
        this.playCompletionSound(task.priority);
    }
    
    createFloatingPoints(points) {
        const pointsElement = document.createElement('div');
        pointsElement.textContent = `+${points} XP`;
        pointsElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            color: var(--gold-amber);
            font-weight: 800;
            font-size: 2rem;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            animation: floatUp 2s ease-out forwards;
        `;
        
        document.body.appendChild(pointsElement);
        
        setTimeout(() => {
            pointsElement.remove();
        }, 2000);
    }
    
    showConfetti() {
        const overlay = document.getElementById('confettiOverlay');
        if (!overlay) return;
        
        const colors = ['#C1121F', '#D4AF37', '#0B3D91', '#046307', '#3A0CA3'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            overlay.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
    }
    
    playCompletionSound(priority) {
        // Web Audio API implementation would go here
        // For now, we'll use the notification API as a fallback
        if ('Notification' in window && Notification.permission === 'granted') {
            const priorityEmoji = {
                'low': '🟢',
                'medium': '🟡',
                'high': '🔴', 
                'legendary': '💎'
            }[priority];
            
            new Notification(`TaskFlow: Quest Complete! ${priorityEmoji}`, {
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    }
    
    startParticleSystem() {
        const particleSystem = document.getElementById('particleSystem');
        if (!particleSystem) return;
        
        setInterval(() => {
            if (document.body.classList.contains('focus-mode')) return;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            
            particleSystem.appendChild(particle);
            
            setTimeout(() => particle.remove(), 15000);
        }, 3000);
    }
    
    setupAISuggestions() {
        const input = document.getElementById('taskInput');
        const suggestionsContainer = document.getElementById('aiSuggestions');
        
        if (!input || !suggestionsContainer) return;
        
        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            
            if (value.length > 2) {
                const filteredSuggestions = this.aiSuggestions.filter(suggestion =>
                    suggestion.toLowerCase().includes(value)
                );
                
                if (filteredSuggestions.length > 0) {
                    this.showAISuggestions(filteredSuggestions);
                } else {
                    this.hideAISuggestions();
                }
            } else {
                this.hideAISuggestions();
            }
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => this.hideAISuggestions(), 200);
        });
    }
    
    showAISuggestions(suggestions) {
        const container = document.getElementById('aiSuggestions');
        if (!container) return;
        
        container.innerHTML = '';
        suggestions.slice(0, 3).forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                document.getElementById('taskInput').value = suggestion;
                this.hideAISuggestions();
            });
            container.appendChild(div);
        });
        
        container.classList.add('show');
    }
    
    hideAISuggestions() {
        const container = document.getElementById('aiSuggestions');
        if (container) {
            container.classList.remove('show');
        }
    }
    
    showMotivation() {
        const widget = document.getElementById('motivationWidget');
        const textElement = document.getElementById('motivationText');
        
        if (!widget || !textElement) return;
        
        const showRandomMotivation = () => {
            const randomQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
            textElement.textContent = randomQuote;
            widget.classList.add('show');
            
            setTimeout(() => {
                widget.classList.remove('show');
            }, 4000);
        };
        
        // Show initial motivation after delay
        setTimeout(showRandomMotivation, 3000);
        
        // Show motivation periodically
        setInterval(showRandomMotivation, 300000); // Every 5 minutes
    }
    
    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActivity = localStorage.getItem('taskflow_last_activity');
        
        if (lastActivity) {
            const lastDate = new Date(lastActivity);
            const daysDiff = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // Consecutive day - maintain or increment streak
                const completedToday = this.tasks.filter(task => 
                    task.status === 'completed' && 
                    new Date(task.completedAt).toDateString() === today
                ).length;
                
                if (completedToday > 0) {
                    this.user.streak++;
                    this.saveData();
                }
            } else if (daysDiff > 1) {
                // Streak broken
                this.user.streak = 0;
                this.saveData();
            }
        }
        
        this.updateStreakDisplay();
    }
    
    updateStreak() {
        const today = new Date().toDateString();
        const todayTasks = this.tasks.filter(task => 
            task.status === 'completed' && 
            new Date(task.completedAt).toDateString() === today
        );
        
        if (todayTasks.length === 1) {
            // First task completed today
            this.user.streak++;
            localStorage.setItem('taskflow_last_activity', new Date().toISOString());
            this.saveData();
            this.updateStreakDisplay();
            
            if (this.user.streak > 1) {
                this.showNotification(`Streak maintained! ${this.user.streak} days strong! 🔥`, 'success');
            }
        }
    }
    
    updateStreakDisplay() {
        const streakElement = document.getElementById('streakNumber');
        if (streakElement) {
            streakElement.textContent = this.user.streak;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    calculatePoints(priority) {
        const pointsMap = {
            'low': 10,
            'medium': 20,
            'high': 35,
            'legendary': 50
        };
        return pointsMap[priority] || 20;
    }
    
    getTimeAgo(dateString) {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays === 1) return 'yesterday';
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return past.toLocaleDateString();
    }
    
    saveData() {
        const data = {
            tasks: this.tasks,
            user: {
                ...this.user,
                badges: Array.from(this.user.badges) // Convert Set to Array for storage
            }
        };
        
        localStorage.setItem('taskflow_data', JSON.stringify(data));
    }
    
    loadData() {
        const data = localStorage.getItem('taskflow_data');
        
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.tasks = parsed.tasks || [];
                
                if (parsed.user) {
                    this.user = {
                        ...this.user,
                        ...parsed.user,
                        badges: new Set(parsed.user.badges || []) // Convert Array back to Set
                    };
                }
            } catch (error) {
                console.error('Error loading saved data:', error);
                this.showNotification('Error loading saved data. Starting fresh!', 'warning');
            }
        }
    }
    
    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.updateXPDisplay();
        this.updateLevelDisplay();
        this.updateStreakDisplay();
        
        // Update user name
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.user.name) {
            userNameElement.textContent = this.user.name;
        }
        
        // Update unlocked badges
        this.user.badges.forEach(badgeId => {
            const badgeElement = document.querySelector(`[data-badge="${badgeId}"]`);
            if (badgeElement) {
                badgeElement.classList.remove('locked');
                badgeElement.classList.add('unlocked');
            }
        });
    }
}

// Initialize the app
let app;

function initializeApp() {
    app = new TaskFlowApp();
}

// Global functions for HTML onclick handlers (legacy support)
function addTask() {
    if (app) app.addTask();
}

function exportTasks() {
    if (app) app.exportTasks();
}

function addSampleData() {
    if (app) app.addSampleData();
}

function clearAllTasks() {
    if (app) app.clearAllTasks();
}

// Add CSS animations that aren't in the stylesheet
const additionalStyles = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -150px) scale(1.2);
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
    
    .task-item.completing {
        animation: pulse 0.3s ease-in-out;
    }
    
    .notification {
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .badge.unlocking {
        animation: badgeUnlock 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes badgeUnlock {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2) rotate(10deg);
        }
        100% {
            transform: scale(1) rotate(0deg);
        }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Keyboard shortcuts help
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        const shortcuts = `
TaskFlow Keyboard Shortcuts:

Ctrl/Cmd + N: Focus task input
Ctrl/Cmd + F: Toggle focus mode
Ctrl/Cmd + T: Toggle pomodoro timer
Shift + ?: Show this help
        `;
        alert(shortcuts);
    }
});

// Auto-save functionality
let autoSaveInterval;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Save data when tab becomes hidden
        if (app) app.saveData();
    }
});

// Prevent data loss on page unload
window.addEventListener('beforeunload', () => {
    if (app) app.saveData();
});

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}