
let projects= [
//Title, description, url, VideoURL
// title must match object key
  {
   description: "Share and edit your friend's photos",
   title:'ImageEdit',
   url:'https://spinoff.herokuapp.com',
   videoURL:"https://player.vimeo.com/video/331844687?byline=0&portrait=0",
   imageURL: './images/spinoff.png'
 },

 {
   description:'Complete a list, collect a kitten' ,
   title:'TaskKittens',
   url: null,
   videoURL:"https://player.vimeo.com/video/331912608?byline=0&portrait=0",
   imageURL:'./images/taskittens2.png',
   code: null
 },
 { title: 'Plunk!',
   description: 'Jam with other people in real-time',
   url: 'https://skyfox93-plunk.glitch.me/',
   videoURL:null,
   imageURL: './images/plunk.png',
   code: null
 }

]

const projectsContainer=document.querySelector('#projects-container')
const videoContainer=document.querySelector('#video-container');
const videoEl=document.querySelector('#video');
let vidPlay=false;
renderProjects(projects,projectsContainer)


/// helpers///////

function projectHTML(project){
  console.log(project.videoURL);
  return `
  <div class='card'>
    <div class='card-title'>${project.title}</div>
    <div class='card-image'>
      <img src='${project.imageURL}'></img>
    </div>
    <div class='card-description'> ${project.description}</div>
    <div class='card-menu'>
        ${project.videoURL ? `<div
          data-url="${project.videoURL}"
         class='menu-link video'> Video </div>`: ''}
        ${project.url ? `<a href="${project.url}"
        class='menu-link'> Website </a>` : ''}

        ${project.code ? `<a href='${project.code}' class='menu-link'> Code </a>` :'' }
    </div>
  </div>
  `
}

function projectReducer(htmlString, project){
  console.log(projectHTML(project))
    return htmlString+projectHTML(project)

}
function renderProjects(projects,container){
  let htmlString=projects.reduce(projectReducer,'')
projectsContainer.innerHTML=(htmlString)
projectsContainer.addEventListener('click', playVid)
}


function playVid(e){
  console.log(e.target)
    if(e.target.className==='menu-link video')
    {
    title.style.fontSize='12px';
    console.log(banner);
    banner.className='title-banner-fixed';
    //projectsContainer.style.display='none'
    videoEl.src=e.target.dataset.url
    videoContainer.style.display='block'
    videoEl.style.display='block'
    vidPlay=true;
    nav.className='nav-collapsed'
    spacer.className='spacer';
    document.body.scrollTop=0;
    banner.style.height='';
  }
}

function stopPropagation(e){
  e.stopPropagation()
}
let banner=document.querySelector('.title-banner');
let spacer=document.querySelector('#spacer')
console.log(banner);
let title=document.querySelector('.title');
let main=document.querySelector('.main')
let desc=document.querySelector('.description')
let nav=document.querySelector('.nav')
let hamburger=document.querySelector('#hamburger')
hamburger.addEventListener('click',toggleResponsive);
let closeNav=document.querySelector('#close-nav')
closeNav.addEventListener('click',toggleResponsive)

let lastScroll=0;

function toggleResponsive(e){
  e.preventDefault()
  console.log('responsive!')
  nav.className=(
  nav.className==='nav-responsive' ? 'nav-collapsed':'nav-responsive'
  )
}

window.onscroll = function(e) {
    if(
      banner.offsetHeight>60 &&
      (banner.className!=='title-banner-fixed')&&
      (document.body.scrollTop>=lastScroll)
      )
    {
      console.log('height adjusted')
     let diff=banner.offsetHeight-document.body.scrollTop
      if(diff<60){diff=60}
      banner.style.height=diff+'px';
      console.log('diff',diff)
      let fontsize=banner.offsetHeight/10
      title.style.fontSize=fontsize>12 ? fontsize+'px': '12px';
    }
      else {
        debugger
        banner.className='title-banner-fixed';banner.style.height=''; desc.style.display='none';
      spacer.className='spacer';
    }
    if(banner.offsetHeight<130&&banner.className!=='title-banner-fixed' && nav.className!=='nav-active'){
      nav.className='nav-collapsed'
    }
}
