// Tab switching
const tabs = document.querySelectorAll('.sidebar .menu li');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));

    // Add active
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});
