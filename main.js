import './Projects.js'
import Glide from './node_modules/@glidejs/glide/dist/glide.modular.esm.js'

particlesJS.load("projects", "./particles.json", function () {
  console.log("callback - particles.js config loaded");
});

const projectsContainer = document.querySelector('#projects-container')
projectsContainer.addEventListener('click', playVid)

//VIDEO PLAYING LOGIC ///

const videoContainer = document.querySelector('#video-container');
function playVid(e) {
  const videoEl = document.querySelector('#video');
  if (e.target.className === 'menu-link video') {
    videoEl.src = e.target.dataset.url
    videoContainer.style.display = 'block'
    videoEl.style.display = 'block'
    vidPlay = true;
    videoEl.scrollIntoView();
  }
}

document.querySelector('#video-close').addEventListener(
  'click', (e) => { videoContainer.style.display = "none" }
)
fetch("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/skylar-salernos-tech-blog").then(res => res.json()).then( (feed) =>{
  console.log(feed.items);
  const blogsContainer = document.querySelector('#blog-container')

  feed.items.forEach((item) => {
  let div = document.createElement('div')
  div.className='swiper-slide blog-preview'
  div.innerHTML = `
  <div  class="blog-item">
  <a href="${item.link}" ><h3> ${item.title}</h3></a>
      <div class="description">
          ${item.content}...
      </div>
  <div>
`
  div.addEventListener('click', () => {window.location.href = `${item.link}`})
  blogsContainer.appendChild(div)
  })
  const swiper = new Swiper('.swiper', {
    // Optional parameters
    direction: 'horizontal',
    loop: true,
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
    },
  
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  
    // And if we need scrollbar
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });
})
 
  

