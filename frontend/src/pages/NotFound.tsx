import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* 메인 컨텐츠 */}
      <div className="text-center">
        <div className="bg-gradient-to-b from-purple-900/90 to-blue-900/90 p-12 rounded-2xl shadow-2xl border border-purple-500/30">
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">
            404
          </h1>
          <p className="text-2xl text-purple-200 mb-8 font-medium">
            페이지를 찾을 수 없습니다!
          </p>
          <p className="text-purple-300 mb-12 max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          <button
            onClick={() => navigate('/')}
            className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
