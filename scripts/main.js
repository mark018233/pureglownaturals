/* PureGlow Naturals — minimal store logic + UI */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Data (extendable) ---------- */
const PRODUCTS = [
  {id:'spf', name:'Daily Mineral SPF 30', price:22, rating:4.4, category:'spf',
   image:'assets/images/product-img1.png', badges:['reef-safe'], skin:['all'],
   concerns:['aging'], description:'Broad-spectrum mineral sunscreen, no white cast.',
   ingredients:['Zinc Oxide','Caprylic/Capric Triglyceride','Aloe Barbadensis Leaf Juice']},
    {id:'cleanser', name:'Radiance Cleanser', price:18, rating:4.6, category:'cleanser',
   image:'assets/images/product-img5.png', badges:['vegan'], skin:['dry','combo','sensitive'],
   concerns:['dullness'], description:'Gentle gel cleanser with green tea & aloe.',
   ingredients:['Aqua','Glycerin','Camellia Sinensis Leaf Extract','Aloe Barbadensis Leaf Juice','Coco-Glucoside']},
  {id:'toner', name:'HydraMist Toner', price:16, rating:4.5, category:'toner',
   image:'assets/images/product-img3.png', badges:['fragrance-free'], skin:['dry','sensitive'],
   concerns:['dullness'], description:'pH-balancing mist with hyaluronic acid.',
   ingredients:['Aqua','Sodium Hyaluronate','Panthenol','Allantoin']},
  {id:'serum', name:'Renew Serum', price:28, rating:4.7, category:'serum',
   image:'assets/images/product-img4.png', badges:['vegan'], skin:['oily','combo','sensitive'],
   concerns:['acne','aging'], description:'Niacinamide + zinc for clarity and bounce.',
   ingredients:['Aqua','Niacinamide (5%)','Zinc PCA','Glycerin','Betaine']},
  ,
  {id:'kit', name:'Eco Starter Kit', price:39, rating:4.8, category:'kit',
   image:'assets/images/product-img6.png', badges:['bundle','best-seller'], skin:['all'],
   concerns:['dullness','acne'], description:'Cleanser + Toner + Serum — easy switch to clean skincare.',
   ingredients:['See individual products']}
];

/* ---------- State ---------- */
const state = {
  cart: JSON.parse(localStorage.getItem('pg_cart') || '[]'),
  get subtotal(){ return state.cart.reduce((s,i)=>s + i.price*i.qty, 0) }
};
function saveCart(){ localStorage.setItem('pg_cart', JSON.stringify(state.cart)); updateCartUI(); }

/* ---------- Utilities ---------- */
const money = n => `$${n.toFixed(2)}`;
function pushEvent(name, payload = {}) {
  window.dataLayer.push({event:name, ...payload});
}

