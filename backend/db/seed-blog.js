require('dotenv').config();
const pool = require('../config/db');

const posts = [
  {
    slug: 'trends-2025',
    title: '5 Digital Marketing Trends Shaping Rwanda in 2025',
    excerpt: "From mobile-first strategies to influencer marketing — here's what's working right now for Rwandan businesses.",
    body: "Rwanda's digital landscape is evolving rapidly. Here are the five trends every business owner needs to know in 2025.\n\n1. Mobile-First Marketing\nOver 80% of Rwandans access the internet via mobile. Your ads, website, and content must be optimised for small screens first.\n\n2. Influencer Marketing\nLocal micro-influencers with 5,000–50,000 followers are driving real purchasing decisions. Partnering with trusted voices in your niche delivers better ROI than traditional ads.\n\n3. Short-Form Video\nFacebook Reels and TikTok are exploding in Rwanda. Businesses that post consistent short videos are seeing 3–5x more organic reach.\n\n4. WhatsApp Business\nCustomers expect to chat directly with brands. WhatsApp Business with automated replies and catalogues is becoming a primary sales channel.\n\n5. Data-Driven Campaigns\nBusinesses that track their ad performance and optimise weekly are outperforming those that set-and-forget by a wide margin.",
    published_at: '2025-06-01'
  },
  {
    slug: 'facebook-growth',
    title: 'How to Grow Your Business on Facebook in Rwanda',
    excerpt: 'A practical guide to building an engaged audience and converting followers into paying customers.',
    body: "Facebook remains the most-used social platform in Rwanda with over 1.2 million active users. Here's how to turn that audience into customers.\n\nStep 1: Optimise Your Page\nUse a professional logo as your profile photo, write a clear description with your location and services, and add your WhatsApp number and website.\n\nStep 2: Post Consistently\nAim for 4–5 posts per week. Mix educational content (tips), social proof (client results), and promotional posts (offers) in a 3:1:1 ratio.\n\nStep 3: Use Facebook Ads\nEven RWF 5,000/day can reach thousands of targeted people in Kigali. Start with a traffic campaign to your WhatsApp or website.\n\nStep 4: Engage Every Comment\nThe Facebook algorithm rewards pages that have conversations. Reply to every comment within 2 hours.\n\nStep 5: Run Monthly Giveaways\nGiveaways that require liking, sharing, and tagging a friend are the fastest way to grow your page organically in Rwanda.",
    published_at: '2025-05-20'
  },
  {
    slug: 'digital-presence',
    title: 'Why Every Rwandan Business Needs a Digital Presence',
    excerpt: "The internet economy is growing fast. Here's how to position your brand for success online.",
    body: "Rwanda's internet penetration is growing at 15% year-on-year. Businesses without a digital presence are already losing customers to competitors who are online.\n\nWhat Does a Digital Presence Mean?\nIt means your business can be found online — through a website, social media pages, Google Maps listing, or all three.\n\nWhy It Matters\n- 67% of Rwandan consumers research a business online before visiting or buying\n- A Google Maps listing alone can drive 30+ new customers per month for local businesses\n- Social media pages build trust — customers check your page before calling\n\nWhere to Start\n1. Create a free Google Business Profile\n2. Set up a Facebook Business Page\n3. Get a simple website with your services and contact info\n\nYou don't need a big budget to start. A consistent, professional online presence built over 6 months will outperform expensive one-time campaigns.",
    published_at: '2025-05-10'
  },
  {
    slug: 'seo-basics',
    title: 'SEO Basics for Small Businesses in Rwanda',
    excerpt: "Simple steps to get your website found on Google without spending a fortune on ads.",
    body: "Search Engine Optimisation (SEO) helps your website appear when people search for your services on Google. Here's how to get started without hiring an expensive agency.\n\n1. Claim Your Google Business Profile\nThis is the single most impactful free SEO action. Fill in every field — hours, photos, services, and respond to reviews.\n\n2. Use Local Keywords\nInstead of 'marketing agency', target 'marketing agency Kigali' or 'social media management Rwanda'. People search locally.\n\n3. Write Helpful Content\nPublish one blog post per month answering a question your customers ask. Google rewards websites that help people.\n\n4. Get Listed in Directories\nSubmit your business to Rwanda Yellow Pages, igihe.com business listings, and local chamber directories.\n\n5. Make Your Website Fast\nA slow website ranks lower. Use Google PageSpeed Insights to check your score and fix the top issues.\n\nSEO takes 3–6 months to show results, but the traffic it brings is free and sustainable.",
    published_at: '2025-04-28'
  },
  {
    slug: 'momo-payments',
    title: 'Accepting Mobile Money Payments Online in Rwanda',
    excerpt: 'How to integrate MTN MoMo and Airtel Money into your e-commerce store.',
    body: "Mobile money is the dominant payment method in Rwanda. If your online store doesn't accept MTN MoMo or Airtel Money, you're losing sales.\n\nOption 1: Manual Payment Instructions\nThe simplest approach — display your MoMo number at checkout and ask customers to send payment and share the transaction ID. Works for small volumes.\n\nOption 2: MTN MoMo API\nMTN offers a developer API that lets you request payments programmatically. Customers get a push notification to approve the payment. Requires a business account and API registration at momodeveloper.mtn.com.\n\nOption 3: Payment Aggregators\nServices like DPO Group and Flutterwave support Rwanda MoMo and handle the API complexity for you. They charge 2–3% per transaction.\n\nWhat You Need\n- Registered business in Rwanda\n- Business MoMo account\n- Developer account (for API integration)\n\nFor most small businesses, starting with manual instructions and upgrading to an aggregator when volume grows is the most practical path.",
    published_at: '2025-04-15'
  },
  {
    slug: 'branding-guide',
    title: 'The Complete Branding Guide for Rwandan Startups',
    excerpt: 'Everything you need to know about building a memorable brand identity from scratch.',
    body: "Your brand is more than a logo — it's the feeling people get when they interact with your business. Here's how to build one that lasts.\n\nStep 1: Define Your Brand\nAnswer these questions: Who are your customers? What problem do you solve? What makes you different? What values guide your business?\n\nStep 2: Choose Your Name\nA good business name is short, easy to pronounce in Kinyarwanda and English, and available as a domain name and social media handle.\n\nStep 3: Design Your Visual Identity\n- Logo: Simple, scalable, works in black and white\n- Colours: Choose 2 primary colours that reflect your brand personality\n- Typography: Pick 2 fonts — one for headings, one for body text\n\nStep 4: Create Brand Guidelines\nDocument your logo usage, colours (with hex codes), fonts, and tone of voice. Share this with anyone who creates content for your business.\n\nStep 5: Apply Consistently\nUse your brand consistently across your website, social media, business cards, and packaging. Consistency builds recognition and trust.\n\nInvesting in branding early saves money later — rebranding an established business is far more expensive than getting it right from the start.",
    published_at: '2025-04-01'
  }
];

pool.query("SELECT id FROM users WHERE role='admin' LIMIT 1").then(async ({ rows }) => {
  const authorId = rows[0].id;
  for (const p of posts) {
    await pool.query(
      `INSERT INTO blog_posts (title, slug, body, excerpt, author_id, status, published_at)
       VALUES ($1,$2,$3,$4,$5,'published',$6)
       ON CONFLICT (slug) DO NOTHING`,
      [p.title, p.slug, p.body, p.excerpt, authorId, p.published_at]
    );
  }
  process.stdout.write('Seeded ' + posts.length + ' blog posts\n');
  process.exit(0);
}).catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
