const taskInput = document.getElementById('taskInput');
const deadlineInput = document.getElementById('deadlineInput');
const taskList = document.getElementById('taskList');

function addTask() {
  const taskText = taskInput.value.trim();
  const deadline = deadlineInput.value;

  if (taskText === '') return alert('Task cannot be empty!');
  if (!deadline) return alert('Please set a deadline!');

  const li = createTaskElement(taskText, deadline);
  taskList.appendChild(li);
  taskInput.value = '';
  deadlineInput.value = '';
  saveTasks();
}

function createTaskElement(taskText, deadline) {
  const li = document.createElement('li');
  li.innerHTML = `
    <div>
      <span>${taskText}</span>
      <div class="deadline">Deadline: ${deadline}</div>
    </div>
    <button onclick="removeTask(this)">X</button>
  `;

  updateTaskStyle(li, deadline); // Применяем стили на основе дедлайна
  return li;
}

function updateTaskStyle(li, deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);

  const timeDiff = deadlineDate - now;
  const oneDay = 24 * 60 * 60 * 1000; // Миллисекунды

  if (timeDiff < 0) {
    li.style.backgroundColor = '#ffcccc'; // Просроченные задачи
  } else if (timeDiff <= oneDay) {
    li.style.backgroundColor = '#fff4cc'; // Задачи на сегодня
  } else {
    li.style.backgroundColor = '#ccffcc'; // Задачи с более дальними дедлайнами
  }
}

function removeTask(button) {
  const li = button.parentElement;
  li.style.opacity = '0';
  li.style.transform = 'translateX(-20px)';
  setTimeout(() => {
    li.remove();
    saveTasks();
  }, 300);
}

function saveTasks() {
  const tasks = Array.from(taskList.children).map((li) => {
    const taskText = li.querySelector('span').innerText;
    const deadline = li.querySelector('.deadline').innerText.replace('Deadline: ', '');
    return { taskText, deadline };
  });

  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks.forEach(({ taskText, deadline }) => {
    const li = createTaskElement(taskText, deadline);
    taskList.appendChild(li);
  });
}

function checkDeadlines() {
  const now = new Date();

  Array.from(taskList.children).forEach((li) => {
    const taskText = li.querySelector('span').innerText;
    const deadlineText = li.querySelector('.deadline').innerText.replace('Deadline: ', '');
    const deadlineDate = new Date(deadlineText);

    if (deadlineDate - now <= 0 && Notification.permission === 'granted') {
      new Notification('Task Deadline!', {
        body: `The deadline for "${taskText}" has passed!`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827951.png',
      });

      li.style.backgroundColor = '#ffcccc'; // Просроченная задача
    }
  });
}


if (Notification.permission === 'default') {
  Notification.requestPermission();
}


setInterval(checkDeadlines, 300000);
checkDeadlines();


loadTasks();
