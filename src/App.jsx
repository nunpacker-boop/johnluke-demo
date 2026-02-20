import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";

import Home from "./pages/Home.jsx";
import TrusteeProspectus from "./pages/TrusteeProspectus.jsx";
import Archive from "./pages/Archive.jsx";
import Exhibitions from "./pages/Exhibitions.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import SelectedCatalogue from "./pages/SelectedCatalogue.jsx";
import LivingCatalogue from "./pages/LivingCatalogue.jsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />

          <Route path="selected-catalogue" element={<SelectedCatalogue />} />
          <Route path="living-catalogue" element={<LivingCatalogue />} />

          <Route path="/trustee-prospectus" element={<TrusteeProspectus />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/exhibitions" element={<Exhibitions />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
