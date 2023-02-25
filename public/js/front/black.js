//esversion: 6
// Get a reference to your images and overlay element
const images = document.querySelectorAll('.selectable-image');
const overlay = document.getElementById('overlay');

addEventListener('beforeunload', (e) => {
  // Add code here to activate an overlay that prevents the copied content from being readable
  // For example, you could show a message that says "Content protected" and hide the content
  e.preventDefault();
  overlay.style.display = 'block'; // Activate the overlay
  overlay.style.color = '#fff';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.innerHTML = '<p>Content protected</p>';
  setTimeout(() => {
    overlay.style.display = 'none'; // Deactivate the overlay after a delay
  }, 2000);
});

// Add an event listener to each image to detect copy attempts
images.forEach((image) => {
  image.addEventListener('copy', (e) => {
    e.preventDefault(); // Prevent the copy operation
    overlay.style.display = 'block'; // Activate the overlay
    setTimeout(() => {
      overlay.style.display = 'none'; // Deactivate the overlay after a delay
    }, 1000);
  });
});
