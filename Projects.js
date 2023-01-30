
let projects = [
    //Title, description, url, VideoURL
    {
      description: "Share and edit your friend's photos",
      title: 'Spinoff',
      url: 'https://skyfox93.github.io/newimagedit',
      videoURL: "https://player.vimeo.com/video/331844687?byline=0&portrait=0",
      imageURL: './images/spinoff.png',
      code: "https://github.com/skyfox93/spinoff-front",
      tech: ['Ruby on Rails', 'React', 'Javascript']
    },
  
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

  class Project {

    constructor(data) {
        this.data = data
    }

    getHtml() {
        return (
            `
            <div class='project-card'>
                <div class='card-title'>
                  ${this.data.title}
                </div>
                <div class='card-image' style='background-image:url(${this.data.imageURL})'>
                </div>
                <div class='card-description'>
                  ${this.data.description}
                </div>
                <div class='built-with'> Built with: ${this.data.tech.map(
                  (t) => (`<span class="tech-keyword">${t}</span>`)
                  ).join('')}
                </div>
                <div class='card-menu'>
                  ${  this.data.videoURL ?
                    `<div data-url="${this.data.videoURL}" class='menu-link video'> <img src='./images/movie-icon2.svg' class='icon'> </div>`
                  : ''
                  }
                ${this.data.url ?
                `<a href="${this.data.url}" class='menu-link'> <img src='./images/open-demo.svg' class='icon'> </a>`
                : ''}
                ${this.data.code ?
                `<a href='${this.data.code}' class='menu-link'> <img src='./images/github-mark-white.png' class='icon'> </a>` :
                ''}
                </div>
            </div>
        `
    )   
    }
  }

  let initalizedProjects = projects.map(data => new Project(data))
  
  let renderProjects = (projects, projectsContainer) => {
      let newContent = (initalizedProjects).reduce((acc,project) =>(acc + project.getHtml()), '')
      projectsContainer.innerHTML = newContent
  }
  
  const projectsContainer = document.querySelector('#projects-container')
  renderProjects(initalizedProjects,projectsContainer)
  
  
  