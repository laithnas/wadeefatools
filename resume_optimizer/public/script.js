const modal = document.getElementById('modal');
const openBtn = document.getElementById('openModal');
const closeBtn = document.getElementById('closeModal');
const form = document.getElementById('optForm');
const resultDiv = document.getElementById('result');
const beforeEl = document.getElementById('beforeScore');
const afterEl = document.getElementById('afterScore');
const missingEl = document.getElementById('missing');
const downloadLink = document.getElementById('downloadLink');

openBtn.onclick = () => (modal.style.display = 'block');
closeBtn.onclick = () => (modal.style.display = 'none');
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = 'none';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const res = await fetch('/optimize', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    alert('Error optimizing resume');
    return;
  }
  const data = await res.json();
  beforeEl.textContent = data.beforeScore;
  afterEl.textContent = data.afterScore;
  missingEl.textContent = data.missing.join(', ');
  const params = new URLSearchParams({
    text: data.optimizedText,
    missing: data.missing.join(',')
  });
  downloadLink.href = '/download?' + params.toString();
  resultDiv.classList.remove('hidden');
});
