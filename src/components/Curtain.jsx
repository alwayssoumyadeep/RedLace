import { useLayoutEffect } from 'react';
import { usePageTransition } from '../context/PageTransition';

const LACE = 'M4 34 44 10 84 34 124 10 164 34 204 10 244 34 284 10 316 30';

export default function Curtain() {
  const { phase, full, threadRef, countRef } = usePageTransition();

  useLayoutEffect(() => {
    const cover = document.getElementById('boot-cover');
    if (cover) cover.remove();
  }, []);

  const cls = ['curtain', full && 'curtain--full', phase === 'up' && 'is-up', phase === 'down' && 'is-down'].filter(Boolean).join(' ');
  return (
    <div id="curtain" className={cls}>
      <div className="curtain__in">
        <div className="curtain__logo">RED<span>LACE</span></div>
        <svg className="curtain__lace" viewBox="0 0 320 44" aria-hidden="true">
          <path className="curtain__track" d={LACE} />
          <path className="curtain__thread" ref={threadRef} pathLength="100" d={LACE} />
        </svg>
        <div className="curtain__count"><b ref={countRef}>0</b>%</div>
      </div>
    </div>
  );
}