/* ---------- Nav ---------- */
(function navInit(){
  const btn = $('.nav-toggle');
  const nav = $('#primary-nav');
  if(!btn || !nav) return;
  btn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

/* ---------- Featured products on Home ---------- */
(function homeFeatured(){
  const grid = $('#featuredGrid');
  if(!grid) return;
  const featured = PRODUCTS.slice(0,4);
  grid.innerHTML = featured.map(cardHTML).join('');
  bindProductCards(grid);
})();

/* ---- Featured scroller controls ---- */
(function featuredScrollerControls(){
  const scroller = document.getElementById('featuredScroller');
  const prev = document.querySelector('.scroll-btn.prev');
  const next = document.querySelector('.scroll-btn.next');
  if(!scroller || !prev || !next) return;

  const step = () => Math.max(scroller.clientWidth * 0.9, 280);

  prev.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => scroller.scrollBy({ left:  step(), behavior: 'smooth' }));
})();


/* ---------- Product grid on Collections ---------- */
(function collectionsInit(){
  const grid = $('#productGrid');
  if(!grid) return;

  const priceRange = $('#priceRange');
  const priceValue = $('#priceValue');
  const sortSelect = $('#sortSelect');
  const clearBtn = $('#clearFilters');

  function applyFiltersSort(){
    let out = PRODUCTS.slice();
    // filters
    const skins = $$('input[name="skin"]:checked').map(i=>i.value);
    const concerns = $$('input[name="concern"]:checked').map(i=>i.value);
    const cats = $$('input[name="category"]:checked').map(i=>i.value);
    const maxPrice = Number(priceRange.value);

    out = out.filter(p=>{
      const skinOK = !skins.length || skins.some(s => p.skin.includes(s) || p.skin.includes('all'));
      const conOK = !concerns.length || concerns.some(c => p.concerns.includes(c));
      const catOK = !cats.length || cats.includes(p.category);
      const priceOK = p.price <= maxPrice;
      return skinOK && conOK && catOK && priceOK;
    });

    // sort
    const s = sortSelect.value;
    if(s==='price-asc') out.sort((a,b)=>a.price-b.price);
    if(s==='price-desc') out.sort((a,b)=>b.price-a.price);
    if(s==='rating-desc') out.sort((a,b)=>b.rating-a.rating);

    grid.innerHTML = out.map(cardHTML).join('');
    bindProductCards(grid);
  }

  priceRange?.addEventListener('input', ()=>{ priceValue.textContent = priceRange.value; applyFiltersSort(); });
  sortSelect?.addEventListener('change', applyFiltersSort);
  $$('.filters input').forEach(i=> i.addEventListener('change', applyFiltersSort));
  clearBtn?.addEventListener('click', ()=>{
    $$('.filters input[type="checkbox"]').forEach(i=> i.checked=false);
    priceRange.value = 60; priceValue.textContent = '60';
    sortSelect.value = 'featured';
    applyFiltersSort();
  });

  applyFiltersSort();
})();

/* ---------- Card rendering & interactions ---------- */
function cardHTML(p){
  return `
  <article class="product">
    <img src="${p.image}" alt="${p.name}" loading="lazy">
    <div class="p-body">
      <div class="p-title">${p.name}</div>
      <div class="p-meta"><span>${money(p.price)}</span><span>★ ${p.rating}</span></div>
      <ul class="badges">${p.badges.map(b=>`<li class="badge">${b}</li>`).join('')}</ul>
      <div class="p-actions" style="margin-top:.5rem; display:flex; gap:.5rem;">
        <button class="btn btn-primary" data-add="${p.id}">Add to Bag</button>
        <button class="btn btn-ghost" data-view="${p.id}">Learn More</button>
      </div>
    </div>
  </article>`;
}
function bindProductCards(root){
  root.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-add');
      const product = PRODUCTS.find(p=>p.id===id);
      const existing = state.cart.find(i=>i.id===id);
      if(existing) existing.qty += 1; else state.cart.push({...product, qty:1});
      saveCart();
      openCart();
      pushEvent('add_to_cart', {item_id:id, value:product.price});
    });
  });
  root.querySelectorAll('[data-view]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-view');
      openProductModal(id);
      pushEvent('view_item', {item_id:id});
    });
  });
}

/* ---------- Modal (Product) ---------- */
const productModal = $('#productModal');
const productModalContent = $('#productModalContent');
$$('[data-close-modal]').forEach(b=>b.addEventListener('click', ()=>productModal?.close()));

function openProductModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p || !productModal) return;
  productModalContent.innerHTML = `
    <div class="grid-2">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <h2>${p.name}</h2>
        <p class="tiny">Rating: ★ ${p.rating}</p>
        <p>${p.description}</p>
        <p><strong>${money(p.price)}</strong></p>
        <h3>Ingredients (INCI)</h3>
        <ul>${p.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>
        <button class="btn btn-primary" data-add="${p.id}">Add to Bag</button>
      </div>
    </div>
    <script type="application/ld+json">
    {
      "@context":"https://schema.org/",
      "@type":"Product",
      "name":"${p.name}",
      "image":"${location.origin}/${p.image}",
      "brand":{"@type":"Brand","name":"PureGlow Naturals"},
      "sku":"${p.id}",
      "description":"${p.description}",
      "offers":{"@type":"Offer","priceCurrency":"USD","price":"${p.price}","availability":"https://schema.org/InStock"}
    }
    </script>
  `;
  productModal.showModal();
  bindProductCards(productModal);
}

