import h5wasm from 'h5wasm';

function readIndex(group) {
  let indexDatasetName = '_index';
  try {
    const indexAttr = group.get_attribute('_index', true);
    if (typeof indexAttr === 'string') {
      indexDatasetName = indexAttr;
    }
  } catch {
    // Fall back to '_index' dataset name
  }
  const indexDataset = group.get(indexDatasetName);
  if (indexDataset && 'json_value' in indexDataset) {
    const val = indexDataset.json_value;
    if (Array.isArray(val)) return val.map(String);
  }
  throw new Error(`Could not read index from group at ${group.path}`);
}

function readColumn(parentGroup, name) {
  const item = parentGroup.get(name);
  if (!item) throw new Error(`Column "${name}" not found in ${parentGroup.path}`);

  // Categorical column: stored as Group with codes + categories
  if ('keys' in item && typeof item.keys === 'function') {
    const groupKeys = item.keys();
    if (groupKeys.includes('codes') && groupKeys.includes('categories')) {
      const codes = item.get('codes')?.json_value;
      const categories = item.get('categories')?.json_value;
      if (!Array.isArray(codes) || !Array.isArray(categories)) {
        throw new Error(`Unexpected format for categorical column "${name}"`);
      }
      return codes.map((code) => (code < 0 ? '' : categories[code]));
    }
  }

  // Plain dataset
  if ('json_value' in item) {
    const val = item.json_value;
    if (Array.isArray(val)) return val;
  }
  throw new Error(`Could not read column "${name}" from ${parentGroup.path}`);
}

export async function loadH5adFile(buffer) {
  const { FS } = await h5wasm.ready;
  const filename = 'upload.h5ad';
  FS.writeFile(filename, new Uint8Array(buffer));
  const { File: H5File } = await import('h5wasm');

  let file = null;
  try {
    file = new H5File(filename, 'r');

    const obsGroup = file.get('obs');
    if (!obsGroup) throw new Error('Missing /obs group');
    const participantIds = readIndex(obsGroup);

    const varGroup = file.get('var');
    if (!varGroup) throw new Error('Missing /var group');
    const commentIds = readIndex(varGroup);

    const varKeys = varGroup.keys();
    let commentTexts;
    if (varKeys.includes('content')) {
      commentTexts = readColumn(varGroup, 'content');
    } else if (varKeys.includes('txt')) {
      commentTexts = readColumn(varGroup, 'txt');
    } else {
      commentTexts = commentIds.map(() => '');
    }

    const comments = commentIds.map((id, i) => ({ id, body: String(commentTexts[i]) }));

    const xDataset = file.get('X');
    if (!xDataset) throw new Error('Missing /X dataset');
    const shape = xDataset.shape;
    if (!shape || shape.length !== 2) throw new Error(`Expected 2D /X matrix, got shape: ${shape}`);

    const nObs = shape[0];
    const nVar = shape[1];
    const rawValue = xDataset.value;

    let flat;
    if (ArrayBuffer.isView(rawValue)) {
      flat = Array.from(rawValue);
    } else if (Array.isArray(rawValue)) {
      flat = rawValue.flat();
    } else {
      throw new Error('Unexpected format for /X dataset');
    }

    const votesMatrix = [];
    for (let i = 0; i < nObs; i++) {
      const row = [];
      for (let j = 0; j < nVar; j++) {
        const val = flat[i * nVar + j];
        row.push(isNaN(val) ? null : val);
      }
      votesMatrix.push(row);
    }

    return { comments, participantIds, commentIds, votesMatrix };
  } finally {
    if (file) file.close();
    try { FS.unlink(filename); } catch { /* ignore */ }
  }
}

function escapeCSV(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSVBlobs({ comments, participantIds, commentIds, votesMatrix }) {
  const commentsLines = ['comment-id,comment-body'];
  for (const c of comments) {
    commentsLines.push(`${escapeCSV(c.id)},${escapeCSV(c.body)}`);
  }
  const commentsBlob = new Blob([commentsLines.join('\n')], { type: 'text/csv' });

  const header = ['participant', ...commentIds.map(escapeCSV)].join(',');
  const votesLines = [header];
  for (let i = 0; i < participantIds.length; i++) {
    const cells = [escapeCSV(participantIds[i])];
    for (let j = 0; j < commentIds.length; j++) {
      const val = votesMatrix[i][j];
      cells.push(val === null ? '' : String(val));
    }
    votesLines.push(cells.join(','));
  }
  const votesBlob = new Blob([votesLines.join('\n')], { type: 'text/csv' });

  return { commentsBlob, votesBlob };
}
