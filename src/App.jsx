import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";

// Top-level
import Home from "./pages/Home.jsx";

// John Luke
import JohnLuke from "./pages/john-luke/index.jsx";
import LifeAndTimes from "./pages/john-luke/LifeAndTimes.jsx";
import TechniqueAndMethod from "./pages/john-luke/TechniqueAndMethod.jsx";
import InfluencesAndContext from "./pages/john-luke/InfluencesAndContext.jsx";
import JohnsWriting from "./pages/john-luke/JohnsWriting.jsx";
import ReadingList from "./pages/john-luke/ReadingList.jsx";
import FamilyTree from "./pages/john-luke/FamilyTree.jsx";

// Works
import Works from "./pages/works/index.jsx";
import SelectedCatalogue from "./pages/works/SelectedCatalogue.jsx";
import LivingCatalogue from "./pages/works/LivingCatalogue.jsx";
import Browse from "./pages/works/Browse.jsx";
import ArtworkFactSheet from "./pages/works/ArtworkFactSheet.jsx";

// Archive
import Archive from "./pages/archive/index.jsx";
import Letters from "./pages/archive/Letters.jsx";
import Sketches from "./pages/archive/Sketches.jsx";
import Photographs from "./pages/archive/Photographs.jsx";
import PressAndPublications from "./pages/archive/PressAndPublications.jsx";
import RequestAccess from "./pages/archive/RequestAccess.jsx";

// Exhibitions
import Exhibitions from "./pages/exhibitions/index.jsx";
import HistoricalExhibitions from "./pages/exhibitions/Historical.jsx";
import ExhibitionFactSheet from "./pages/exhibitions/ExhibitionFactSheet.jsx";
import FoundationEvents from "./pages/exhibitions/FoundationEvents.jsx";

// Publications
import Publications from "./pages/publications/index.jsx";
import Biography from "./pages/publications/Biography.jsx";
import QuietEye from "./pages/publications/QuietEye.jsx";
import SelectedCatalogueBook from "./pages/publications/SelectedCatalogueBook.jsx";
import LettersBook from "./pages/publications/LettersBook.jsx";
import OilAndEgg from "./pages/publications/OilAndEgg.jsx";
import PhilosophyOfArt from "./pages/publications/PhilosophyOfArt.jsx";

// Writing (blog)
import Writing from "./pages/writing/index.jsx";
import WritingPost from "./pages/writing/Post.jsx";

// Foundation
import Foundation from "./pages/foundation/index.jsx";
import About from "./pages/foundation/About.jsx";
import Programmes from "./pages/foundation/Programmes.jsx";
import Trustees from "./pages/foundation/Trustees.jsx";
import Partners from "./pages/foundation/Partners.jsx";
import Press from "./pages/foundation/Press.jsx";
import News from "./pages/foundation/News.jsx";

// Contact
import Contact from "./pages/contact/index.jsx";
import RegisterAWork from "./pages/contact/RegisterAWork.jsx";
import ArchiveAccess from "./pages/contact/ArchiveAccess.jsx";
import MediaEnquiry from "./pages/contact/MediaEnquiry.jsx";
import Partnership from "./pages/contact/Partnership.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* John Luke */}
          <Route path="/john-luke" element={<JohnLuke />} />
          <Route path="/john-luke/life-and-times" element={<LifeAndTimes />} />
          <Route path="/john-luke/technique-and-method" element={<TechniqueAndMethod />} />
          <Route path="/john-luke/influences-and-context" element={<InfluencesAndContext />} />
          <Route path="/john-luke/johns-writing" element={<JohnsWriting />} />
          <Route path="/john-luke/reading-list" element={<ReadingList />} />
          <Route path="/john-luke/family-tree" element={<FamilyTree />} />

          {/* Works */}
          <Route path="/works" element={<Works />} />
          <Route path="/works/selected-catalogue" element={<SelectedCatalogue />} />
          <Route path="/works/living-catalogue" element={<LivingCatalogue />} />
          <Route path="/works/browse" element={<Browse />} />
          <Route path="/works/:artworkId" element={<ArtworkFactSheet />} />

          {/* Archive */}
          <Route path="/archive" element={<Archive />} />
          <Route path="/archive/letters" element={<Letters />} />
          <Route path="/archive/sketches" element={<Sketches />} />
          <Route path="/archive/photographs" element={<Photographs />} />
          <Route path="/archive/press-and-publications" element={<PressAndPublications />} />
          <Route path="/archive/request-access" element={<RequestAccess />} />

          {/* Exhibitions */}
          <Route path="/exhibitions" element={<Exhibitions />} />
          <Route path="/exhibitions/historical" element={<HistoricalExhibitions />} />
          <Route path="/exhibitions/historical/:id" element={<ExhibitionFactSheet />} />
          <Route path="/exhibitions/events" element={<FoundationEvents />} />

          {/* Publications */}
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/biography" element={<Biography />} />
          <Route path="/publications/the-quiet-eye" element={<QuietEye />} />
          <Route path="/publications/selected-catalogue" element={<SelectedCatalogueBook />} />
          <Route path="/publications/the-letters" element={<LettersBook />} />
          <Route path="/publications/the-oil-and-the-egg" element={<OilAndEgg />} />
          <Route path="/publications/philosophy-of-art" element={<PhilosophyOfArt />} />

          {/* Writing */}
          <Route path="/writing" element={<Writing />} />
          <Route path="/writing/:slug" element={<WritingPost />} />

          {/* Foundation */}
          <Route path="/foundation" element={<Foundation />} />
          <Route path="/foundation/about" element={<About />} />
          <Route path="/foundation/programmes" element={<Programmes />} />
          <Route path="/foundation/trustees" element={<Trustees />} />
          <Route path="/foundation/partners" element={<Partners />} />
          <Route path="/foundation/press" element={<Press />} />
          <Route path="/foundation/news" element={<News />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact/register-a-work" element={<RegisterAWork />} />
          <Route path="/contact/archive-access" element={<ArchiveAccess />} />
          <Route path="/contact/media" element={<MediaEnquiry />} />
          <Route path="/contact/partnership" element={<Partnership />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
