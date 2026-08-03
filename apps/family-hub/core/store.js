// Family Hub Local-First Store Engine
(function (window) {
  'use strict';

  const STORAGE_KEY = 'familyHub_state_v1';

  class Store {
    constructor() {
      this.listeners = [];
      this.state = this.loadState();
    }

    loadState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with window.FamilyHubConfig defaults
          return { ...window.FamilyHubConfig, ...parsed };
        }
      } catch (e) {
        console.warn('Failed to load state from localStorage:', e);
      }
      return { ...window.FamilyHubConfig };
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.emit('change', this.state);
      } catch (e) {
        console.error('Failed to save state to localStorage:', e);
      }
    }

    getState() {
      return this.state;
    }

    // Task Actions
    toggleTask(taskId) {
      const task = this.state.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        this.saveState();
        return task;
      }
      return null;
    }

    addTask(task) {
      const newTask = {
        id: 't_' + Date.now(),
        completed: false,
        priority: 'medium',
        ...task
      };
      this.state.tasks.push(newTask);
      this.saveState();
      return newTask;
    }

    // Checklist Actions
    toggleChecklistItem(checklistId, itemId) {
      const checklist = this.state.checklists.find(c => c.id === checklistId);
      if (checklist) {
        const item = checklist.items.find(i => i.id === itemId);
        if (item) {
          item.checked = !item.checked;
          this.saveState();
          return item;
        }
      }
      return null;
    }

    // Theme Actions
    setTheme(themeId) {
      if (this.state.themes && this.state.themes[themeId]) {
        this.state.household.activeTheme = themeId;
        this.saveState();
        this.emit('themeChange', themeId);
      }
    }

    // Member Actions
    addMember(member) {
      const newMember = {
        id: 'm_' + Date.now(),
        role: 'child',
        avatar: '👤',
        color: '#2563EB',
        ...member
      };
      this.state.members.push(newMember);
      this.saveState();
      return newMember;
    }

    // Event Bus
    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    emit(event, data) {
      this.listeners.forEach(fn => fn(event, data));
    }
  }

  window.FamilyHubStore = new Store();
})(window);
