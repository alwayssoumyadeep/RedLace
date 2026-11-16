import Stage, { HERO_FRAMES } from '../components/home/Stage';
import { FreshRail, InfoBand, Promises, ShapeTiles, ShortList } from '../components/home/Sections';
import { usePageReady, useTitle } from '../context/PageTransition';

export default function Home() {
  useTitle('Redlace — Sneakers in red and white');
  const images = usePageReady(HERO_FRAMES);
  return (
    <>
      <Stage images={images} />
      <FreshRail />
      <InfoBand />
      <ShapeTiles />
      <ShortList />
      <Promises />
    </>
  );
}
