import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';
import Header from './Header';

const Layout = () => {
  return (
    <div className="h-screen bg-gray-50">
      {/* Navigation mobile (top) - visible uniquement sur mobile */}
      <div className="lg:hidden">
        <TopNavigation />
      </div>
      
      {/* Layout desktop avec sidebar */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Contenu principal desktop */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          {/* Zone de contenu */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Layout mobile avec top navigation */}
      <div className="lg:hidden">
        {/* Zone de contenu mobile avec padding pour éviter le chevauchement */}
        <main className="overflow-x-hidden overflow-y-auto p-4 pt-32 pb-4 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;