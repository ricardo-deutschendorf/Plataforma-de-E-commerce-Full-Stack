const pasteModel = require('../../models/pasteModel');

const seedPastes = [
  {
    title: 'Welcome to Pasteboard',
    language: 'text',
    content: 'Create your first snippet and keep useful code in one place.'
  }
];

async function seed() {
  const existing = await pasteModel.findAll();
  if (existing.length > 0) {
    console.log('Seed skipped: pastes already exist.');
    return;
  }

  for (const paste of seedPastes) {
    const now = new Date().toISOString();
    await pasteModel.create({ ...paste, createdAt: now, updatedAt: now });
  }
  console.log(`Seed complete: ${seedPastes.length} paste created.`);
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { seed };
