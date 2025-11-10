import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTopButton from "./components/ScrollToTopButton";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Testimonies = lazy(() => import("./pages/Testimonies"));
const TestimonyDetails = lazy(() => import("./pages/TestimonyDetails"));
const Crusades = lazy(() => import("./pages/Crusades"));
const CrusadeListPage = lazy(() => import("./pages/CrusadeListPage"));
const CrusadeDetails = lazy(() => import("./pages/CrusadeDetails"));
const AdminPage = lazy(() => import("./pages/Admin"));

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
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
                Loading...
              </div>
            }
          >
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
          </Suspense>
        </AnimatePresence>
      </main>
      {!isAdmin && <ScrollToTopButton />}
      {!isAdmin && <Footer />}
    </div>
  );
}
