import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header />
        
        {/* Zone de contenu */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pt-16 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;