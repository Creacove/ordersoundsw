export function SoundMark() {
  return <img className="sound-mark" src="/hero/ordersounds-logo.png" alt="" />;
}

export default function SleeveContent({ face }) {
  if (face === 'front') return <div className="sleeve-face sleeve-face--front" data-sleeve-front>
    <SoundMark />
    <span className="sleeve-brand">OrderSounds</span>
  </div>;
  return <div className="sleeve-face sleeve-face--back" data-sleeve-back aria-label="Desk today">
    <div className="sleeve-heading">DESK / TODAY</div>
    <ol className="desk-rows">
      <li>
        <span className="row-index">01 <span>/</span></span>
        <div><strong>YOUR MOVE</strong>
          <div className="row-swap"><span data-before>Record the next Odaeshi story</span><span data-after>Repeat the personal story</span></div>
        </div>
      </li>
      <li><span className="row-index">02 <span>/</span></span><div><strong>DESK IS HANDLING</strong><span>Research · planning · follow-through</span></div></li>
      <li>
        <span className="row-index">03 <span>/</span></span>
        <div className="row-swap row-swap--result">
          <div data-before><strong>DESK IS WATCHING</strong><span>Audience response · Lagos</span></div>
          <div data-after><strong>RESULT</strong><span>Personal story is leading</span></div>
        </div>
      </li>
      <li><span className="row-index">04 <span>/</span></span><div><strong>NEEDS YOU</strong><span>Approve split confirmations</span></div></li>
    </ol>
  </div>;
}
