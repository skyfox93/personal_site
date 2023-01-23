import './Projects.js'

particlesJS.load("projects", "./particles.json", function () {
  console.log("callback - particles.js config loaded");
});

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
