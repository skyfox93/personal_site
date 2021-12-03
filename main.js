

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
    tech: 'Ruby on Rails, React, Javascript'
  },

  {
    description: 'Complete a list, collect a kitten',
    title: 'TaskKittens',
    url: null,
    videoURL: "https://player.vimeo.com/video/331912608?byline=0&portrait=0",
    imageURL: './images/taskittens2.png',
    code: "https://github.com/skyfox93/taskKittens-front",
    tech: 'Ruby on Rails, Javascript'
  },
  {
    title: 'Plunk!',
    description: 'Jam with other people in real-time',
    url: 'https://skyfox93-plunk.glitch.me/',
    videoURL: "https://player.vimeo.com/video/332441007?portrait=0",
    imageURL: './images/plunk.png',
    code: "https://github.com/skyfox93/plunk",
    tech: 'NodeJS, Socket.io, Javascript'
  }
]


/// helpers///////

function stopPropagation(e) {
  e.stopPropagation()
}

// define elements
let banner = document.querySelector('.title-banner');
let spacer = document.querySelector('#spacer')
let title = document.querySelector('.title');
let main = document.querySelector('.main')
let desc1 = document.querySelectorAll('.description')[0]
let desc2 = document.querySelectorAll('.description')[1]
let nav = document.querySelector('.nav')
let lastScroll = 0;

// mobile detection
let mobileMode = false
let onTouchStart = (e) => mobileMode = true

// When the user scrolls, shrink the title banner for a nice animation on desktop
let desktopScroll = () => {
  if (
    banner.offsetHeight > 90 &&
    document.body.scrollTop >= 0
  ) {
    // shrink the banner
    let diff = banner.offsetHeight - document.body.scrollTop
    banner.style.height = diff > 90 ? diff + 'px' : '60px';

    if (mobileMode) {
      document.body.scrollTop = document.body.scrollTop - 5
    } else {
      document.body.scrollTop = 0;
    }

  } else if (lastScroll > document.body.scrollTop && banner.offsetHeight < 90 && document.body.scrollTop < 50) {
    // if the user is scrolling up and the banner is minimized, have it pop back up
    banner.style.height = '250px'
    let fontsize = 16
    title.style.fontSize = fontsize + 'px'
    title.style.display = 'inline-block'
    banner.className = 'title-banner'
    desc1.style.display = 'inline-block'
    desc2.style.display = 'inline-block';
    spacer.className = 'hide';


  } else if (document.body.scrollTop >= 0 && banner.offsetHeight < 90) {
    // if the banner is less than 90px, hide the description section because it won't fit
    if (window.innerWidth < 900) {
      title.style.display = 'none'
    }
    title.style.fontSize = '12px'

    banner.style.height = '60px'
    banner.className = 'title-banner-fixed';
    desc1.style.display = 'none';
    desc2.style.display = 'none';
    spacer.className = 'spacer';
  }
  lastScroll = document.body.scrollTop
}

let mobileScroll = function (e) {

  if (document.body.scrollTop > 270) {
  
    nav.style.backgroundImage = "url('./images/banner.jpg')"

  } else {
    nav.style.backgroundImage = 'none'
  }
  if (document.body.scrollTop > 150) {
    title.style.display = 'none'
    desc1.style.display = 'none';
    desc2.style.display = 'none';
  } else if (title.style.display ==='none') {
    title.style.display = 'block';
    desc1.style.display = 'block';
    desc2.style.display = 'block';
  }
}

let onScroll = function(e){
  if(mobileMode) {
    mobileScroll()
  } else {
    desktopScroll()
  }
}

document.addEventListener('touchstart', onTouchStart)
document.addEventListener('scroll', onScroll)


window.onresize = function (e) {
  if (window.innerWidth < 900 && banner.offsetHeight < 90) {
    // in this case, the title won't fit, so hide it
    title.style.display = 'none'
  } else if (title.style.display !== 'block') {
    title.style.display = 'block'
  }
}
