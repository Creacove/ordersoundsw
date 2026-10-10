export function SoundMark() {
  return <img className="sound-mark" src="/hero/ordersounds-logo.png" alt="" />;
}

export default function SleeveContent({ face }) {
  if (face === 'front') return <div className="sleeve-face sleeve-face--front" data-sleeve-front>
    <SoundMark />
    <span className="sleeve-brand">OrderSounds</span>
  </div>;
  return <div className="sleeve-face sleeve-face--back" data-sleeve-back aria-label="Desk, the other side">
    <div className="sleeve-heading">DESK / THE OTHER SIDE</div>
    <ol className="desk-rows">
      <li><span className="row-index">01 <span>/</span></span><div><strong>RELEASES</strong><span>Plan · pitch · coordinate</span></div></li>
      <li><span className="row-index">02 <span>/</span></span><div><strong>MARKETING</strong><span>Content · creators · playlists</span></div></li>
      <li><span className="row-index">03 <span>/</span></span><div><strong>BUSINESS</strong><span>Splits · rights · budgets</span></div></li>
      <li><span className="row-index">04 <span>/</span></span><div><strong>OPPORTUNITIES</strong><span>Collaborations · shows · partnerships</span></div></li>
      <li><span className="row-index">05 <span>/</span></span><div><strong>NEXT MOVE</strong><span className="row-swap"><span data-before>What matters now · what comes next</span><span data-after>Pitch the single before Friday</span></span></div></li>
    </ol>
  </div>;
}
