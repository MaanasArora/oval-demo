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

  // Load your Oval library
  await micropip.install('http://localhost:5173/oval-0.1.0-py3-none-any.whl');

  return pyodide;
}

export async function computeVariable(name, anchors) {
  pyodide = await initPyodide();

  pyodide.globals.set('anchors_json', anchors);
  pyodide.globals.set('variable_name', name);

  const result = await pyodide.runPythonAsync(`
from oval.variable import Variable

anchors_dict = {int(k): v for k, v in anchors_json.to_py().items()}

variable = Variable(conversation, name=variable_name)
variable.fit(labels=dict(anchors_dict), ndim=3)

scores = variable.predict_comments([int(c.id) for c in conversation.comments])
scores
`);

  return result.toJs();
}
