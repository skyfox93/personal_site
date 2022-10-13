
let projects = [
  //Title, description, url, VideoURL
  // title must match object key
  {
    description: "Share and edit your friend's photos",
    title: 'Spinoff',
    url: 'http://174.138.58.32/spinoff/',
    videoURL: "https://player.vimeo.com/video/331844687?byline=0&portrait=0",
    imageURL: './images/spinoff.png',
    code: "https://github.com/skyfox93/spinoff-front",
    tech: ['Ruby on Rails', 'React', 'Javascript']
  },

  //  {
  //    description:'Complete a list, collect a kitten' ,
  //    title:'TaskKittens',
  //    url: null,
  //    videoURL:"https://player.vimeo.com/video/331912608?byline=0&portrait=0",
  //    imageURL:'./images/taskittens2.png',
  //    code:  "https://github.com/skyfox93/taskKittens-front",
  //    tech: 'Ruby on Rails, Javascript'
  //  },
  {
    title: 'Plunk!',
    description: 'Jam with other people in real-time',
    url: 'https://skyfox93-plunk.glitch.me/',
    videoURL: "https://player.vimeo.com/video/332441007?portrait=0",
    imageURL: './images/plunk.png',
    code: "https://github.com/skyfox93/plunk",
    tech: ['NodeJS', "Socket.io", 'Javascript']
  }
]

const projectsContainer = document.querySelector('#projects-container')
const videoContainer = document.querySelector('#video-container');
const videoEl = document.querySelector('#video');
let vidPlay = false;
renderProjects(projects, projectsContainer)


/// helpers///////

function projectHTML(project) {
  console.log(project.videoURL);
  return `
  <div class='card'>
    <div class='card-title'>
      ${project.title}
    </div>
    <div class='card-image' style='background-image:url(${project.imageURL})'>
    </div>
    <div class='card-description'>
      ${project.description}
    </div>
    <div class='built-with'> Built with: ${project.tech.map(
    (t) => (`<span class="tech-keyword">${t}</span>`)
  ).join('')}
    </div>
    <div class='card-menu'>
      ${project.videoURL ?
      `<div data-url="${project.videoURL}" class='menu-link video'> Video </div>`
      : ''}
      ${project.url ?
      `<a href="${project.url}" class='menu-link'>Demo </a>`
      : ''}
      ${project.code ?
      `<a href='${project.code}' class='menu-link'> Repo </a>` :
      ''}
    </div>
  </div>
  `
}

function projectReducer(htmlString, project) {
  console.log(projectHTML(project))
  return htmlString + projectHTML(project)

}
function renderProjects(projects, container) {
  let htmlString = projects.reduce(projectReducer, '')
  projectsContainer.innerHTML = (htmlString)
  projectsContainer.addEventListener('click', playVid)
}


function playVid(e) {
  console.log(e.target)
  if (e.target.className === 'menu-link video') {
    videoEl.src = e.target.dataset.url
    videoContainer.style.display = 'block'
    videoEl.style.display = 'block'
    vidPlay = true;
    videoEl.scrollIntoView();
  }
}

let banner = document.querySelector('.title-banner');
let spacer = document.querySelector('#spacer')
console.log(banner);
let title = document.querySelector('.title');
let main = document.querySelector('.main')
let desc1 = document.querySelectorAll('.description')[0]
let desc2 = document.querySelectorAll('.description')[1]
let nav = document.querySelector('.nav')
let hamburger = document.querySelector('#hamburger')
hamburger.addEventListener('click', toggleResponsive);
let closeNav = document.querySelector('#close-nav')
closeNav.addEventListener('click', toggleResponsive)

let lastScroll = 0;

function toggleResponsive(e) {
  e.preventDefault()
  console.log('responsive!')
  nav.className = (
    nav.className === 'nav-responsive' ? 'nav-collapsed' : 'nav-responsive'
  )
}

document.querySelector('#video-close').addEventListener(
  'click', (e) => { videoContainer.style.display = "none" }
)


const bannerContent = document.querySelector('.title-banner-main')


const handleTextResize = (e) => {

  let fontsize = 32 - document.body.scrollTop / 10
  console.log(fontsize)
  let opacity = 1 - document.body.scrollTop / 200
  bannerContent.style.opacity = opacity
  if (fontsize < 12) {
    fontsize = 12
  }
  if (fontsize > 32) {
    fontsize = 32
  }
  title.style.fontSize = fontsize + 'px'
}
document.addEventListener('scroll', handleTextResize)
