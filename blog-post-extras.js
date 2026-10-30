import {selectServices} from './blog-service-selection.js';
const article = document.getElementById('post');
const create = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};
async function enhance() {
  if (!article?.querySelector('h1') || article.querySelector('.blog-featured-services')) return;
  observer.disconnect();
  if (!article.querySelector('img.featured')) {
    const figure = create('figure', 'blog-cover');
    const image = create('img');
    image.src = '/Images/blog/branding-print-design-cover.webp';
    image.alt = 'Branding and print design concept with stationery, brochure and packaging mockups';
    image.width = 1600; image.height = 900; image.decoding = 'async';
    figure.append(image, create('figcaption', '', 'Branding and print design concept · Sai Graphic Designs'));
    article.querySelector('h1').after(figure);
  }
  try {
    const response = await fetch('/blog-service-catalog.json');
    if (!response.ok) return;
    const catalog = await response.json();
    const seed = new URLSearchParams(location.search).get('slug') || location.pathname;
    const section = create('section', 'blog-featured-services');
    section.setAttribute('aria-labelledby', 'blog-services-title');
    const heading = create('h2', '', 'Explore our design services'); heading.id = 'blog-services-title';
    const grid = create('div', 'blog-services-grid');
    for (const service of selectServices(catalog, seed)) {
      const link = create('a', 'blog-service-card'); link.href = service.link;
      link.dataset.serviceId = service.id;
      const image = create('img'); image.src = service.image; image.alt = service.name + ' concept example';
      image.width = 600; image.height = 450; image.loading = 'lazy'; image.decoding = 'async';
      const body = create('div', 'blog-service-body');
      body.append(create('h3', '', service.name), create('p', '', service.description), create('span', 'blog-service-cta', 'View service & discuss your project →'));
      link.append(image, body); grid.append(link);
    }
    section.append(heading, create('p', 'blog-services-intro', 'Planning your next project? Explore these services from Sai Graphic Designs and share your brief for a tailored quote.'), grid, create('p', 'blog-service-note', 'Visuals are design concepts. Scope, revisions, delivery dates and final files are confirmed in your quotation.'));
    article.append(section);
  } catch { /* The article remains available if service suggestions cannot load. */ }
}
const observer = new MutationObserver(enhance);
if (article) {observer.observe(article, {childList: true, subtree: true}); enhance();}
