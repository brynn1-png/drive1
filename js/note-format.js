const NoteFormat = {
  fromPlainText(text) {
    return { ops: [{ insert: String(text || '') + '\n' }] };
  },

  clean(delta) {
    const ops = (Array.isArray(delta?.ops) ? delta.ops : []).flatMap((op) => {
      if (typeof op.insert !== 'string') return [];
      const attributes = {};
      if (op.attributes?.bold === true) attributes.bold = true;
      if (op.attributes?.background === '#fff2a8') attributes.background = '#fff2a8';
      return [Object.keys(attributes).length ? { insert: op.insert, attributes } : { insert: op.insert }];
    });
    if (!ops.length || !ops[ops.length - 1].insert.endsWith('\n')) ops.push({ insert: '\n' });
    return { ops };
  },

  toText(delta) {
    const text = (delta?.ops || []).map((op) => typeof op.insert === 'string' ? op.insert : '').join('');
    return text.endsWith('\n') ? text.slice(0, -1) : text;
  },

  toHtml(delta) {
    const ops = delta?.ops || [];
    const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let html = ops.map((op) => {
      if (typeof op.insert !== 'string') return '';
      let value = escape(op.insert);
      if (op.attributes?.bold) value = `<strong>${value}</strong>`;
      if (op.attributes?.background === '#fff2a8') value = `<mark>${value}</mark>`;
      return value;
    }).join('');
    if (html.endsWith('\n')) html = html.slice(0, -1);
    return html.replace(/\n/g, '<br>');
  },
};

if (typeof module !== 'undefined') module.exports = NoteFormat;
