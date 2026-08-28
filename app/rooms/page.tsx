import { hotels, rooms } from '../../lib/data';
import RoomDirectory from '../../components/RoomDirectory';
export const dynamic = 'force-dynamic';
export default function RoomsPage(){return <main><div className="page-intro"><div className="eyebrow">Room directory</div><h1>Find your room.</h1><p>Select a branch first, then browse its room types. Each room keeps its own photo preview independent from the vertical room feed.</p></div><section className="section" style={{paddingTop:20}}><div className="filter-row"><span className="filter">24-hour stay model</span></div><RoomDirectory hotels={hotels} rooms={rooms} /></section></main>}
