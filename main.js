import './Projects.js'

const projectsContainer = document.querySelector('#projects-container')
projectsContainer.addEventListener('click', playVid)

//VIDEO PLAYING LOGIC ///
function playVid(e) {
  if (e.target.className === 'menu-link video') {
    videoEl.src = e.target.dataset.url
    videoContainer.style.display = 'block'
    videoEl.style.display = 'block'
    vidPlay = true;
    videoEl.scrollIntoView();
  }
}
const videoContainer = document.querySelector('#video-container');
const videoEl = document.querySelector('#video');
let vidPlay = false;

document.querySelector('#video-close').addEventListener(
  'click', (e) => { videoContainer.style.display = "none" }
)

//* Opacity Scroll Effect */
const bannerContent = document.querySelector('.title-banner-main')
const handleOpacityEffect = (e) => {

  let opacity = 1 - document.body.scrollTop / 200
  bannerContent.style.opacity = opacity
}

document.addEventListener('scroll', handleOpacityEffect)
