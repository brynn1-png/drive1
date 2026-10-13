const test = require('node:test');
const assert = require('node:assert/strict');
const NoteFormat = require('../js/note-format.js');

test('plain text becomes editor content without losing special characters or line breaks', () => {
  const delta = NoteFormat.fromPlainText('A < B\nNext line');
  assert.equal(NoteFormat.toText(delta), 'A < B\nNext line');
  assert.equal(NoteFormat.toHtml(delta), 'A &lt; B<br>Next line');
});

test('bold and highlight render while untrusted markup and unsupported formats do not', () => {
  const delta = { ops: [
    { insert: '<script>alert(1)</script>', attributes: { bold: true, link: 'javascript:evil' } },
    { insert: ' yellow', attributes: { background: '#fff2a8' } },
    { insert: { image: 'https://example.com/a.png' } },
    { insert: '\n' },
  ] };
  assert.equal(NoteFormat.toText(delta), '<script>alert(1)</script> yellow');
  assert.equal(NoteFormat.toHtml(delta), '<strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong><mark> yellow</mark>');
});

test('empty and malformed content is safe to display', () => {
  assert.equal(NoteFormat.toHtml(null), '');
  assert.equal(NoteFormat.toText({ ops: [{ insert: { video: 'bad' } }] }), '');
});

test('editor input keeps only supported text and formatting', () => {
  assert.deepEqual(NoteFormat.clean({ ops: [
    { insert: 'Safe', attributes: { bold: true, link: 'javascript:bad', background: 'red' } },
    { insert: { image: 'https://example.com/pic.png' } },
  ] }), { ops: [{ insert: 'Safe', attributes: { bold: true } }, { insert: '\n' }] });
});
