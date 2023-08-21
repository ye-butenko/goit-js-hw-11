import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
  sentinel: document.querySelector('.sentinel'),
};

const observer = new IntersectionObserver(onLoadMore);
const gallery = new SimpleLightbox('.gallery a');

let page = 1;
let query = '';
let totalHits = 1;

refs.form.addEventListener('submit', onSearch);

async function onSearch(event) {
  event.preventDefault();
  refreshGPO();
  const formData = new FormData(event.currentTarget);
  query = formData.get('searchQuery').trim();

  try {
    const hits = await getImg(query);

    if (!hits.length) {
      errorQuery();
    } else {
      observer.observe(refs.sentinel);
      accessQuery(totalHits);
      createMarkup(hits);
      gallery.refresh();
    }
  } catch (err) {
    onError(err);
  } finally {
    refs.form.reset();
  }
}

async function onLoadMore(entries) {
  if (entries[0].isIntersecting) {
    page += 1;
    try {
      const hits = await getImg(query, page);

      if (refs.gallery.childElementCount >= totalHits) {
        observer.unobserve(refs.sentinel);
        endOfSearch();
      } else {
        createMarkup(hits);
        smoothScrollGallery();
        gallery.refresh();
      }
    } catch (err) {
      onError(err);
    }
  }
}

async function getImg(query, page = 1) {
  const URL = 'https://pixabay.com/api/';

  const params = new URLSearchParams({
    key: '38932649-521aeee1dbf91990db97ca725',
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    per_page: 40,
    page,
  });

  const { data } = await axios(`${URL}?${params}`);
  totalHits = data.totalHits;

  return data.hits.map(
    ({
      webformatURL,
      largeImageURL,
      tags,
      likes,
      views,
      comments,
      downloads,
    }) => {
      return {
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      };
    }
  );
}

//
function createMarkup(hits) {
  const markup = hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `
        <div class="photo-card">
  <a href="${webformatURL}">
    <img class="photo-card__img" src="${largeImageURL}" alt="${tags}" loading="lazy" width="320" height="212" />
  </a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>
      <span>${likes}</span>
    </p>
    <p class="info-item">
      <b>Views</b>
      <span>${views}</span>
    </p>
    <p class="info-item">
      <b>Comments</b>
      <span>${comments}</span>
    </p>
    <p class="info-item">
      <b>Downloads</b>
      <span>${downloads}</span>
    </p>
  </div>
</div>`;
      }
    )
    .join('');

  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

//плавне прокручуваня після load more
function smoothScrollGallery() {
  const { height: cardHeight } =
    refs.gallery.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

//кастомні сповіщення
function accessQuery(totalHits) {
  Notify.success(`Hooray! We found ${totalHits} images.`);
}

function endOfSearch() {
  Notify.info("We're sorry, but you've reached the end of search results.");
}

function errorQuery() {
  Notify.warning(
    'Sorry, there are no images matching your search query. Please try again.'
  );
}

function onError(err) {
  Notify.failure(err);
}

function refreshGPO() {
  refs.gallery.innerHTML = '';
  page = 1;
  observer.unobserve(refs.sentinel);
}
