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
          ], [
            { slug: 'sparkthunder-shop', tagline: 'The official Sparkthunder store', logo: { src: '/brands/sparkthunder-shop.png', alt: 'Sparkthunder Shop logo', width: 438, height: 120 }, tile: '#000000', href: 'https://sparkthunder.shop' },
            { slug: 'knightverge', tagline: 'Comics, characters and the Knightverge universe', logo: { src: '/brands/knightverge.png', alt: 'Knightverge logo', width: 560, height: 125 }, tile: '#17130b', href: 'https://knightverge.com' },
            { slug: 'roll-combat', tagline: 'Tabletop RPG games', logo: { src: '/brands/roll-combat.png', alt: 'Roll Combat logo', width: 560, height: 444 }, tile: '#ffffff', href: '' },
            { slug: 'miss-petty', tagline: 'Beauty and makeup', logo: { src: '/brands/miss-petty.png', alt: 'Miss Petty logo', width: 560, height: 247 }, tile: '#ffffff', href: '' },
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
