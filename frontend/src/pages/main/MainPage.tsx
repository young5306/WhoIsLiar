import Background from '../../components/common/Background';
import mainBg from '../../assets/backgrounds/mainBg.svg';

const MainPage = () => {
  return (
    <Background imageUrl={mainBg}>
      <h1>홈페이지</h1>
      <p>여기에 다른 컨텐츠를 자유롭게 배치하세요.</p>
    </Background>
  );
};

export default MainPage;
