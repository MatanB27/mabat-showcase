// Cylindrical room views rendered from the same property model for devices without WebGL.
export function panorama() {
  const view = document.querySelector('#view');
  const room = document.querySelector('#room');
  const frame = document.createElement('div');
  frame.tabIndex = 0;
  frame.setAttribute('role','img');
  frame.className = 'panorama';
  view.replaceChildren(frame);
  let offset = 0;
  let previousX;
  function draw() { frame.style.backgroundPosition = 'calc(50% + '+offset+'px) center'; }
  function enterRoom() {
    offset = room.selectedIndex === 0 ? -view.clientHeight * 1.05 : 0;
    frame.style.backgroundImage = 'url("room' + room.selectedIndex + '.webp")';
    frame.setAttribute('aria-label',room.value + '. גררו או השתמשו בחצים ימינה ושמאלה.');
    draw();
  }
  frame.onpointerdown = event => {
    frame.setPointerCapture(event.pointerId);
    previousX = event.clientX;
  };
  frame.onpointermove = event => {
    if (!frame.hasPointerCapture(event.pointerId)) return;
    offset += event.clientX - previousX;
    previousX = event.clientX;
    draw();
  };
  frame.onkeydown = event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    offset += event.key === 'ArrowLeft' ? 55 : -55;
    draw();
  };
  room.onchange = enterRoom;
  enterRoom();
  return {draw};
}
