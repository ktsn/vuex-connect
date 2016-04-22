let stub;

export function setup() {
  stub = document.createElement('div');
  stub.innerHTML = `
  <div id="app">
    <example></example>
  </div>`;

  document.body.appendChild(stub);
}

export function teardown() {
  document.body.removeChild(stub);
}
