/**
 * The content model of the website. Every page lists its editable fields here, with the
 * wording the site launched with as the default. The CMS builds its editor from this list,
 * and the site falls back to these defaults for anything not yet saved in the database.
 *
 * Text may contain live values in curly brackets, such as {earn} or {redeem}. They are filled in
 * from the programme settings when the page is shown, so numbers never go out of date.
 */

export interface ImageValue { src: string; alt: string; width: number; height: number }

type Base = { key: string; label: string; help?: string };
export type FieldDef =
  | (Base & { type: 'text' | 'textarea' | 'link' | 'color'; default: string })
  | (Base & { type: 'image'; default: ImageValue })
  | (Base & { type: 'list'; itemLabel: string; titleField: string; fields: FieldDef[]; default: Record<string, unknown>[] });

export interface GroupDef { id: string; label: string; help?: string; fields: FieldDef[] }
export interface PageDef { slug: string; title: string; path: string; description: string; groups: GroupDef[] }

/** Live values that can be used inside any text, written like {earn}. */
export const TOKENS: { token: string; label: string }[] = [
  { token: 'earn', label: 'Points earned per £1 (a number)' },
  { token: 'earn_label', label: 'Points earned per £1, as words (e.g. 1 point)' },
  { token: 'earn_elixir', label: 'Points earned per £1 (e.g. 1 Elixir Point)' },
  { token: 'redeem', label: 'Points that are worth £1' },
  { token: 'gbp1', label: 'One pound (£1)' },
  { token: 'window', label: 'Tier window in months' },
  { token: 'top_tier', label: 'Name of the highest tier' },
  { token: 'top_multiplier', label: 'Earn multiplier of the highest tier' },
  { token: 'first_cost', label: 'Points cost of the cheapest reward' },
  { token: 'brands', label: 'List of all brand names' },
];

const text = (key: string, label: string, def: string, help?: string): FieldDef => ({ type: 'text', key, label, default: def, help });
const area = (key: string, label: string, def: string, help?: string): FieldDef => ({ type: 'textarea', key, label, default: def, help });
const link = (key: string, label: string, def: string, help?: string): FieldDef => ({ type: 'link', key, label, default: def, help });
const color = (key: string, label: string, def: string, help?: string): FieldDef => ({ type: 'color', key, label, default: def, help });
const image = (key: string, label: string, def: ImageValue, help?: string): FieldDef => ({ type: 'image', key, label, default: def, help });
const list = (key: string, label: string, itemLabel: string, titleField: string, fields: FieldDef[], def: Record<string, unknown>[], help?: string): FieldDef =>
  ({ type: 'list', key, label, itemLabel, titleField, fields, default: def, help });

const seo = (title: string, description: string): GroupDef => ({
  id: 'seo', label: 'Search engines',
  help: 'What Google shows for this page. Keep the title under about 60 characters and the description under about 160.',
  fields: [text('title', 'Page title', title), area('description', 'Description', description)],
});

const intro = (title: string, text_: string): GroupDef => ({
  id: 'intro', label: 'Page heading',
  fields: [text('title', 'Heading', title), area('text', 'Intro text', text_)],
});

