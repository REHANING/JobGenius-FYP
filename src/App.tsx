import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Landing from './pages/Landing';
import HomeFeed from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/jobseeker/Dashboard';
import Profile from './pages/jobseeker/ProfileMerged';
import Profiles from './pages/Profiles';
import UserProfile from './pages/UserProfile';
import Notifications from './pages/Notifications';
import Internships from './pages/jobseeker/Internships';
import InternshipDetail from './pages/jobseeker/InternshipDetail';
import Marketplace from './pages/jobseeker/Marketplace';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import RecruiterPosts from './pages/recruiter/Posts';
import PostJob from './pages/recruiter/PostJob';
import RecruiterProfiles from './pages/recruiter/Profiles';
import ManageJobs from './pages/recruiter/ManageJobs';
import Applicants from './pages/recruiter/Applicants';
import RecruiterOffers from './pages/recruiter/Offers';
import RecruiterInterviews from './pages/recruiter/Interviews';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminReports from './pages/admin/Reports';
import AdminRoute from './components/admin/AdminRoute';
import Subscription from './pages/Subscription';
import Applications from './pages/jobseeker/Applications';
import Interviews from './pages/jobseeker/Interviews';
import Offers from './pages/jobseeker/Offers';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Hide navbar on landing page and auth pages (they have their own navbars)
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const showNavbar = !isLandingPage && !isAuthPage;

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      {showNavbar && <Navbar />}
      
      <main 
        className="transition-all duration-300"
        style={{
          marginTop: showNavbar ? '68px' : '0',
          paddingTop: '0',
          minHeight: 'calc(100vh - 68px)',
          background: '#FFFFFF'
        }}
      >
        {children}
      </main>
      
      {isLandingPage && <Footer />}
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (location.pathname === '/') {
      if (user) {
        // Redirect based on role
        if (user.role === 'recruiter') {
          navigate('/recruiter', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }
      // If no user, stay on landing page (already rendered)
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan"></div>
      </div>
    );
  }

  // Always show landing page at root, then redirect if logged in
  return <Landing />;
};

// Redirect handler when user logs out while on protected pages
const LogoutRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // If user is not logged in and not on public pages, redirect to home
    // Keep admin routes reachable so AdminRoute can show the admin login page.
    const isPublicPage =
      location.pathname === '/' ||
      location.pathname === '/login' ||
      location.pathname === '/signup' ||
      location.pathname.startsWith('/admin');

    if (!user && !isPublicPage) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate, location.pathname]);

  return null;
};

function App() {
  // --- CHATBOT WIDGET INTEGRATION ---
  useEffect(() => {
    const chatbotApiBase = import.meta.env.VITE_CHATBOT_API_BASE as string | undefined;
    const chatbotWidgetToken = import.meta.env.VITE_CHATBOT_WIDGET_TOKEN as string | undefined;
    const chatbotScriptUrl = (import.meta.env.VITE_CHATBOT_SCRIPT_URL as string | undefined)
      || (chatbotApiBase ? `${chatbotApiBase.replace(/\/$/, '')}/static/chatbot-widget.v2.js?v=4` : undefined);

    // Skip widget injection when env variables are not configured.
    if (!chatbotApiBase || !chatbotWidgetToken || !chatbotScriptUrl) return;

    // Check if script already exists to prevent duplicate loading
    const existingScript = document.getElementById('chatbot-widget-script');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'chatbot-widget-script';
    script.src = chatbotScriptUrl;
    script.dataset.apiBase = chatbotApiBase;
    script.dataset.widgetToken = chatbotWidgetToken;
    script.defer = true;

    // Handle the onload event to initialize the widget
    script.onload = () => {
      const chatbotWindow = window as Window & {
        createChatbotWidget?: (config: { apiBase: string; widgetToken: string }) => void;
      };

      if (chatbotWindow.createChatbotWidget) {
        chatbotWindow.createChatbotWidget({
          apiBase: chatbotApiBase,
          widgetToken: chatbotWidgetToken,
        });
      }
    };

    // Append to body (effectively "before closing body tag")
    document.body.appendChild(script);

    // Optional cleanup
    return () => {
      // Usually we keep the chat widget even if App unmounts, but if you need to remove it:
      // if (document.body.contains(script)) {
      //   document.body.removeChild(script);
      // }
    };
  }, []);
  // ----------------------------------

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
            <LogoutRedirect />
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/home" element={<HomeFeed />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/jobs" element={<Internships />} />
              <Route path="/cover-letter" element={<Marketplace />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/internships" element={<Internships />} />
              <Route path="/internships/:id" element={<InternshipDetail />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/recruiter" element={<RecruiterDashboard />} />
              <Route path="/recruiter/posts" element={<RecruiterPosts />} />
              <Route path="/recruiter/post-job" element={<PostJob />} />
              <Route path="/recruiter/profiles" element={<RecruiterProfiles />} />
              <Route path="/recruiter/jobs" element={<ManageJobs />} />
              <Route path="/recruiter/applicants" element={<Applicants />} />
              <Route path="/recruiter/offers" element={<RecruiterOffers />} />
              <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/jobs" element={<AdminJobs />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/subscription" element={<Subscription />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;