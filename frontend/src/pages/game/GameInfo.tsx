interface GameInfoProps {
  round: number;
  turn: number;
  category: string;
  topic: string;
  isLiar: boolean;
}

const GameInfo = ({
  round,
  // turn,
  category,
  topic,
  isLiar,
}: GameInfoProps) => {
  return (
    <div className="flex flex-col space-y-2 mb-4 col-start-1 col-span-2">
      {/* 라운드 */}
      <div className="flex justify-between items-center">
        <div className="text-red-600 text-3xl font-bold">ROUND {round}.</div>
      </div>

      {/* 카테고리, 제시어 */}
      <div className="flex flex-col">
        <div className="text-white text-xl">
          <span className="font-bold">카테고리: </span>
          <span className="ml-2">{category}</span>
        </div>
        <div className="text-white text-xl">
          <span className="font-bold">제시어: </span>
          <span className="ml-2">{isLiar ? '???' : topic}</span>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
