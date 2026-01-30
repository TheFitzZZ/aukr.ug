let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.querySelector('.carousel-slide').children;
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  
  document.querySelector('.carousel-slide').style.transform = `translateX(-${(slideIndex-1) * 100}%)`;
  
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  dots[slideIndex-1].className += " active";
}

const carousel = document.querySelector('.carousel-container');
let touchStartX = 0;
let touchEndX = 0;

carousel.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
});

carousel.addEventListener('touchmove', e => {
    touchEndX = e.touches[0].clientX;
});

carousel.addEventListener('touchend', () => {
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50; // Minimum distance for a swipe
  if (touchStartX - touchEndX > swipeThreshold) {
    // Swiped left
    plusSlides(1);
  } else if (touchEndX - touchStartX > swipeThreshold) {
    // Swiped right
    plusSlides(-1);
  }
  // Reset values
  touchStartX = 0;
  touchEndX = 0;
}