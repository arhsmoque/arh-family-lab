// Family Hub — local-first observability log
// Events are stored locally and can be exported by the parent.
// No PII beyond member names/ids and action types; never logs PINs or tokens.
(function (window) {
  'use strict';

  const LOG_KEY = 'familyHub_audit_v1';
  const MAX_EVENTS = 500;

  function read() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function write(events) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (e) {
      console.warn('Failed to write audit log:', e);
    }
  }

  function log(type, actor, detail = {}) {
    const events = read();
    events.push({
      type,
      actor,
      detail: sanitize(detail),
      timestamp: Date.now()
    });
    write(events);
  }

  function sanitize(detail) {
    // Never allow passwords, tokens, or PINs to be logged.
    const clone = JSON.parse(JSON.stringify(detail || {}));
    const forbidden = ['password', 'pin', 'token', 'idToken', 'refreshToken'];
    for (const key of forbidden) {
      if (key in clone) delete clone[key];
    }
    return clone;
  }

  function getEvents(filterType) {
    const events = read();
    return filterType ? events.filter(e => e.type === filterType) : events;
  }

  function getInsights(days = 7) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const events = read().filter(e => e.timestamp >= since);

    const taskToggles = events.filter(e => e.type === 'task_toggled');
    const memberSelects = events.filter(e => e.type === 'member_selected');
    const pinFailures = events.filter(e => e.type === 'pin_failed');

    const taskCounts = {};
    taskToggles.forEach(e => {
      const id = e.detail.taskId;
      taskCounts[id] = (taskCounts[id] || 0) + 1;
    });
    const retoggled = Object.entries(taskCounts).filter(([, count]) => count > 2).map(([id]) => id);

    const memberCounts = {};
    memberSelects.forEach(e => {
      const id = e.detail.memberId;
      memberCounts[id] = (memberCounts[id] || 0) + 1;
    });
    const unusedMembers = Object.entries(memberCounts).filter(([, count]) => count === 0).map(([id]) => id);

    return {
      retoggledTaskIds: retoggled,
      unusedMemberIds: unusedMembers,
      pinFailureCount: pinFailures.length,
      sessionCount: new Set(events.filter(e => e.type === 'session_start').map(e => e.detail.sessionId)).size
    };
  }

  function exportJson() {
    return JSON.stringify(read(), null, 2);
  }

  function clear() {
    localStorage.removeItem(LOG_KEY);
  }

  window.FamilyHubAudit = {
    log,
    getEvents,
    getInsights,
    exportJson,
    clear
  };
})(window);
