
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
   imageURL:null,
   code: null
 },
 { title: 'Plunk!',
   description: 'Jam with other people in real-time',
   url: 'https://skyfox93-plunk.glitch.me/',
   videoURL:null,
   imageURUL: null,
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
         class='menu-link video'> Video </div>}`: ''}
        ${project.url ? `<a href="${project.url}"
        class='menu-link'> Website </a>` : ''}

        ${project.code ? `<a href='${project.code}' class='menu-link'> Code </a>` :'' }
    </div>
  </div>
  `
}

function projectReducer(htmlString, project){
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
    document.body.scrollTop=videoContainer.offsetTop-60;
    console.log(videoContainer.offsetTop)

}
}

function stopPropagation(e){
  e.stopPropagation()
}
let banner=document.querySelector('.title-banner');
console.log(banner);
let title=document.querySelector('.title');
let main=document.querySelector('.main')
let desc=document.querySelector('.description')
window.onscroll = function(e) {
  console.log(vidPlay) //true
  if(banner.offsetHeight>60 &&(!vidPlay)){
    if(vidPlay){return}
    console.log('executing') // executes
   let diff=banner.offsetHeight-document.body.scrollTop
    if(diff<60){diff=60}
    //banner.className='title-banner-fixed'
    banner.style.height=diff+'px';
    let fontsize=banner.offsetHeight/10+'px'

    title.style.fontSize=fontsize>12 ? fontsize+'px': '12px';

    document.body.scrollTop=0;}
    else{banner.style.height=''; banner.className='title-banner-fixed'; desc.style.display='none';}

}

  ;
