//CAROUSEL SETTINGS
var $TagsCarousel = jQuery('.carouselOfTags').flickity({
  /* options, defaults listed */

  accessibility: false,
  /* enable keyboard navigation, pressing left & right keys */

  autoPlay: false,
  pauseAutoPlayOnHover: false,
  /* advances to the next cell
    if true, default is 3 seconds
    or set time between advances in milliseconds
    i.e. `autoPlay: 1000` will advance every 1 second */

  cellAlign: 'left',
  /* alignment of cells, 'center', 'left', or 'right'
    or a decimal 0-1, 0 is beginning (left) of container, 1 is end (right) */

  // cellSelector: '.topic-switcher__item',
  /* specify selector for cell elements */

  contain: true,
  /* will contain cells to container
    so no excess scroll at beginning or end
    has no effect if wrapAround is enabled */

  draggable: true,
  /* enables dragging & flickin
    freeScroll: false,
    enables content to be freely scrolled and flicked
    without aligning cells */

  friction: 0.2,
  /* smaller number = easier to flick farther */

  initialIndex: 0,
  /* zero-based index of the initial selected cell */

  lazyLoad: false,
  /* enable lazy-loading Tags
    set to number to load Tags adjacent cells */

  percentPosition: true,
  /* sets positioning in percent values, rather than pixels
    Enable if items have percent widths
    Disable if items have pixel widths, like Tags */

  prevNextButtons: false,
  /* creates and enables buttons to click to previous & next cells */

  pageDots: false,
  /* create and enable page dots */

  resize: true,
  /* listens to window resize events to adjust size & positions */

  rightToLeft: false,
  /* enables right-to-left layout */

  setGallerySize: true,
  /* sets the height of gallery
    disable if gallery already has height set with CSS */

  watchCSS: false,
  /* watches the content of :after of the element
    activates if #element:after { content: 'flickity' }
    IE8 and Android 2.3 do not support watching :after
    set watch: 'fallbackOn' to enable for these browsers */

  wrapAround: false,
  /* at end of cells, wraps-around to first for infinite scrolling */
});

function resizeCells() {
  var flkty = $TagsCarousel.data('flickity');
  var $current = flkty.selectedIndex;
  var $length = flkty.cells.length;
  var $tagNumLimit = $('.carouselTag').length;
  if ($length < $tagNumLimit) {
    $TagsCarousel.flickity('destroy');
  }
  jQuery('.carouselOfTags .carouselTag').removeClass('nextToSelectedLeft');
  jQuery('.carouselOfTags .carouselTag').removeClass('nextToSelectedRight');
  jQuery('.carouselOfTags .carouselTag').removeClass('nextToSelectedLeft2');
  jQuery('.carouselOfTags .carouselTag').removeClass('nextToSelectedRight2');

  jQuery('.carouselOfTags .carouselTag')
    .eq($current - 1)
    .addClass('nextToSelectedLeft');

  jQuery('.carouselOfTags .carouselTag')
    .eq($current - 2)
    .addClass('nextToSelectedLeft2');

  var $endCell;

  if ($current + 1 == $length) {
    $endCell = '0';
  } else {
    $endCell = $current + 1;
  }

  jQuery('.carouselOfTags .carouselTag')
    .eq($endCell)
    .addClass('nextToSelectedRight');

  if ($endCell + 1 < $tagNumLimit) {
    jQuery('.carouselOfTags .carouselTag')
      .eq($endCell + 1)
      .addClass('nextToSelectedRight2');
  } else {
    jQuery('.carouselOfTags .carouselTag')
      .eq(0)
      .addClass('nextToSelectedRight2');
  }
}
resizeCells();

$TagsCarousel.on('scroll.flickity', function () {
  resizeCells();
});

//HOVER FUNCTIONS
$('.carouselTag').bind('mouseover', function () {
  if (this.className === 'carouselTag nextToSelectedLeft') {
    $TagsCarousel.flickity('playLeftSlowPlayer');
  } else if (this.className === 'carouselTag nextToSelectedLeft2') {
    $TagsCarousel.flickity('playLeftFastPlayer');
  } else if (this.className === 'carouselTag nextToSelectedRight') {
    $TagsCarousel.flickity('playRightSlowPlayer');
  } else if (this.className === 'carouselTag nextToSelectedRight2') {
    $TagsCarousel.flickity('playRightFastPlayer');
  }
});

$('.carouselTag').bind('mouseout', function () {
  $TagsCarousel.flickity('pausePlayer');
});
