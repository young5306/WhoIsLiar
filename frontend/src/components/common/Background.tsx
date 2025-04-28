// import React from 'react';

// interface BackgroundProps {
//   imageUrl: string;
//   children: React.ReactNode;
// }

// const Background = ({ imageUrl, children }: BackgroundProps) => {
//   return (
//     <div
//       style={{
//         position: 'relative',
//         width: '100vw',
//         height: '100vh',
//         overflow: 'hidden',
//       }}
//     >
//       <img
//         src={imageUrl}
//         alt="배경 이미지"
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           objectFit: 'cover',
//           objectPosition: 'top',
//           zIndex: 0,
//         }}
//       />
//       <div
//         style={{
//           position: 'relative',
//           zIndex: 1,
//           padding: '2rem',
//           color: '#fff',
//         }}
//       >
//         {children}
//       </div>
//     </div>
//   );
// };

// export default Background;

interface BackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

const Background = ({ imageUrl, children }: BackgroundProps) => {
  return (
    <div className="relative w-screen bg-red h-screen overflow-hidden">
      <img
        src={imageUrl}
        alt="배경 이미지"
        className="absolute top-0 left-0 w-full h-full object-cover object-top z-0"
      />
      <div className="relative p-8 text-white">{children}</div>
    </div>
  );
};

export default Background;
