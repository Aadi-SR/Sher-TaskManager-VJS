const STORAGE_KEY = 'task-ledger-tasks';
const THEME_KEY = 'task-ledger-theme';


const form = document.getElementById('add-form');
const titleInput = document.getElementById('title-input');

const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const dateInput = document.getElementById('date-input');
const taskList = document.getElementById('task-list');
const statusTabs = document.getElementById('status-tabs');
const categoryFilter = document.getElementById('category-filter');
const listFooter = document.getElementById('list-footer');
const themeToggle = document.getElementById('theme-toggle');



// ---------- Storage ----------
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load tasks', e);
    return [];
  }
}


let tasks = loadTasks();


function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}


// ========= tHEME ============


themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});



function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, theme);
}



function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem(THEME_KEY) || (prefersDark ? 'dark' : 'light');

  setTheme(saved);
}



// ========== Rendering =====================

function categoryLabel(cat) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0]; // e.g. "14:32:07"
  const d = new Date(dateStr + 'T' + timeStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // toLocaleDateString converts the date to a frienly format from YYYY-MM-DD to MMM DD
  // Example: 2026-08-18 to Aug 18
  // First parameter is for locality, undefined means use the user's default locale
}


let statusFilter = 'all';
let categoryFilterValue = 'all';


function getFilteredTasks() {
  return tasks.filter(t => {
    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !t.completed) ||
      (statusFilter === 'completed' && t.completed);
    const categoryOk = categoryFilterValue === 'all' || t.category === categoryFilterValue;
    return statusOk && categoryOk;
  });
}


function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="glyph">—</div><p>NOTHING LOGGED HERE</p>`;
    taskList.appendChild(empty);
  } else {
    filtered.forEach(task => taskList.appendChild(buildCard(task)));
  }

  const activeCount = tasks.filter(t => !t.completed).length;
  listFooter.textContent = `${activeCount} ITEM${activeCount === 1 ? '' : 'S'} LEFT · ${tasks.length} TOTAL`;

  saveTasks();
}


// The bulidCard is called by render, render is called in every action where task is added or deleted or completed.

function buildCard(task) {
  const li = document.createElement('li');
  li.className = 'task-card';
  li.dataset.id = task.id;
  li.dataset.status = task.completed ? 'completed' : 'active';
  li.dataset.category = task.category;

  const priorityClass = task.priority === 'high' ? 'high' : '';

  li.innerHTML = `
    <input type="checkbox" class="complete-btn" ${task.completed ? 'checked' : ''} title="Mark complete" aria-label="Mark task complete">
    <div class="task-body">
      <span class="task-title">${escapeHtml(task.title)}</span>
      <div class="task-meta">
        <span class="task-badge">${categoryLabel(task.category)}</span>
        <span class="task-priority ${priorityClass}">${task.priority}</span>
        ${task.dueDate ? `<span class="task-due">DUE ${formatDate(task.dueDate)}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="edit-btn" title="Edit task" aria-label="Edit task">✏️</button>
      <button class="delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
    </div>
    <span class="ticket-id">#${String(task.id).slice(-6)}</span>
  `;
  return li;
}







// ====== Event listeners =============

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  addTask(title, categorySelect.value, prioritySelect.value, dateInput.value);
  titleInput.value = '';
  dateInput.value = '';
  titleInput.focus();
});