/* ---------- Cart drawer ---------- */
const drawer = $('#cartDrawer');
const scrim = $('#scrim');
const cartCount = $('#cartCount');
const cartItems = $('#cartItems');
const cartSubtotal = $('#cartSubtotal');

function openCart(){
  if(!drawer) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  scrim?.removeAttribute('hidden');
}
function closeCart(){
  if(!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  scrim?.setAttribute('hidden','');
}
$('.cart-open')?.addEventListener('click', openCart);
$('.cart-close')?.addEventListener('click', closeCart);
scrim?.addEventListener('click', ()=>{ closeCart(); productModal?.close(); });

function updateCartUI(){
  if(cartCount) cartCount.textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  if(cartItems) cartItems.innerHTML = state.cart.length
    ? state.cart.map(i=>`
      <div class="cart-line">
        <span>${i.name} × ${i.qty}</span>
        <span>${money(i.price*i.qty)}</span>
      </div>
      <div class="cart-line">
        <button class="btn btn-ghost" data-qty="${i.id}:-1">-</button>
        <button class="btn btn-ghost" data-qty="${i.id}:1">+</button>
        <button class="btn btn-ghost" data-remove="${i.id}">Remove</button>
      </div>
    `).join('')
    : `<p>Your bag is empty.</p>`;
  if(cartSubtotal) cartSubtotal.textContent = money(state.subtotal);

  // qty handlers
  $$('#cartItems [data-qty]').forEach(b=> b.addEventListener('click', ()=>{
    const [id,delta] = b.getAttribute('data-qty').split(':');
    const item = state.cart.find(x=>x.id===id);
    if(!item) return;
    item.qty = Math.max(1, item.qty + Number(delta));
    saveCart();
  }));
  // remove
  $$('#cartItems [data-remove]').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.getAttribute('data-remove');
    const idx = state.cart.findIndex(x=>x.id===id);
    if(idx>-1){ state.cart.splice(idx,1); saveCart(); }
  }));
}
updateCartUI();

$('#beginCheckout')?.addEventListener('click', ()=>{
  alert('Checkout demo:\n1) Shipping\n2) Payment\n3) Review & Place Order');
  pushEvent('begin_checkout', {value: state.subtotal});
});

/* ---------- Newsletter ---------- */
$('#newsletterForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const email = $('#newsletterEmail').value.trim();
  const msg = $('#newsletterMsg');
  if(!/^\S+@\S+\.\S+$/.test(email)){ msg.textContent = 'Enter a valid email.'; return; }
  const list = JSON.parse(localStorage.getItem('pg_newsletter') || '[]');
  if(!list.includes(email)){ list.push(email); localStorage.setItem('pg_newsletter', JSON.stringify(list)); }
  msg.textContent = 'Thanks! You are subscribed.'; $('#newsletterEmail').value='';
  pushEvent('generate_lead', {email});
});

/* ---------- Contact form ---------- */
$('#contactForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const form = e.currentTarget;
  const out = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    topic: form.topic.value,
    message: form.message.value.trim()
  };
  const msg = $('#contactMsg');
  if(!out.name || !/^\S+@\S+\.\S+$/.test(out.email) || !out.topic || !out.message){
    msg.textContent = 'Please complete all fields with valid information.'; return;
  }
  msg.textContent = 'Thanks — we will reply within 1–2 business days.';
  form.reset();
});

/* ---------- FAQ accordion ---------- */
$$('.faq-q').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('aria-controls');
    const panel = document.getElementById(id);
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if(panel) panel.hidden = expanded;
  });
});

/* ---------- Misc ---------- */
$('#year') && ($('#year').textContent = new Date().getFullYear());
// Apply UTM params to CTAs if present
(function applyUTM(){
  const qs = new URLSearchParams(location.search);
  if(!qs.toString()) return;
  $$('[data-analytics^="cta_"]').forEach(a=>{
    try{
      const url = new URL(a.href, location.origin);
      qs.forEach((v,k)=> url.searchParams.set(k,v));
      a.href = url.toString();
    }catch{}
  });
})();
