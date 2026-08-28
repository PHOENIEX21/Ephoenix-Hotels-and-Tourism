import { curatedImageSet, folderImages } from '../../lib/data';
import GalleryCategory from '../../components/GalleryCategory';

const categories = [
  ['Main', 'Classic rooms', 'main/classic', 2],
  ['Main', 'Exterior', 'main/exterior-main', 7],
  ['Annex I', "Chairman's Suite", 'annex-i/chairman-s-suite', 2],
  ['Annex I', "Director's Suite", 'annex-i/director-suite', 2],
  ['Annex I', 'Exterior', 'annex-i/exterior-annex-1', 4],
  ['Annex I', 'Lobby', 'annex-i/lobby', 3],
  ['Annex I', 'Superior Luxury', 'annex-i/superior-luxury', 2],
  ['Annex II', 'City View Luxury', 'annex-ii/city-view-luxury', 2],
  ['Annex II', 'Classic rooms', 'annex-ii/classic', 2],
  ['Annex II', 'Deluxe rooms', 'annex-ii/deluxe', 4],
  ['Annex II', 'Exterior', 'annex-ii/exterior', 4],
  ['Annex II', 'Lobby', 'annex-ii/lobby', 8],
  ['Annex II', 'Presidential Suite', 'annex-ii/presidential-suite', 6],
  ['Annex II', 'Presidential Suite · Super Deluxe', 'annex-ii/presidential-suite/super-deluxe', 3],
  ['Annex II', 'Restaurant & bar', 'annex-ii/restaurant-and-abr', 3],
  ['Annex II', 'Senatorial Suite', 'annex-ii/senatorial-suite', 5],
  ['Annex II', 'Curated highlights', 'annex-ii/special', 3],
  ['Annex II', 'Swimming pool', 'annex-ii/swimming-pool', 3],
  ['Annex II', 'White House City View', 'annex-ii/white-house-city-view', 4],
] as const;
const specialImages = ['use1.jpg', 'use1ngt.jpg', 'use2.png', 'use2dds.jpg', 'use3.jpg', 'z-2', 'z-4', 'z-14', 'z-15', 'z-16', 'z-23', 'z-35', 'z-44', 'z-45', 'z-48', 'z-49', 'z-59', 'z-60', 'z-61', 'z-73', 'z-74'];
const swimmingPoolImages = ['use1ngt.png', 'use2dds.jpg', 'use2ngv.jpg', 'z-2', 'z-4', 'z-35', 'z-48', 'z-49'];

export default function GalleryPage() {
  return <main><div className="page-intro"><div className="eyebrow">EPhoenix in focus</div><h1>See the feeling<br />before you arrive.</h1><p>Explore each branch by category. Curated use1, use2, use3 images lead every collection in strict order. Use the arrows within a category to preview its photos.</p></div><div className="gallery-sections">{['Main', 'Annex I', 'Annex II'].map(branch => <section className="section gallery-branch" key={branch}><div className="section-head"><div className="eyebrow">{branch}</div><h2>{branch} collection</h2></div><div className="gallery-category-grid">{categories.filter(category => category[0] === branch).map(([, category, folder, count]) => <GalleryCategory key={folder} branch={branch} category={category} images={folder === 'annex-ii/special' ? folderImages(`ephoenix/${folder}`, specialImages) : folder === 'annex-ii/swimming-pool' ? folderImages(`ephoenix/${folder}`, swimmingPoolImages) : curatedImageSet(`ephoenix/${folder}`, count)} />)}</div></section>)}</div></main>;
}
