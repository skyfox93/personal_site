

let projects= [
//Title, description, url, VideoURL
// title must match object key
  {
   description: "Share and edit your friend's photos",
   title:'Spinoff',
   url:'http://174.138.58.32/spinoff/',
   videoURL:"https://player.vimeo.com/video/331844687?byline=0&portrait=0",
   imageURL: './images/spinoff.png',
   code: "https://github.com/skyfox93/spinoff-front",
   tech: 'Ruby on Rails, React, Javascript'
 },

 {
   description:'Complete a list, collect a kitten' ,
   title:'TaskKittens',
   url: null,
   videoURL:"https://player.vimeo.com/video/331912608?byline=0&portrait=0",
   imageURL:'./images/taskittens2.png',
   code:  "https://github.com/skyfox93/taskKittens-front",
   tech: 'Ruby on Rails, Javascript'
 },
 { title: 'Plunk!',
   description: 'Jam with other people in real-time',
   url: 'https://skyfox93-plunk.glitch.me/',
   videoURL:"https://player.vimeo.com/video/332441007?portrait=0",
   imageURL: './images/plunk.png',
   code:"https://github.com/skyfox93/plunk",
   tech: 'NodeJS, Socket.io, Javascript'
 }
]


/// helpers///////

function stopPropagation(e){
  e.stopPropagation()
}
let banner=document.querySelector('.title-banner');
let spacer=document.querySelector('#spacer')
console.log(banner);
let title=document.querySelector('.title');
let main=document.querySelector('.main')
let desc1=document.querySelectorAll('.description')[0]
let desc2=document.querySelectorAll('.description')[1]
let nav=document.querySelector('.nav')
let hamburger=document.querySelector('#hamburger')
hamburger.addEventListener('click',toggleResponsive);
let closeNav=document.querySelector('#close-nav')
closeNav.addEventListener('click',toggleResponsive)

let lastScroll=0;
let mobileMode = false
function toggleResponsive(e){
  e.preventDefault()
  console.log('responsive!')
  nav.className=(
  nav.className==='nav-responsive' ? 'nav-collapsed':'nav-responsive'
  )
}

window.addEventListener('touchmove', function (event) {
    mobileMode = true
})
window.onscroll = function(e) {
    if(
      banner.offsetHeight> 90 &&
      (banner.className!=='title-banner-fixed')&&
      (document.body.scrollTop>=lastScroll)
    ){
     let diff=banner.offsetHeight-document.body.scrollTop
      banner.style.height= diff > 90 ? diff+'px' : '60px';
      let fontsize=banner.offsetHeight/12
      title.style.fontSize=fontsize>12 ? fontsize+'px': '12px';
      if (!mobileMode ) {
        document.body.scrollTop=0;
      }
    } else if (banner.offsetHeight < 350  && document.body.scrollTop == 0) {

          banner.style.height= '250px'
          let fontsize= 16
          title.style.fontSize=fontsize+'px'
          title.style.display = 'inline-block'
          banner.className='title-banner'
          desc1.style.display = 'inline-block'
          desc2.style.display='inline-block';

    } else {
      if(window.innerWidth < 900){
        title.style.display = 'none'
      }
      banner.className='title-banner-fixed'; desc1.style.display='none';
      desc2.style.display='none';
      spacer.className='spacer';
    }    
}

window.onresize = function(e){
  if(window.innerWidth < 900  && banner.offsetHeight < 90) {
    title.style.display = 'none'
  } else if(title.style.display !=='block'){
    title.style.display = 'block'
  }
}
