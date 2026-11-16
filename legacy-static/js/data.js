/* REDLACE catalogue. Every image is a studio photo of the real shoe.
   Per shoe: assets/shoes/<id>/main.webp plus s01–s18.webp (a turn every 20°). */
window.RL = window.RL || {};

RL.SPIN_FRAMES = 18;
RL.SIZES = [6, 7, 8, 9, 10, 11, 12];

RL.products = [
  {
    id: 'dunk-low-university-red', brand: 'Nike', name: 'Dunk Low', colorway: 'University Red',
    price: 12795, mrp: 14995, type: 'Low-top', year: 2020, isNew: true, rating: 4.9, reviews: 1284,
    blurb: 'White leather base, red overlays, red laces. The college-colours Dunk that started as a 1985 basketball shoe.',
    details: ['Full-grain leather upper', 'Perforated toe box', 'Embroidered NIKE heel tab', 'Rubber cupsole with pivot-circle tread'],
  },
  {
    id: 'jordan-1-high-chicago', brand: 'Jordan', name: 'Air Jordan 1 High OG', colorway: 'Chicago Lost & Found',
    price: 38995, mrp: 42995, type: 'High-top', year: 2022, isNew: true, rating: 4.9, reviews: 962,
    blurb: 'The 1985 Chicago colourway, aged on purpose: cracked black collar, sail midsole, slightly off-white panels.',
    details: ['Leather upper with cracked-finish collar', 'Nike Air tongue label', 'Encapsulated Air in the heel', 'Sail rubber cupsole'],
  },
  {
    id: 'jordan-4-fire-red', brand: 'Jordan', name: 'Air Jordan 4 Retro', colorway: 'Fire Red',
    price: 32495, mrp: 34995, type: 'High-top', year: 2020, isNew: false, rating: 4.8, reviews: 731,
    blurb: 'White leather, black wings, red hits and Nike Air on the heel, just as the 1989 pair had it.',
    details: ['Leather upper with mesh netting', 'Moulded lace wings', 'Visible Air unit in the heel', 'Nike Air heel branding'],
  },
  {
    id: 'jordan-1-low-gym-red', brand: 'Jordan', name: 'Air Jordan 1 Low', colorway: 'Gym Red',
    price: 10795, mrp: 11495, type: 'Low-top', year: 2021, isNew: false, rating: 4.7, reviews: 418,
    blurb: 'The Jordan 1 cut below the ankle, in two-tone gym red over white.',
    details: ['Leather upper', 'Stitched Wings logo on the heel', 'Encapsulated Air in the heel', 'Rubber cupsole'],
  },
  {
    id: 'jordan-11-cherry', brand: 'Jordan', name: 'Air Jordan 11 Retro', colorway: 'Cherry',
    price: 29995, mrp: 31995, type: 'High-top', year: 2022, isNew: true, rating: 4.8, reviews: 655,
    blurb: 'Glossy red patent leather wrapped around a white upper, sitting on an icy translucent sole.',
    details: ['Patent leather mudguard', 'Ballistic mesh upper', 'Carbon-fibre shank plate', 'Translucent rubber outsole'],
  },
  {
    id: 'dunk-low-panda', brand: 'Nike', name: 'Dunk Low Retro', colorway: 'White Black',
    price: 9695, mrp: 9695, type: 'Low-top', year: 2021, isNew: false, rating: 4.7, reviews: 3120,
    blurb: 'Black overlays on white leather. The pair most people mean when they say "Panda".',
    details: ['Leather upper', 'Perforated toe box', 'Padded low-cut collar', 'Rubber cupsole with pivot-circle tread'],
  },
  {
    id: 'air-force-1-university-red', brand: 'Nike', name: 'Air Force 1 Low', colorway: 'White University Red',
    price: 9995, mrp: 10795, type: 'Low-top', year: 2020, isNew: false, rating: 4.6, reviews: 540,
    blurb: 'An all-white Air Force 1 with a red sole, red collar lining and red AIR on the midsole.',
    details: ['Leather upper', 'Perforated toe box', 'Nike Air cushioning', 'Rubber cupsole with pivot circles'],
  },
  {
    id: 'air-max-90-infrared', brand: 'Nike', name: 'Air Max 90', colorway: 'Infrared',
    price: 13995, mrp: 14995, type: 'Runner', year: 2020, isNew: false, rating: 4.8, reviews: 889,
    blurb: 'The 1990 original colourway. Grey and black panels built to point at the glowing Air window.',
    details: ['Mesh upper with leather and synthetic overlays', 'Visible Max Air unit', 'Padded collar', 'Waffle rubber outsole'],
  },
  {
    id: 'dunk-high-university-red', brand: 'Nike', name: 'Dunk High', colorway: 'University Red',
    price: 11895, mrp: 12795, type: 'High-top', year: 2021, isNew: false, rating: 4.7, reviews: 367,
    blurb: 'The same red and white blocking as the Low, with the full padded collar.',
    details: ['Leather upper', 'Padded high-cut collar', 'Perforated toe box', 'Rubber cupsole with pivot-circle tread'],
  },
  {
    id: 'samba-og-scarlet', brand: 'adidas', name: 'Samba OG', colorway: 'White Better Scarlet',
    price: 10999, mrp: 10999, type: 'Low-top', year: 2023, isNew: true, rating: 4.8, reviews: 1502,
    blurb: 'The indoor football trainer from 1949, with scarlet stripes and a dark gum sole.',
    details: ['Leather upper', 'Suede T-toe overlay', 'Serrated three stripes', 'Gum rubber outsole'],
  },
  {
    id: 'campus-00s-scarlet', brand: 'adidas', name: 'Campus 00s', colorway: 'Better Scarlet',
    price: 10999, mrp: 11999, type: 'Low-top', year: 2023, isNew: true, rating: 4.6, reviews: 478,
    blurb: 'A wider, chunkier Campus in all-over scarlet suede with off-white stripes.',
    details: ['Suede upper', 'Padded tongue and collar', 'Leather three stripes', 'Rubber cupsole'],
  },
  {
    id: 'gazelle-scarlet', brand: 'adidas', name: 'Gazelle Indoor', colorway: 'Scarlet',
    price: 11999, mrp: 11999, type: 'Low-top', year: 2023, isNew: false, rating: 4.7, reviews: 391,
    blurb: 'Deep red suede over a see-through gum sole, taken from the 1979 indoor trainer.',
    details: ['Suede upper', 'Leather three stripes and heel tab', 'Gold foil Gazelle lettering', 'Translucent gum rubber outsole'],
  },
  {
    id: 'nb-550-white-red', brand: 'New Balance', name: '550', colorway: 'White Red',
    price: 12999, mrp: 13999, type: 'Low-top', year: 2021, isNew: false, rating: 4.6, reviews: 712,
    blurb: 'A 1989 basketball low brought back unchanged: white leather, red N, black and red sole.',
    details: ['Leather upper', 'Perforated side panels', 'Padded collar', 'Rubber cupsole'],
  },
  {
    id: 'chuck-70-enamel-red', brand: 'Converse', name: 'Chuck 70 Hi', colorway: 'Enamel Red',
    price: 6499, mrp: 6999, type: 'High-top', year: 2019, isNew: false, rating: 4.7, reviews: 1043,
    blurb: 'Heavier canvas, a taller glossy foxing stripe and the black heel plate of the 1970s Chuck.',
    details: ['12oz canvas upper', 'Cushioned OrthoLite insole', 'Egret rubber toe cap and foxing', 'Vulcanised rubber sole'],
  },
  {
    id: 'old-skool-black-white', brand: 'Vans', name: 'Old Skool', colorway: 'Black White',
    price: 5499, mrp: 5499, type: 'Low-top', year: 2016, isNew: false, rating: 4.6, reviews: 2210,
    blurb: 'Black suede and canvas with the white side stripe. The first Vans to wear it, in 1977.',
    details: ['Suede and canvas upper', 'Reinforced toe cap', 'Padded collar', 'Vulcanised waffle outsole'],
  },
  {
    id: 'mexico-66-tricolor', brand: 'Onitsuka Tiger', name: 'Mexico 66', colorway: 'White Blue Red',
    price: 10999, mrp: 10999, type: 'Runner', year: 2018, isNew: false, rating: 4.7, reviews: 834,
    blurb: 'A thin-soled 1966 trainer in white leather with blue and red tiger stripes and a heel flap.',
    details: ['Leather upper with suede toe and heel', 'Tiger stripes on both sides', 'Heel tab with cross-stitch', 'Low-profile rubber outsole'],
  },
];

RL.byId = function (id) { return RL.products.find(function (p) { return p.id === id; }); };
RL.img = function (p, n) {
  var id = typeof p === 'string' ? p : p.id;
  if (!n) return 'assets/shoes/' + id + '/main.webp';
  return 'assets/shoes/' + id + '/s' + (n < 10 ? '0' + n : n) + '.webp';
};
/* "Jordan Air Jordan 1" reads twice, so Jordan pairs go by model name alone. */
RL.label = function (p) { return p.brand === 'Jordan' ? p.name : p.brand + ' ' + p.name; };
RL.rupee = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

/* A stable handful of sold-out sizes per shoe, so the size picker has something to show. */
RL.soldOut = function (p) {
  var h = 0;
  for (var i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
  var out = [RL.SIZES[h % RL.SIZES.length]];
  if (h % 3 === 0) out.push(RL.SIZES[(h >> 4) % RL.SIZES.length]);
  return out;
};
