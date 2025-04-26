document.addEventListener('DOMContentLoaded', () => {
  fetchQueue();

  document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const link = document.getElementById('song-link').value;
    if (!link) return;
    await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link })
    });
    document.getElementById('song-link').value = '';
    fetchQueue();
  });
});

async function fetchQueue() {
  const res = await fetch('/queue-data');
  const queue = await res.json();
  const container = document.getElementById('queue');
  container.innerHTML = '';
  queue.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.innerText = `${idx + 1}. ${item.link}`;
    div.draggable = true;
    div.dataset.index = idx;
    div.addEventListener('dragstart', dragStart);
    div.addEventListener('dragover', dragOver);
    div.addEventListener('drop', drop);
    container.appendChild(div);
  });
}

let draggedIndex = null;

function dragStart(e) {
  draggedIndex = e.target.dataset.index;
}

function dragOver(e) {
  e.preventDefault();
}

async function drop(e) {
  const targetIndex = e.target.dataset.index;
  if (draggedIndex === null || targetIndex === null) return;

  await fetch('/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: parseInt(draggedIndex), to: parseInt(targetIndex) })
  });

  draggedIndex = null;
  fetchQueue();
}