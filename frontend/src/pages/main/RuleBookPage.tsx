import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // 아이콘 라이브러리 사용 (lucide-react 설치 필요)

const ruleBookData = [
  {
    title: '라이어 게임 룰북',
    content: [
      '라이어 게임은 일반 플레이어들 사이에서 한 명의 라이어를 찾아내는 심리 추리 게임입니다.',
      '',
      '일반 플레이어는 라이어를 찾아야 하고,',
      '라이어는 정체를 들키지 않고 제시어를 유추해야 합니다.',
      '',
      '각 라운드는 3턴, 총 5라운드로 진행하고 최종 점수를 산정합니다.',
    ],
  },
  {
    title: '게임 진행',
    content: [
      '1. 인원 4~6명 중 1명은 무작위로 라이어가 됩니다.',
      '2. 플레이 전에 카테고리를 선택합니다.',
      '3. 카테고리에 맞는 제시어가 하나 주어집니다.',
      '- 일반 플레이어에게만 개별적으로 제시어를 보여줍니다.',
      '- 라이어에게는 "당신은 라이어입니다"라는 메시지만 전달합니다.',
    ],
  },
  {
    title: '게임 진행',
    content: [
      '4. 차례대로 한 명씩 제시어를 설명합니다.',
      '- 라이어는 제시어를 모른 채 눈치껏 거짓 힌트를 줘야 합니다.',
      '- 일반 플레이어는 라이어에게 들키지 않도록 너무 직설적인 설명을 피해야 합니다.',
    ],
  },
  {
    title: '게임 진행',
    content: [
      '5. 토론 및 투표',
      '- 플레이어들은 표정 및 음성 정보를 활용하여 라이어를 예측합니다.',
      '- 3턴 동안 모두가 설명을 마치면 누가 라이어인지 토론 후 투표를 진행합니다.',
      '- 가장 많은 표를 받은 사람은 라이어로 지목됩니다.',
    ],
  },
  {
    title: '게임 진행',
    content: [
      '6. 투표 결과 공개',
      '마지막 턴에서 투표를 진행하게 됩니다.',
      '',
      '- 라이어가 맞게 지목되었을 경우:',
      '  - 라이어는 제시어를 추측할 기회를 가집니다.',
      '  - 맞히면 라이어의 승리, 틀리면 나머지 사람들의 승리입니다.',
      '',
      '- 라이어가 틀리게 지목되었다면, 라이어가 승리합니다.',
      '',
      '승리한 쪽이 점수를 얻고 다음 라운드로 넘어갑니다.',
    ],
  },
];

const RuleBookPage = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const navigate = useNavigate();

  const handlePrev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNext = () => {
    if (pageIndex < ruleBookData.length - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  // const handleBack = () => {
  //   navigate('/'); // 이전 페이지로 이동
  // };

  const current = ruleBookData[pageIndex];

  return (
    <div className="margin-auto flex justify-center">
      <div className="relative flex w-[800px] items-center justify-center">
        {/* 텍스트 내용 */}
        <div className="flex flex-col gap-4">
          <h2 className="display-small text-point-rulebook1 mb-10">
            {current.title}
          </h2>
          {current.content.map((line, idx) => (
            <p key={idx} className="headline-large whitespace-pre-line">
              {line}
            </p>
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          {pageIndex > 0 && (
            <button onClick={handlePrev} className="p-2">
              <ChevronLeft size={40} color="#f5185b" />
            </button>
            //             <button
            //   onClick={handlePrev}
            //   className="absolute left-2 top-1/2 -translate-y-1/2"
            // >
            //   <div className="w-0 h-0 border-y-8 border-r-12 border-y-transparent border-r-primary-600"></div>
            // </button>
          )}
        </div>

        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          {pageIndex < ruleBookData.length - 1 && (
            <button onClick={handleNext} className="p-2">
              <ChevronRight size={40} color="#f5185b" />
            </button>
          )}
        </div>

        {/* <img
        src="/backIcon.png"
        onClick={handleBack}
        className="absolute bottom-4 right-4 text-primary-600 text-body-small underline"
      >
        뒤로가기
      </img> */}
      </div>
    </div>
  );
};

export default RuleBookPage;