export const PAGES: PageDef[] = [
  // -------------------------------------------------------------------------
  {
    slug: 'site', title: 'Site-wide', path: '/', description: 'Header, footer, menu and brand logos used on every page.',
    groups: [
      {
        id: 'seo', label: 'Search engines and sharing',
        help: 'The default title and description for the whole site, used by the home page and anywhere a page has none of its own.',
        fields: [
          text('tagline', 'Tagline', 'One rewards balance across every Sparkthunder brand'),
          area('description', 'Description', 'Earn Elixir Points every time you shop across Sparkthunder brands and spend them anywhere in the family. Free to join, with tiers that reward loyalty.'),
        ],
      },
      {
        id: 'header', label: 'Header',
        fields: [
          image('mark', 'Logo mark', { src: '/elixir-mark.png', alt: '', width: 147, height: 200 }, 'The droplet next to the name. Leave the alt text empty, because the name beside it already says it.'),
          text('name_main', 'Name, bold part', 'Elixir'),
          text('name_light', 'Name, light part', 'Points'),
          text('strapline', 'Strapline under the name', 'Rewards programme'),
          text('signin', 'Sign in button', 'Sign in'),
          text('join', 'Join button', 'Join free'),
          text('business', 'For-business link', 'Elixir 360', 'A small link in the header (and footer) that leads to the business and partners section.'),
          link('business_href', 'For-business link address', '/business'),
          text('signout', 'Sign out button', 'Sign out'),
        ],
      },
      {
        id: 'nav', label: 'Menu',
        help: 'The links in the header and footer. The page address must start with a slash, like /faq.',
        fields: [
          list('items', 'Menu links', 'link', 'label', [text('label', 'Label', ''), link('href', 'Page address', '')], [
            { label: 'How it works', href: '/how-it-works' },
            { label: 'Tiers', href: '/tiers' },
            { label: 'Rewards', href: '/rewards' },
            { label: 'Brands', href: '/brands' },
            { label: 'FAQ', href: '/faq' },
          ]),
        ],
      },
      {
        id: 'footer', label: 'Footer',
        fields: [
          text('explore_heading', 'First column heading', 'Explore'),
          text('account_heading', 'Account column heading', 'Your account'),
          text('forgot', 'Forgot password link', 'Forgot password'),
          text('legal_heading', 'Legal column heading', 'Legal'),
          text('terms', 'Terms link', 'Terms'),
          text('privacy', 'Privacy link', 'Privacy'),
          text('family_heading', 'Family column heading', 'Part of the family'),
          area('family_text', 'Family text', 'Elixir Points is the rewards programme of the Sparkthunder family of brands.'),
          text('family_link', 'Family link label', 'My Sparkthunder'),
          text('copyright', 'Copyright name', 'Elixir Points'),
          text('staff', 'Staff link', 'Staff'),
        ],
      },
      {
        id: 'brands', label: 'Brand logos',
        help: 'How each brand looks on the site. The brand name must match a brand in the dashboard (its short name, such as knightverge). Which brands take part is controlled in the dashboard under Brands & Keys.',
        fields: [
          list('items', 'Brands', 'brand', 'slug', [
            text('slug', 'Short name', '', 'Lower case with dashes, exactly as in the dashboard.'),
            text('tagline', 'One-line description', ''),
            image('logo', 'Logo', { src: '', alt: '', width: 0, height: 0 }),
            color('tile', 'Tile colour behind the logo', '#ffffff', 'Pick a colour the logo reads clearly against.'),
            link('href', 'Website address', '', 'Optional. Shows a Visit link on the Brands page.'),
            area('about', 'About this brand', '', 'A short paragraph for the brand\'s own page on this site. If left empty, the one-line description is used.'),
          ], [
            { slug: 'sparkthunder-shop', tagline: 'The official Sparkthunder store', logo: { src: '/brands/sparkthunder-shop.png', alt: 'Sparkthunder Shop logo', width: 438, height: 120 }, tile: '#000000', href: 'https://sparkthunder.shop', about: 'The official Sparkthunder store, home to comics, games and merchandise from across the Sparkthunder family. Every order earns Elixir Points.' },
            { slug: 'knightverge', tagline: 'Comics, characters and the Knightverge universe', logo: { src: '/brands/knightverge.png', alt: 'Knightverge logo', width: 560, height: 125 }, tile: '#17130b', href: 'https://knightverge.com', about: 'Knightverge is the home of the Knightverge comic universe: characters, stories and a growing world to explore. Shop and earn Elixir Points along the way.' },
            { slug: 'roll-combat', tagline: 'Tabletop RPG games', logo: { src: '/brands/roll-combat.png', alt: 'Roll Combat logo', width: 560, height: 444 }, tile: '#ffffff', href: '', about: 'Roll Combat publishes tabletop role-playing games for players and game masters. Your Elixir Points travel with you from the table to the shop.' },
            { slug: 'miss-petty', tagline: 'Beauty and makeup', logo: { src: '/brands/miss-petty.png', alt: 'Miss Petty logo', width: 560, height: 247 }, tile: '#ffffff', href: '', about: 'Miss Petty is a beauty and makeup brand. Treat yourself and collect Elixir Points that you can spend across the whole Sparkthunder family.' },
          ]),
        ],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'home', title: 'Home', path: '/', description: 'The front page.',
    groups: [
      seo('Elixir Points: one rewards balance across every brand', 'Earn Elixir Points every time you shop across Sparkthunder brands and spend them anywhere in the family. Free to join, with tiers that reward loyalty.'),
      {
        id: 'hero', label: 'Top banner',
        fields: [
          text('eyebrow', 'Small line above the heading', 'Free to join'),
          text('title', 'Heading', 'One rewards balance. Every Sparkthunder brand.'),
          area('text', 'Text', 'Collect Elixir Points wherever you shop with us and spend them anywhere in the family.'),
          text('rewards_line', 'Rewards line', 'Rewards start at just {first_cost} points.', 'Only shown when at least one reward exists.'),
          text('primary', 'Main button', 'Join Elixir Points'),
          text('secondary', 'Second button', 'How it works'),
          text('phone_note', 'Note under the phone', 'Example balance'),
        ],
      },
      {
        id: 'brands', label: 'Brands strip',
        fields: [
          text('title', 'Heading', 'Brands that earn Elixir Points'),
          text('link', 'Link label', 'See all brands'),
          text('more', 'Last tile', 'More brands joining soon'),
        ],
      },
      {
        id: 'earn', label: 'Ways to earn',
        fields: [
          text('title', 'Section heading', 'Loads of ways to earn'),
          text('a_title', 'First card heading', 'Earn {earn_label} for every £1'),
          area('a_text', 'First card text', 'Shop at any participating brand and points land in one shared balance. Refunds take back only the points for the refunded amount.'),
          text('b_title', 'Second card heading', 'Climb the tiers, earn faster'),
          area('b_text', 'Second card text', 'Your tier follows what you spend over {window} months. Reach {top_tier} and every £1 earns {top_multiplier}x points.'),
          text('c_title', 'Third card heading', 'Shop as a guest, claim later'),
          area('c_text', 'Third card text', 'Points earned with your email while shopping as a guest are held for you and added to your balance when you join with that email.'),
        ],
      },
      {
        id: 'tiers', label: 'Tiers',
        help: 'The tiers themselves (names, spend and multipliers) are set in the dashboard under Settings.',
        fields: [
          text('title', 'Heading', 'Four tiers, faster points'),
          text('start', 'Text for the first tier', 'Where everyone starts'),
          text('suffix', 'Under each multiplier', 'points on every £1'),
          text('link', 'Link label', 'Compare the tiers'),
        ],
      },
      {
        id: 'spend', label: 'Spending points',
        fields: [
          text('title', 'Heading', 'Spend points on the things you love'),
          area('text', 'Text', '{redeem} points are worth {gbp1}. Choose a reward, get your code, use it at checkout.'),
          text('button', 'Button', 'See rewards'),
        ],
      },
      {
        id: 'faq', label: 'Questions strip (yellow)',
        fields: [
          text('title', 'Heading', 'The best of Elixir at a glance'),
          list('items', 'Questions', 'question', 'q', [text('q', 'Heading', ''), area('a', 'Answer', '')], [
            { q: 'One balance for every brand', a: 'Every point you earn at any participating Sparkthunder brand lands in the same balance, and you can spend it at any of them.' },
            { q: 'Tiers that reward loyalty', a: 'The more you spend over a rolling window, the higher your tier. Each tier earns points faster than the last.' },
            { q: 'Single-use reward codes', a: 'Choose a reward and you get a single-use code to enter at checkout. Each code works once, so it cannot be reused.' },
            { q: 'Guest purchases count too', a: 'Shopped as a guest? Points earned with your email are held for you and added when you join with that same verified email.' },
          ]),
          text('link', 'Link label', 'More questions answered'),
        ],
      },
      {
        id: 'cta', label: 'Closing call to action',
        fields: [text('title', 'Heading', 'Sign up now, start collecting points'), text('button', 'Button', 'Join Elixir Points')],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'how-it-works', title: 'How it works', path: '/how-it-works', description: 'The four steps.',
    groups: [
      seo('How Elixir Points works', 'Earn Elixir Points on every Sparkthunder brand purchase, climb the tiers for faster points, and redeem them for rewards at checkout. Here is exactly how it works.'),
      intro('How Elixir Points works', 'One balance, every Sparkthunder brand. Four simple steps.'),
      {
        id: 'steps', label: 'Steps',
        fields: [
          list('items', 'Steps', 'step', 'h', [text('h', 'Heading', ''), area('t', 'Text', '')], [
            { h: '1. Join for free', t: 'Create a free account, or use your existing My Sparkthunder login, which is the same account. Shop as a guest if you like: points earned with your email are waiting for you when you join.' },
            { h: '2. Earn points when you shop', t: 'You earn {earn_elixir} for every £1 you spend, before any tier bonus. Points are added to one balance, whichever Sparkthunder brand you bought from. If an order is refunded, the points for the refunded amount are taken back.' },
            { h: '3. Climb the tiers', t: 'Your tier is based on what you have spent in the last {window} months. Each tier earns points faster than the last, up to {top_multiplier}x at {top_tier}.' },
            { h: '4. Spend points on rewards', t: 'Every {redeem} points are worth {gbp1}. Pick a reward and you get a single-use code to use at checkout.' },
          ]),
        ],
      },
      { id: 'links', label: 'Links at the bottom', fields: [text('tiers', 'First link', 'Compare the tiers'), text('rewards', 'Second link', 'Browse rewards'), text('faq', 'Third link', 'Read the FAQ')] },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'tiers', title: 'Tiers', path: '/tiers', description: 'Tier comparison.',
    groups: [
      seo('Elixir Points tiers', 'Compare the Elixir Points tiers. The more you spend across Sparkthunder brands, the higher your tier and the faster you earn points.'),
      intro('Elixir Points tiers', 'Spend more across Sparkthunder brands in a {window}-month window and you move up, earning points faster.'),
      {
        id: 'cards', label: 'Tier cards', help: 'Tier names, spend levels, multipliers and perks are set in the dashboard under Settings.',
        fields: [
          text('start', 'Text for the first tier', 'Everyone starts here'),
          text('spend', 'Text for other tiers', 'Spend {amount} in {window} months', 'Use {amount} where the spend should appear.'),
          text('suffix', 'After the multiplier', 'points on every £1'),
          text('button', 'Button', 'Join free and start earning'),
        ],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'rewards', title: 'Rewards', path: '/rewards', description: 'Reward catalogue.',
    groups: [
      seo('Elixir Points rewards', 'See what your Elixir Points can buy: discounts, free shipping and more across Sparkthunder brands, with the points cost of each reward.'),
      intro('Elixir Points rewards', 'Every {redeem} points are worth {gbp1}. Pick a reward and use the code at checkout.'),
      {
        id: 'list', label: 'Reward cards', help: 'The rewards themselves are set in the dashboard under Rewards.',
        fields: [
          area('empty', 'Text when there are no rewards', 'New rewards are on the way. Join free and we will have them ready for you.'),
          text('worth', 'Worth label', 'worth {amount}', 'Use {amount} where the pound value should appear.'),
          text('any_brand', 'Where it can be used (any brand)', 'Use at any participating brand'),
          text('one_brand', 'Where it can be used (one brand)', 'Use at {brand}', 'Use {brand} where the brand name should appear.'),
          text('button', 'Button', 'Join free'),
        ],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'faq', title: 'FAQ', path: '/faq', description: 'Frequently asked questions.',
    groups: [
      seo('Elixir Points FAQ', 'Answers to common questions about Elixir Points: how you earn, what points are worth, how tiers work, and how to redeem rewards.'),
      intro('Elixir Points FAQ', 'Quick answers about earning, tiers and rewards.'),
      {
        id: 'items', label: 'Questions',
        fields: [
          list('items', 'Questions and answers', 'question', 'q', [text('q', 'Question', ''), area('a', 'Answer', '')], [
            { q: 'How do I earn Elixir Points?', a: 'You earn {earn_label} for every £1 you spend at a participating Sparkthunder brand. Your tier can multiply this, up to {top_multiplier}x at {top_tier}.' },
            { q: 'What are Elixir Points worth?', a: '{redeem} points are worth {gbp1} when you redeem them for a reward.' },
            { q: 'Is it free to join?', a: 'Yes. Joining Elixir Points is free, and your My Sparkthunder account works as your Elixir Points account.' },
            { q: 'Can I earn points as a guest?', a: 'Yes. Points earned with your email address are held for you and added to your balance when you join with that same email.' },
            { q: 'How do tiers work?', a: 'Your tier depends on how much you have spent in the last {window} months across all participating brands. Spend more and you move up to a tier that earns points faster.' },
            { q: 'How do I use my points?', a: 'Choose a reward and you receive a single-use code to enter at checkout at a participating brand.' },
            { q: 'What happens if I return an order?', a: 'The points earned on the refunded amount are taken back from your balance.' },
            { q: 'Which brands take part?', a: '{brands}. More brands will join over time.' },
          ]),
        ],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'brands', title: 'Brands', path: '/brands', description: 'Participating brands.',
    groups: [
      seo('Brands that earn Elixir Points', 'Earn and spend Elixir Points across Sparkthunder brands: Sparkthunder Shop, Knightverge, Roll Combat and Miss Petty. See every brand that takes part.'),
      intro('Brands that earn Elixir Points', 'Shop at any of these and your points go into one shared balance.'),
      {
        id: 'cards', label: 'Brand cards', help: 'Logos, descriptions and colours are in Site-wide, under Brand logos.',
        fields: [
          text('visit', 'Visit link', 'Visit {brand}', 'Use {brand} where the brand name should appear.'),
          text('partner', 'Description for partner brands without one', 'Partner brand'),
          text('owned', 'Description for our brands without one', 'Sparkthunder brand'),
          text('footnote', 'Note under the cards', 'More brands are joining over time, so your points will go even further.'),
          text('button', 'Button', 'Join free'),
        ],
      },
      {
        id: 'detail', label: 'Individual brand pages',
        help: 'The wording on each brand\'s own page. Use {brand} for the brand name and {brand_earn} for what it earns per £1 (its own rate, or the standard one). The description, logo and colour come from Site-wide, under Brand logos.',
        fields: [
          text('seo_title', 'Page title', 'Earn Elixir Points at {brand}'),
          text('seo_description', 'Page description', 'Shop at {brand} and earn Elixir Points you can spend across the whole Sparkthunder family. Free to join.'),
          text('back', 'Back link', 'All brands'),
          text('earn_title', 'Earn heading', 'Earn at {brand}'),
          area('earn_text', 'Earn text', 'Every order at {brand} earns {brand_earn} for every {gbp1} you spend, and higher tiers earn faster, up to {top_multiplier}x at {top_tier}.'),
          text('spend_title', 'Spend heading', 'Spend anywhere'),
          area('spend_text', 'Spend text', 'Your points go into one shared balance. {redeem} points are worth {gbp1}, and you can spend them at {brand} or any other brand in the family.'),
          text('rewards_title', 'Rewards heading', 'Rewards you can use at {brand}'),
          text('rewards_all', 'Label for rewards open to every brand', 'Any brand'),
          text('rewards_empty', 'Text when there are no rewards yet', 'New rewards are on their way. Check the rewards page soon.'),
          text('rewards_link', 'Link to all rewards', 'See all rewards'),
          text('join', 'Join button', 'Join free'),
        ],
      },
    ],
  },
  // -------------------------------------------------------------------------
  {
    slug: 'business', title: 'Elixir 360 (business)', path: '/business', description: 'The business and partners front page.',
    groups: [
      seo('Elixir 360: loyalty, insights and media for brands', 'Partner with Elixir Points. Give customers one rewards balance across brands, and learn what keeps them coming back. Elixir 360 is for brands and partners.'),
      {
        id: 'hero', label: 'Top banner',
        fields: [
          text('eyebrow', 'Small heading', 'Elixir 360 · Loyalty · Insights · Media · Growth'),
          text('title', 'Heading', 'Reach customers who love to come back'),
          area('text', 'Intro text', 'Elixir 360 is the business side of Elixir Points. Join our rewards coalition to give your customers one points balance they can earn and spend across brands, and learn what keeps them coming back.'),
          text('primary', 'Main button', 'Become a partner'),
          text('secondary', 'Second button', 'See what we offer'),
          text('dash_title', 'Dashboard picture: title', 'Partner view'),
          text('dash_note', 'Dashboard picture: note', 'Illustrative example, not real data'),
        ],
      },
      {
        id: 'offer', label: 'What we offer',
        fields: [
          text('title', 'Section heading', 'Three ways to grow with Elixir'),
          list('items', 'Cards', 'card', 'title', [
            link('href', 'Page address', ''), text('status', 'Label', ''), text('title', 'Title', ''), area('text', 'Text', ''),
          ], [
            { href: '/business/loyalty', status: 'Available now', title: 'Loyalty', text: 'Let customers earn and spend Elixir Points with your brand, in their own currency, with refunds handled automatically.' },
            { href: '/business/insights', status: 'Coming soon', title: 'Insights', text: 'Understand repeat purchases and loyalty across the coalition, with customer permission, through a partner dashboard.' },
            { href: '/business/media', status: 'Coming soon', title: 'Media', text: 'Put your brand in front of Elixir members with featured placements and offers across our sites and emails.' },
          ]),
          text('more', 'Link under each card', 'Find out more'),
        ],
      },
      {
        id: 'packages', label: 'Partner packages',
        fields: [
          text('title', 'Section heading', 'Choose how you take part'),
          text('text', 'Intro', 'Pricing is agreed with each partner, based on size, integration and campaign volume.'),
          list('items', 'Packages', 'package', 'title', [text('status', 'Label', ''), text('title', 'Title', ''), area('text', 'Text', '')], [
            { status: 'Available now', title: 'Elixir Partner', text: 'For businesses that want to offer customers Elixir Points when they buy.' },
            { status: 'In development', title: 'Elixir Growth', text: 'Points plus promotions, customer acquisition and campaign management.' },
            { status: 'Coming soon', title: 'Elixir 360 Enterprise', text: 'For larger brands: advertising, audience activation, measurement, insights and strategic partnerships.' },
          ]),
        ],
      },
      {
        id: 'ways', label: 'Ways to take part',
        fields: [
          text('title', 'Section heading', 'Ways to take part'),
          list('items', 'Types', 'type', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], [
            { title: 'Earn partner', text: 'Customers earn Elixir Points when they buy from you.' },
            { title: 'Redemption partner', text: 'Customers spend Elixir Points with you.' },
            { title: 'Earn and redeem', text: 'Both: points in, points out, one relationship.' },
            { title: 'Strategic partner', text: 'Larger arrangements covering co-marketing, campaigns, insight and distribution.' },
          ]),
        ],
      },
      {
        id: 'why', label: 'Why Elixir',
        fields: [
          text('title', 'Section heading', 'Why partner with Elixir'),
          list('items', 'Reasons', 'reason', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], [
            { title: 'One currency, many brands', text: 'Points earned with one brand can be spent with another, so every partner benefits from customers who are already collecting.' },
            { title: 'Built for a global audience', text: 'Customers earn in their own currency, with local earn rates and values, so Elixir works wherever you sell.' },
            { title: 'Simple to connect', text: 'Your website sends us each order and refund through a secure server-to-server connection. No customer payment details ever reach us.' },
            { title: 'Privacy first', text: 'Customer data is only used with their permission, and every point is recorded in a tamper-proof ledger you can audit.' },
          ]),
        ],
      },
      {
        id: 'steps', label: 'How partnering works',
        fields: [
          text('title', 'Section heading', 'How partnering works'),
          list('items', 'Steps', 'step', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], [
            { title: 'Talk to us', text: 'Tell us about your brand and what you would like to achieve. We will come back to you to find the right fit.' },
            { title: 'Connect', text: 'We set you up with your own secure key and help your developers send orders and refunds to Elixir.' },
            { title: 'Launch and grow', text: 'Your customers start earning straight away. We track every point issued and redeemed for your brand, so you always know where you stand.' },
          ]),
        ],
      },
      { id: 'family', label: 'Brands strip', fields: [text('title', 'Heading', 'Already in the family'), text('text', 'Text', 'These brands already earn Elixir Points.')] },
      { id: 'cta', label: 'Closing call to action', fields: [text('title', 'Heading', 'Ready to talk?'), text('text', 'Text', 'Tell us about your brand and we will be in touch.'), text('button', 'Button', 'Become a partner')] },
    ],
  },
  // -------------------------------------------------------------------------
  ...[
    {
      slug: 'business-loyalty', title: 'Elixir 360: Loyalty', path: '/business/loyalty', name: 'Loyalty', status: 'Available now', interest: 'loyalty',
      pageTitle: 'Loyalty for brands | Elixir 360', pageDesc: 'Let customers earn and spend Elixir Points with your brand, in their own currency. Refunds, guests and rewards handled for you.',
      text: 'Give customers a reason to come back, with points they can spend across the whole Elixir family.',
      benefitsTitle: 'What you get',
      benefits: [
        { title: 'Points on every order', text: 'Customers earn Elixir Points when they buy from you, at a rate we agree together.' },
        { title: 'Refunds handled for you', text: 'If an order is refunded, the points earned on it are taken back automatically.' },
        { title: 'Guests included', text: 'Points earned with just an email address are held until the customer joins, so no purchase is wasted.' },
        { title: 'Any currency', text: 'Earn rates and values are set per currency, so customers see something that makes sense where they live.' },
        { title: 'Rewards that bring them back', text: 'Members spend points on rewards. Every redemption is a single-use code, tracked from issue to use.' },
      ],
      stepsTitle: 'How it works',
      steps: [
        { title: 'Connect', text: 'Your website sends us each order through a secure key we give you.' },
        { title: 'Earn', text: 'The customer earns points on what they paid, in their own currency, and sees them in their Elixir account.' },
        { title: 'Redeem', text: 'They spend points on rewards across the family, including with you.' },
      ],
      servicesTitle: 'Everything a loyalty programme needs',
      services: [
        { title: 'Currency', text: 'Elixir Points are the one currency. You choose the earn rate for your brand, in each currency you sell in, and members spend them on rewards across the family.' },
        { title: 'Programme management', text: 'We run the points ledger, balances, tiers and refunds, so you do not have to build or maintain a loyalty system.' },
        { title: 'Simple integration', text: 'Your site sends each order and refund to us through a secure key. We give you the key and help your developers connect it.' },
        { title: 'Partnership marketing', text: 'Run bonus-points offers with us, such as a double-points week on a product, to bring customers back at the right time.' },
      ],
      note: 'Loyalty is live across the Sparkthunder family. We are opening it up to outside partners gradually, so get in touch to talk about your brand.',
    },
    {
      slug: 'business-insights', title: 'Elixir 360: Insights', path: '/business/insights', name: 'Insights', status: 'Coming soon', interest: 'insights',
      pageTitle: 'Customer insights for brands | Elixir 360', pageDesc: 'Understand repeat purchases and loyalty across the Elixir coalition, with customer permission. Insights for Elixir 360 partners, coming soon.',
      text: 'See what keeps customers coming back, using shopping patterns shared with their permission.',
      benefitsTitle: 'What you will be able to see',
      benefits: [
        { title: 'What keeps customers coming back', text: 'Repeat purchase patterns for your brand and across the coalition.' },
        { title: 'Who your customers are', text: 'Audience groups built from shopping behaviour, shown as groups rather than individuals.' },
        { title: 'How your offers perform', text: 'Compare the sales around a bonus-points offer with a normal week.' },
        { title: 'Privacy by design', text: 'Insights use only data customers have agreed to share.' },
      ],
      stepsTitle: 'How it will work',
      steps: [
        { title: 'Members opt in', text: 'Customers choose whether their shopping can be used for insights.' },
        { title: 'We bring it together', text: 'Orders from across the coalition are combined into one picture.' },
        { title: 'You act on it', text: 'Use what you learn to plan offers, launches and campaigns.' },
      ],
      servicesTitle: '',
      services: [],
      note: 'Insights are in development. Early partners will help shape them, so tell us what you would want to see.',
    },
    {
      slug: 'business-media', title: 'Elixir 360: Media', path: '/business/media', name: 'Media', status: 'Coming soon', interest: 'media',
      pageTitle: 'Reach Elixir members | Elixir 360 media', pageDesc: 'Put your brand in front of Elixir members with featured placements and offers across our sites and emails. Elixir 360 media is coming soon.',
      text: 'Put your brand in front of people who already collect Elixir Points.',
      benefitsTitle: 'What you will be able to do',
      benefits: [
        { title: 'Featured placements', text: 'Show your brand or a new launch on Elixir and partner sites.' },
        { title: 'Targeted offers', text: 'Send members an offer that matches what they like, such as bonus points on a product.' },
        { title: 'Bonus-points campaigns', text: 'Run double-points weeks that bring customers in at the right moment.' },
        { title: 'Results you can measure', text: 'See what a campaign delivered, from views to sales.' },
      ],
      stepsTitle: 'How it will work',
      steps: [
        { title: 'Pick your goal', text: 'Launch something, win back customers or clear stock.' },
        { title: 'Choose your audience', text: 'Reach members who fit, using only information they have agreed to share.' },
        { title: 'Launch and learn', text: 'Go live, then see what worked.' },
      ],
      servicesTitle: '',
      services: [],
      note: 'Media is in development. Tell us what you would like to promote and we will let you know as it opens.',
    },
  ].map((d): PageDef => ({
    slug: d.slug, title: d.title, path: d.path, description: `The ${d.name} page for business partners.`,
    groups: [
      seo(d.pageTitle, d.pageDesc),
      intro(d.name, d.text),
      { id: 'status', label: 'Status label', fields: [text('label', 'Label shown at the top', d.status, 'For example Available now or Coming soon.')] },
      {
        id: 'benefits', label: 'What partners get',
        fields: [
          text('title', 'Section heading', d.benefitsTitle),
          list('items', 'Benefits', 'benefit', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], d.benefits),
        ],
      },
      {
        id: 'services', label: 'Services (leave empty to hide)',
        fields: [
          text('title', 'Section heading', d.servicesTitle),
          list('items', 'Services', 'service', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], d.services),
        ],
      },
      {
        id: 'steps', label: 'How it works',
        fields: [
          text('title', 'Section heading', d.stepsTitle),
          list('items', 'Steps', 'step', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], d.steps),
        ],
      },
      { id: 'note', label: 'Good to know', fields: [area('text', 'Note', d.note)] },
      { id: 'cta', label: 'Call to action', fields: [text('title', 'Heading', 'Interested in ' + d.name + '?'), text('button', 'Button', 'Talk to us'), text('back', 'Link back to the overview', 'Back to Elixir 360')] },
    ],
  })),
  // -------------------------------------------------------------------------
  {
    slug: 'business-about', title: 'Elixir 360: About', path: '/business/about', description: 'About Elixir 360 and the Elixir Points programme.',
    groups: [
      seo('About Elixir 360', 'Elixir 360 is the business side of Elixir Points, the rewards programme of the Sparkthunder family of brands.'),
      intro('About Elixir 360', 'Elixir 360 is the business side of Elixir Points, the rewards programme of the Sparkthunder family of brands.'),
      {
        id: 'story', label: 'Our story',
        fields: [
          text('title', 'Heading', 'One rewards balance, many brands'),
          area('text', 'Text', 'Elixir Points began inside the Sparkthunder family, where comics, beauty, games and a shop all share one set of customers who love what they do. One points balance across all of them means every purchase has a reason to lead to the next. Elixir 360 opens that idea up to partners.'),
        ],
      },
      {
        id: 'what', label: 'What we do',
        fields: [
          text('title', 'Heading', 'What we do'),
          list('items', 'Points', 'point', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], [
            { title: 'We run the loyalty programme', text: 'Points, tiers, rewards and refunds, run for you.' },
            { title: 'We connect brands and customers', text: 'Members earn with one brand and spend with another.' },
            { title: 'We build for the long term', text: 'Insights and media services are being built on the same foundation, with customer permission at the centre.' },
          ]),
        ],
      },
      {
        id: 'principles', label: 'How we work',
        fields: [
          text('title', 'Heading', 'How we work'),
          list('items', 'Principles', 'principle', 'title', [text('title', 'Title', ''), area('text', 'Text', '')], [
            { title: 'Honest about what is live', text: 'We tell you plainly what is available now and what is still being built.' },
            { title: 'Privacy first', text: 'Customer data is only used with permission, and no payment details ever reach us.' },
            { title: 'Every point accounted for', text: 'Points live in a tamper-proof ledger that can be audited.' },
          ]),
        ],
      },
      { id: 'cta', label: 'Call to action', fields: [text('title', 'Heading', 'Want to work with us?'), text('button', 'Button', 'Become a partner')] },
    ],
  },
  {
    slug: 'business-contact', title: 'Elixir 360: Become a partner', path: '/business/contact', description: 'The enquiry form for businesses and partners.',
    groups: [
      seo('Become an Elixir 360 partner', 'Tell us about your brand and what you would like to achieve with Elixir 360. We read every message and reply by email.'),
      intro('Become a partner', 'Tell us about your brand and what you would like to achieve with Elixir 360. We read every message and reply by email.'),
      {
        id: 'form', label: 'The form',
        fields: [
          text('company', 'Company label', 'Company'),
          text('name', 'Name label', 'Your name'),
          text('email', 'Email label', 'Work email'),
          text('website', 'Website label', 'Website (optional)'),
          text('interests', 'Interests heading', 'What are you interested in?'),
          text('interest_loyalty', 'Option: Loyalty', 'Loyalty'),
          text('interest_insights', 'Option: Insights', 'Insights'),
          text('interest_media', 'Option: Media', 'Media'),
          text('interest_other', 'Option: other', 'Something else'),
          text('message', 'Message label', 'How can we help?'),
          text('submit', 'Send button', 'Send enquiry'),
          text('consent', 'Small print', 'We will only use your details to reply to your enquiry.'),
        ],
      },
      {
        id: 'done', label: 'After sending',
        fields: [
          text('title', 'Thank-you heading', 'Thank you'),
          text('text', 'Thank-you text', 'We have your message and will be in touch by email soon.'),
          text('limit', 'Too many enquiries message', 'You have already sent a few enquiries today. Please wait for our reply, or try again tomorrow.'),
          text('error', 'Something went wrong message', 'Something went wrong sending your enquiry. Please try again in a moment.'),
        ],
      },
    ],
  },
];

export const PAGE_BY_SLUG: Record<string, PageDef> = Object.fromEntries(PAGES.map((p) => [p.slug, p]));

/** Every field of a page as a flat map of 'group.field' to its default value. */
export function defaultsOf(def: PageDef): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const g of def.groups) for (const f of g.fields) out[`${g.id}.${f.key}`] = f.default;
  return out;
}
