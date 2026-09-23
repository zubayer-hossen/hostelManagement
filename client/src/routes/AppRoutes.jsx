import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PageLoader from '../components/ui/PageLoader.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import GuestRoute from './GuestRoute.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

const Home = lazy(() => import('../pages/Home.jsx'));
const Login = lazy(() => import('../pages/auth/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail.jsx'));
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome.jsx'));
const Profile = lazy(() => import('../pages/dashboard/Profile.jsx'));
const About = lazy(() => import('../pages/AboutPage.jsx'));
const BoysHostel = lazy(() => import('../pages/BoysHostel.jsx'));
const GirlsHostel = lazy(() => import('../pages/GirlsHostel.jsx'));
const Facilities = lazy(() => import('../pages/Facilities.jsx'));
const FoodMenuPage = lazy(() => import('../pages/FoodMenuPage.jsx'));
const GalleryPage = lazy(() => import('../pages/GalleryPage.jsx'));
const NoticesPage = lazy(() => import('../pages/NoticesPage.jsx'));
const FaqPage = lazy(() => import('../pages/FaqPage.jsx'));
const ContactPage = lazy(() => import('../pages/ContactPage.jsx'));
const RulesPage = lazy(() => import('../pages/RulesPage.jsx'));
const TermsPage = lazy(() => import('../pages/TermsPage.jsx'));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage.jsx'));
const RoomsPage = lazy(() => import('../pages/rooms/RoomsPage.jsx'));
const RoomDetail = lazy(() => import('../pages/rooms/RoomDetail.jsx'));
const BookRoom = lazy(() => import('../pages/rooms/BookRoom.jsx'));
const MyBookings = lazy(() => import('../pages/dashboard/MyBookings.jsx'));
const Favorites = lazy(() => import('../pages/dashboard/Favorites.jsx'));
const BookingsAdmin = lazy(() => import('../pages/staff/BookingsAdmin.jsx'));
const RoomsAdmin = lazy(() => import('../pages/staff/RoomsAdmin.jsx'));
const ResidentProfile = lazy(() => import('../pages/resident/ResidentProfile.jsx'));
const ResidentPayments = lazy(() => import('../pages/resident/ResidentPayments.jsx'));
const ResidentWarnings = lazy(() => import('../pages/resident/ResidentWarnings.jsx'));
const ResidentComplaints = lazy(() => import('../pages/resident/ResidentComplaints.jsx'));
const ResidentsAdmin = lazy(() => import('../pages/staff/ResidentsAdmin.jsx'));
const FinanceAdmin = lazy(() => import('../pages/staff/FinanceAdmin.jsx'));
const ComplaintsAdmin = lazy(() => import('../pages/staff/ComplaintsAdmin.jsx'));
const CmsResourcePage = lazy(() => import('../pages/cms/CmsResourcePage.jsx'));
const PagesEditor = lazy(() => import('../pages/cms/PagesEditor.jsx'));
const SettingsPage = lazy(() => import('../pages/cms/SettingsPage.jsx'));
const UsersAdmin = lazy(() => import('../pages/admin/UsersAdmin.jsx'));
const RolesAdmin = lazy(() => import('../pages/admin/RolesAdmin.jsx'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs.jsx'));
const MediaLibrary = lazy(() => import('../pages/cms/MediaLibrary.jsx'));
const EventsPage = lazy(() => import('../pages/EventsPage.jsx'));
const SupportPage = lazy(() => import('../pages/support/SupportPage.jsx'));
const MyTickets = lazy(() => import('../pages/support/MyTickets.jsx'));
const SupportAdmin = lazy(() => import('../pages/support/SupportAdmin.jsx'));
const MeetingsPage = lazy(() => import('../pages/meetings/MeetingsPage.jsx'));
const MyMeetings = lazy(() => import('../pages/meetings/MyMeetings.jsx'));
const MeetingsAdmin = lazy(() => import('../pages/meetings/MeetingsAdmin.jsx'));
const Analytics = lazy(() => import('../pages/dashboard/Analytics.jsx'));
const BlogListPage = lazy(() => import('../pages/blog/BlogListPage.jsx'));
const BlogPostPage = lazy(() => import('../pages/blog/BlogPostPage.jsx'));
const MyBookmarks = lazy(() => import('../pages/blog/MyBookmarks.jsx'));
const BlogAdmin = lazy(() => import('../pages/staff/BlogAdmin.jsx'));
const BlogCommentsAdmin = lazy(() => import('../pages/staff/BlogCommentsAdmin.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const Forbidden = lazy(() => import('../pages/Forbidden.jsx'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="boys-hostel" element={<BoysHostel />} />
          <Route path="girls-hostel" element={<GirlsHostel />} />
          <Route path="facilities" element={<Facilities />} />
          <Route path="food-menu" element={<FoodMenuPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="blog" element={<BlogListPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
          <Route path="403" element={<Forbidden />} />
          <Route element={<ProtectedRoute />}>
            <Route path="rooms/:id/book" element={<BookRoom />} />
          </Route>
        </Route>

        <Route element={<AuthLayout />}>
          <Route element={<GuestRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
          {/* Reachable whether or not the visitor is signed in (links come from e-mails). */}
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="bookmarks" element={<MyBookmarks />} />
            <Route element={<ProtectedRoute permissions={['manageBlogs']} />}>
              <Route path="manage/blog" element={<BlogAdmin />} />
              <Route path="manage/blog/comments" element={<BlogCommentsAdmin />} />
            </Route>
            <Route element={<ProtectedRoute roles={['hostel_resident']} />}>
              <Route path="resident/profile" element={<ResidentProfile />} />
              <Route path="resident/payments" element={<ResidentPayments />} />
              <Route path="resident/warnings" element={<ResidentWarnings />} />
              <Route path="complaints" element={<ResidentComplaints />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageResidents']} />}>
              <Route path="manage/residents" element={<ResidentsAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['managePayments']} />}>
              <Route path="manage/finance" element={<FinanceAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageComplaints']} />}>
              <Route path="manage/complaints" element={<ComplaintsAdmin />} />
            </Route>
            <Route path="support" element={<MyTickets />} />
            <Route path="meetings" element={<MyMeetings />} />
            <Route element={<ProtectedRoute permissions={['manageMeetings']} />}>
              <Route path="manage/meetings" element={<MeetingsAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageSupport']} />}>
              <Route path="manage/support" element={<SupportAdmin />} />
            </Route>
            <Route path="cms/pages" element={<PagesEditor />} />
            <Route element={<ProtectedRoute permissions={['manageMedia']} />}>
              <Route path="media" element={<MediaLibrary />} />
            </Route>
            <Route path="cms/:resource" element={<CmsResourcePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route element={<ProtectedRoute permissions={['manageUsers']} />}>
              <Route path="users" element={<UsersAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageRoles']} />}>
              <Route path="roles" element={<RolesAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['viewAnalytics']} />}>
              <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['viewAuditLogs']} />}>
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageBookings']} />}>
              <Route path="manage/bookings" element={<BookingsAdmin />} />
            </Route>
            <Route element={<ProtectedRoute permissions={['manageRooms']} />}>
              <Route path="manage/rooms" element={<RoomsAdmin />} />
            </Route>
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
