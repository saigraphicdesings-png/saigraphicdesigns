import {optimise} from './frame-photo.mjs';

const byId = id => document.getElementById(id);
const form = byId('order');
const items = byId('items');
const status = byId('status');
const maxItems = 5;
const maxPhotos = 10;
const availableProducts = new Map();
const availableSizes = new Map();
const uploads = new WeakMap();
const previews = new WeakMap();
const formatPrice = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0});
let requestKey = crypto.randomUUID();

async function api(path, body) {
  const response = await fetch('/api/' + path, body === undefined ? {} : {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Please try again.'), {status: response.status});
  return result;
}

function frameDetails(row) {
  const product = availableProducts.get(row.querySelector('.product').value);
  const size = availableSizes.get(row.querySelector('.size').value);
  return {
    id: product.id,
    size: size.name,
    price: product.price + size.extra,
    qty: row.querySelector('.quantity').valueAsNumber,
    caption: row.querySelector('.caption').value
  };
}

function updateItems() {
  let subtotal = 0;
  for (const [index, row] of [...items.children].entries()) {
    row.querySelector('legend').textContent = 'Frame design ' + (index + 1);
    row.querySelector('.remove').disabled = items.childElementCount === 1;
    const frame = frameDetails(row);
    subtotal += frame.price * (frame.qty || 0);
  }
  byId('add').disabled = items.childElementCount >= maxItems;
  byId('subtotal').textContent = 'Frame subtotal ' + formatPrice.format(subtotal);
}

function releasePreview(input) {
  for (const url of previews.get(input) || []) URL.revokeObjectURL(url);
  previews.delete(input);
}

function addItem() {
  if (items.childElementCount >= maxItems) return;
  const row = byId('item').content.firstElementChild.cloneNode(true);
  const product = row.querySelector('.product');
  const size = row.querySelector('.size');
  for (const entry of availableProducts.values()) product.add(new Option(entry.name, entry.id));
  for (const entry of availableSizes.values()) size.add(new Option(entry.name, entry.name));
  const photo = row.querySelector('.photo');
  photo.addEventListener('change', () => {
    releasePreview(photo);
    const container = row.querySelector('.previews');
    container.replaceChildren();
    const files = [...photo.files];
    photo.setCustomValidity(files.length > maxPhotos ? 'Choose up to 10 photos per frame design.' : '');
    if (files.length > maxPhotos) {
      photo.reportValidity();
      return;
    }
    const urls = files.map((file, index) => {
      const image = document.createElement('img');
      image.className = 'preview';
      image.alt = 'Selected photo ' + (index + 1);
      image.src = URL.createObjectURL(file);
      container.append(image);
      return image.src;
    });
    previews.set(photo, urls);
  });
  row.querySelector('.remove').addEventListener('click', () => {
    releasePreview(photo);
    row.remove();
    requestKey = crypto.randomUUID();
    updateItems();
    byId('add').focus();
  });
  items.append(row);
  updateItems();
  return product;
}

function showForm(user) {
  byId('signin').hidden = true;
  if (!availableProducts.size || !availableSizes.size) {
    status.textContent = 'Online orders are unavailable until frames are published in the store.';
    return;
  }
  for (const name of ['name', 'phone', 'address', 'city', 'pin']) {
    form.elements.namedItem(name).value ||= user[name] || '';
  }
  if (!items.childElementCount) addItem();
  form.hidden = false;
  status.textContent = '';
}

byId('add').addEventListener('click', () => {
  requestKey = crypto.randomUUID();
  addItem()?.focus();
});
form.addEventListener('input', () => {
  requestKey = crypto.randomUUID();
  updateItems();
});

byId('login').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  button.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(event.target));
    const {user} = await api('auth/login', data);
    event.target.reset();
    showForm(user);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const customer = Object.fromEntries(new FormData(form));
  const controls = [...form.querySelectorAll('fieldset, input, textarea, button')];
  const enabled = controls.filter(control => !control.disabled);
  for (const control of enabled) control.disabled = true;
  const key = requestKey;
  try {
    const frames = [];
    for (const [index, row] of [...items.children].entries()) {
      const files = [...row.querySelector('.photo').files];
      const photos = [];
      for (const [photoIndex, file] of files.entries()) {
        status.textContent = 'Uploading photo ' + (photoIndex + 1) + ' of ' + files.length + ' for frame design ' + (index + 1) + '…';
        if (!uploads.has(file)) {
          const {id} = await api('frames/photo', {photo: await optimise(file)});
          uploads.set(file, id);
        }
        photos.push(uploads.get(file));
      }
      frames.push({...frameDetails(row), photos});
    }
    status.textContent = 'Submitting your order request…';
    const {order} = await api('frames/orders', {requestKey: key, customer, items: frames});
    for (const input of form.querySelectorAll('.photo')) releasePreview(input);
    form.hidden = true;
    byId('order-id').textContent = order.id;
    byId('confirmation').hidden = false;
    byId('confirmation').focus();
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message;
    if (error.status === 401) {
      form.hidden = true;
      byId('signin').hidden = false;
      for (const input of form.querySelectorAll('.photo')) {
        for (const file of input.files) uploads.delete(file);
      }
    }
  } finally {
    for (const control of enabled) control.disabled = false;
  }
});

async function initialise() {
  const [{products, sizes}, {user}] = await Promise.all([api('frames/products'), api('auth/me')]);
  for (const product of products) {
    if (!product.demo && product.stock !== 0) availableProducts.set(product.id, product);
  }
  for (const size of sizes) availableSizes.set(size.name, size);
  if (user) showForm(user);
  else {
    byId('signin').hidden = false;
    status.textContent = '';
  }
}

initialise().catch(error => {
  status.textContent = error.message + ' Reload the page to try again.';
});
