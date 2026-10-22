// All the words on the site live here, so they can be changed without
// touching layout code. Every block has a `story` version (default, for
// everyone) and a `tech` version (for developers). Where tech is missing,
// the story copy is shown in both modes.

export const links = {
  // Placeholder: swap for the real calendar booking page.
  bookDemo: '#book-a-demo',
  socials: [
    { label: 'x', href: '#' },
    { label: 'github', href: '#' },
    { label: 'linkedin', href: '#' },
  ],
};

// Placeholder waitlist. The form uses Netlify Forms, which works as soon as the
// site is deployed on Netlify and exports to CSV. To use another tool, set
// `action` to its endpoint (it receives a POST with an `email` field).
export const waitlist = {
  formName: 'waitlist',
  action: '',
};

export const meta = {
  title: 'kitchen · pick an app. we\'ll do the cooking.',
  description:
    'Kitchen turns open-source software into apps that run on your own laptop. No setup. No terminal. Your data stays home.',
};

export const nav = [
  { label: '~/menu', href: '#menu' },
  { label: './how-it-works', href: '#how-it-works' },
  { label: './for-teams', href: '#for-teams' },
];

export const hero = {
  label: '// local-first apps · mac · private beta',
  story: {
    title: ['pick an app.', 'we\'ll do the cooking.'],
    body: 'Kitchen turns open-source software into apps that run on your own laptop. No setup. No terminal. Your data stays home.',
  },
  tech: {
    title: ['run any repo locally.', 'zero deploy scripts.'],
    body: 'GitHub URL in, running app out. Env vars, databases and API keys handled. Local-first, Mac today.',
  },
  cta: '$ join the waitlist',
  demo: 'book a demo →',
  art: 'a steaming coffee mug made of binary digits',
};

export const statusBar = {
  mode: 'NORMAL',
  branch: 'kitchen ~ main',
  middle: '3 apps on the stove',
  right: 'offline ✓ · 0 MB sent to cloud',
};

export const statusWords = ['brewing…', 'soaking…', 'frying…', 'simmering…', 'served ✓'];

export const problem = {
  label: '// 00 the problem',
  story: {
    title: ['the best software on the internet is free.', 'using it takes a developer and an afternoon.'],
    body: 'Thousands of great tools live on GitHub. Most people never get to use them, because setting one up means a terminal, a database and a README written for someone else.',
  },
  tech: {
    title: ['readme archaeology.', 'dependency hell. missing .env.'],
    body: 'Every repo ships its own setup ritual: version managers, Docker files, Postgres, three API keys and a step the README forgot.',
  },
  joke: '$ npm start\nerror: missing .env (see README, step 7 of 4)',
};

export const howItWorks = {
  label: '// 01 the recipe',
  story: { title: ['pick a dish.', 'we prep it. dinner\'s ready.'] },
  tech: { title: ['catalog or URL in.', 'running app out.'] },
  steps: [
    {
      n: '// 01',
      art: 'fruit-bowl',
      alt: 'a bowl of fruit made of binary digits',
      story: { title: 'pick a dish', body: 'Choose an app from our menu, or paste a link to any open-source project.' },
      tech: { title: 'catalog or URL', body: 'Pick from the catalog or paste any public GitHub repo. We read the stack from the repo itself.' },
    },
    {
      n: '// 02',
      art: 'board',
      alt: 'a knife and chopping board made of binary digits',
      story: { title: 'we prep it', body: 'Kitchen sets up everything it needs: databases, passwords, connections to tools like OpenAI.' },
      tech: { title: 'auto-provisioning', body: 'Runtimes, dependencies, databases, env vars and API keys are provisioned in a local sandbox. No deploy scripts.' },
    },
    {
      n: '// 03',
      art: 'dish',
      alt: 'a plated dish seen from above, made of binary digits',
      story: { title: 'dinner\'s ready', body: 'It opens like any other app on your laptop. Share it with your team in one click.' },
      tech: { title: 'run + one-click share', body: 'Served on localhost. Share the full setup, config included, with one click.' },
    },
  ],
  terminal: '$ kitchen cook github.com/you/app\n  brewing… soaking… frying…\n  ✓ served on localhost:3000',
};

