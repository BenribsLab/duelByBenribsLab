import { Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';

const MobileLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navigation fixe en haut */}
      <TopNavigation />
      
      {/* Zone de contenu avec padding pour éviter le chevauchement */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pt-32">
        <Outlet />
      </main>
    </div>
  );
};

export default MobileLayout;