export let pyodide = null;

export async function initPyodide() {
  if (pyodide) return pyodide;

  pyodide = await window.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
  });
  await pyodide.loadPackage(['micropip']);

  const micropip = pyodide.pyimport('micropip');

  await micropip.install('numpy');
  await micropip.install('pandas');
  await micropip.install('scikit-learn');
  await micropip.install('pydantic');

  const urlBase =
    window.location.origin === 'http://localhost:5173'
      ? 'http://localhost:5173/oval-demo'
      : 'https://maanasarora.github.io/oval-demo';

  // Load your Oval library
  await micropip.install(`${urlBase}/oval-0.1.0-py3-none-any.whl`);

  return pyodide;
}

export async function computeVariable(name, anchors, useRelevanceScoring) {
  pyodide = await initPyodide();

  pyodide.globals.set('anchors_json', anchors);
  pyodide.globals.set('variable_name', name);
  pyodide.globals.set('use_relevance_scoring', useRelevanceScoring);

  const result = await pyodide.runPythonAsync(`
from oval.variable import DiffusionVariable

anchors_dict = {int(k): v for k, v in anchors_json.to_py().items()}

variable = DiffusionVariable(conversation)
variable.fit(dict(anchors_dict))

participant_scores = variable.predict_users().astype(float)
participant_scores = {int(participant.id): score for participant, score in zip(conversation.users, participant_scores)}

comment_scores = variable.predict_comments().astype(float)
comment_scores = {int(comment.id): score for comment, score in zip(conversation.comments, comment_scores)}

confidence = variable.score_comments(dict(anchors_dict))
confidence = float(confidence)

json = {
    "comment_scores": comment_scores,
    "participant_scores": participant_scores,
    "confidence": confidence,
}
json
`);

  return result.toJs();
}
