const assert = require('node:assert/strict');

const {
    parseFrontmatter,
    resolveAssistants,
    resolveAgentsForDomain,
    loadLocalDomains
} = require('../index.js');

async function run() {
    const content = [
        '---',
        'name: sample-agent',
        'skills:',
        '  - development/code-review',
        '  - development/qa-testing',
        '---',
        '',
        '# Role',
        'Body text'
    ].join('\n');

    const parsed = parseFrontmatter(content);
    assert.deepEqual(parsed.skills, ['development/code-review', 'development/qa-testing']);
    assert.equal(parsed.mdContent, '# Role\nBody text');

    assert.deepEqual(resolveAssistants('all'), ['cursor', 'claude', 'copilot']);
    assert.deepEqual(resolveAssistants('cursor'), ['cursor']);

    const domains = loadLocalDomains();
    assert.ok(Array.isArray(domains.game));
    assert.ok(domains.game.includes('game-architect'));

    const gameAgents = await resolveAgentsForDomain('game', true);
    assert.ok(Array.isArray(gameAgents));
    assert.ok(gameAgents.includes('game-architect'));

    console.log('All tests passed.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
