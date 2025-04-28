import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <header className="bg-gray-800 text-white p-4">Header</header>
      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