// Placeholder menu: example open-source apps, to be replaced with the real catalog.
export const menu = {
  label: '// 02 on the menu',
  story: { title: ['things you can run today.'], body: 'A few dishes from the menu. More every week.' },
  tech: { title: ['the catalog.'], body: 'Curated repos with tested recipes. Or bring your own URL.' },
  items: [
    { category: 'chat', name: 'Private AI chat', story: 'Talk to AI models without sending your chats anywhere.', repo: 'open-webui/open-webui', stack: 'python · svelte', size: '~1.2 GB' },
    { category: 'documents', name: 'Paper archive', story: 'Scan, search and file every document you own.', repo: 'paperless-ngx/paperless-ngx', stack: 'django · postgres', size: '~800 MB' },
    { category: 'automation', name: 'Workflow robot', story: 'Connect your tools and let the boring stuff run itself.', repo: 'n8n-io/n8n', stack: 'node · sqlite', size: '~600 MB' },
    { category: 'numbers', name: 'Team dashboards', story: 'Ask questions of your spreadsheets and get charts back.', repo: 'metabase/metabase', stack: 'clojure · h2', size: '~500 MB' },
  ],
  more: '+ any open-source project you paste in',
};

export const table = {
  label: '// 03 who\'s at the table',
  story: { title: ['everyone gets a seat.'] },
  tech: { title: ['use cases.'] },
  art: 'a long table with plates, seen from above, made of binary digits',
  seats: [
    { who: 'the lawyer', story: 'Runs a document tool on client files without uploading a single page.', tech: 'Offline sandbox for sensitive documents.' },
    { who: 'the finance team', story: 'Gets the dashboard they asked IT for, this afternoon.', tech: 'Internal tools without a ticket to platform.' },
    { who: 'the ops lead', story: 'Sets up the team\'s new app once, then shares it with everyone.', tech: 'One-click share of the full setup.' },
    { who: 'the builder', story: 'Sends a link and people actually use what they made.', tech: 'Ship builds to non-devs without hosting them.' },
  ],
};

export const houseRules = {
  label: '// 04 house rules',
  story: {
    title: ['home cooking.', 'your data stays home.'],
    body: 'Runs on your laptop. Works offline. Nothing gets uploaded.',
  },
  tech: {
    title: ['local-first.', 'no telemetry on your data.'],
    body: 'Apps run in an offline sandbox on your machine. Your files, keys and databases never leave it.',
  },
  receipt: [
    ['apps cooked', '3'],
    ['files uploaded', '0'],
    ['data sent to cloud', '0 MB'],
  ],
  art: 'a sealed jar made of binary digits',
};

export const chefsTable = {
  label: '// 05 chef\'s table',
  story: {
    title: ['rolling out to a team?', 'we\'ll cook with you.'],
    body: 'We work closely with a few teams in law, finance and banking to bring Kitchen in safely. Tell us what you need and we\'ll set the table.',
  },
  tech: {
    title: ['design partners.', 'enterprise packs.'],
    body: 'Design partner program with SSO, managed catalogs, and audit-friendly local deployment for regulated teams.',
  },
  cta: '$ book a demo',
};

export const reserve = {
  label: '// 06 reserve a table',
  story: { title: ['save your seat.', 'we\'ll ring the dinner bell.'] },
  tech: { title: ['get early access.', 'mac first.'] },
  placeholder: 'you@company.com',
  button: '⏎ reserve',
  thanks: 'table reserved ✓ we\'ll ring the bell when it\'s ready.',
  error: 'something burnt. try again?',
  art: 'a dinner bell made of binary digits',
};

export const footer = {
  links: [
    { label: '~/menu', href: '#menu' },
    { label: './how-it-works', href: '#how-it-works' },
    { label: './for-teams', href: '#for-teams' },
    { label: './house-rules', href: '#house-rules' },
  ],
  signoff: 'made with love and a little too much garlic',
};
