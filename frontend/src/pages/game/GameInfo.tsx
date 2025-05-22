interface GameInfoProps {
  round: number;
  totalRoundNumber: number;
  turn: number;
  // category: string;
  topic: string;
  isLiar: boolean;
}

const GameInfo = ({
  round,
  // totalRoundNumber,
  turn,
  // category,
  topic,
  isLiar,
}: GameInfoProps) => {
  return (
    <div className="flex flex-col space-y-1 col-start-1 col-span-2">
      {/* 라운드 */}
      <div className="flex justify-start items-end">
        <div className="text-red-600 text-3xl font-bold">ROUND {round}.</div>
        <span className="text-sm text-red-600 ml-2">TURN {turn} / 3</span>
      </div>

      {/* 카테고리, 제시어 */}
      <div className="flex flex-col">
        {/* <div className="text-white text-xl">
          <span className="font-bold">카테고리: </span>
          <span className="ml-2">{category}</span>
        </div> */}
        <div className="text-white text-xl">
          <span className="font-bold">제시어: </span>
          <span className="ml-2">{isLiar ? '???' : topic}</span>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
