// Content for the graph homepage. Edit here; graph.js builds nodes + links from it.

export const profile = {
  name: 'Skylar Salerno',
  tagline: 'I develop software to make the world more connected',
  headshot: './images/clipped-headshot.png',
  resumePdf: './images/Salerno_Resume_2023.pdf',
}

export const experience = [
  {
    id: 'apteo',
    title: 'Apteo',
    dates: '2019 – 2021',
    image: './images/mockup-apteo.png',
    description:
      'Built several features of our Shopify app end-to-end, including authorization, bulk data import, and the customer analytics page — e.g. sending product recommendation emails based on each shopper’s preferences.',
    tech: ['Python (Flask)', 'React', 'Postgres', 'Google BigQuery'],
  },
  {
    id: 'dalia',
    title: 'Dalia',
    subtitle: 'formerly Maia',
    dates: 'June 2018 – Dec 2019',
    image: './images/maia.png',
    description:
      'De facto tech lead wearing many hats: improved our job search engine, fixed memory issues, updated front-end components, and advised the CEO on DevOps and product.',
    tech: ['Ruby on Rails', 'Postgres', 'ElasticSearch'],
  },
]

export const projects = [
  {
    id: 'trek',
    title: 'Trek Script Search',
    description: 'Search Star Trek scripts three ways: keywords, RAG, and an AI agent',
    url: './trek-search/',
    image: './images/trek-search.svg',
    code: 'https://github.com/skyfox93/quote-search',
    tech: ['Ruby on Rails', 'Postgres', 'OpenAI'],
  },
  {
    id: 'spinoff',
    title: 'Spinoff',
    description: "Share and edit your friend's photos",
    url: 'https://skyfox93.github.io/newimagedit',
    vimeoId: '331844687',
    image: './images/spinoff.png',
    code: 'https://github.com/skyfox93/spinoff-front',
    tech: ['Ruby on Rails', 'React', 'JavaScript'],
  },
  {
    id: 'plunk',
    title: 'Plunk!',
    description: 'Jam with other people in real time',
    url: 'https://skyfox93-plunk.glitch.me/',
    vimeoId: '332441007',
    image: './images/plunk.png',
    code: 'https://github.com/skyfox93/plunk',
    tech: ['Node.js', 'Socket.io', 'JavaScript'],
  },
]

export const outLinks = [
  { id: 'blog', title: 'Blog', url: 'https://medium.com/skylar-salernos-tech-blog' },
  { id: 'github', title: 'GitHub', url: 'https://github.com/skyfox93' },
  { id: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/in/skylar-salerno-581707180' },
]
