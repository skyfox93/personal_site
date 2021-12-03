
// define elements
let title = document.querySelector('.title-banner-main');
let nav = document.querySelector('.nav')
let onScroll = function (e) {
  
  if (document.body.scrollTop > 270) {
    nav.style.backgroundImage = "url('./images/banner.jpg')"

  } else {
    nav.style.backgroundImage = 'none'
  }
  if (document.body.scrollTop > 100) {
    title.style.display = 'none'
  } else if (title.style.display ==='none') {
    title.style.display = 'flex';
  }
}

document.addEventListener('scroll', onScroll)

window.onresize = function (e) {
  if (window.innerWidth < 900 && banner.offsetHeight < 90) {
    // in this case, the title won't fit, so hide it
    title.style.display = 'none'
  } else if (title.style.display !== 'block') {
    title.style.display = 'flex'
  }
}
