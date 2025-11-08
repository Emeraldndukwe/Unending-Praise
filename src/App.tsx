import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTopButton from "./components/ScrollToTopButton";
import Home from "./pages/Home";
import About from "./pages/About";
import Contacts from "./pages/Contacts";
import Testimonies from "./pages/Testimonies";
import TestimonyDetails from "./pages/TestimonyDetails";
import Crusades from "./pages/Crusades";
import CrusadeListPage from "./pages/CrusadeListPage";
import CrusadeDetails from "./pages/CrusadeDetails";
import AdminPage from "./pages/Admin";

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Navbar />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Home */}
            <Route
              path="/"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Home />
                </motion.div>
              }
            />

            {/* About */}
            <Route
              path="/about"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <About />
                </motion.div>
              }
            />

            {/* Contacts */}
            <Route
              path="/contact"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Contacts />
                </motion.div>
              }
            />

            {/* Testimonies */}
            <Route
              path="/testimonies"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Testimonies />
                </motion.div>
              }
            />

            {/* Testimony Details */}
            <Route
              path="/testimonies/:id"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <TestimonyDetails />
                </motion.div>
              }
            />

            {/* Crusades */}
            <Route
              path="/crusades"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <Crusades />
                </motion.div>
              }
            />

            {/* Crusade Details - Must come before :type route */}
            <Route
              path="/crusades/details/:id"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CrusadeDetails />
                </motion.div>
              }
            />

            {/* Crusade List Page */}
            <Route
              path="/crusades/:type"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CrusadeListPage />
                </motion.div>
              }
            />
            {/* Hidden Admin Route - no links point here */}
            <Route
              path="/admin"
              element={
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <AdminPage />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdmin && <ScrollToTopButton />}
      {!isAdmin && <Footer />}
    </div>
  );
}
