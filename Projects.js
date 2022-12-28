/* TODO: Reorganize Code To Match Best Practice*/ 


let projects = [
    //Title, description, url, VideoURL
    {
      description: "Share and edit your friend's photos",
      title: 'Spinoff',
     // url: 'http://174.138.58.32/spinoff/',
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
            <div class='card'>
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
                ${this.data.videoURL ?
                `<div data-url="${this.data.videoURL}" class='menu-link video'> Video </div>`
                : ''}
                ${this.data.url ?
                `<a href="${this.data.url}" class='menu-link'>Live Demo </a>`
                : ''}
                ${this.data.code ?
                `<a href='${this.data.code}' class='menu-link'> Repo </a>` :
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
  console.log(projectsContainer)
  renderProjects(initalizedProjects,projectsContainer)
  
  
  