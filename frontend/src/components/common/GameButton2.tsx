interface GameButton2Props {
  text: string;
  onClick?: () => void;
}

const GameButton2 = ({ text, onClick }: GameButton2Props) => {
  return (
    <div className="inline-block p-1 bg-gray-900 rounded-lg w-full">
      <button
        onClick={onClick}
        className="
          w-full 
          h-full 
          bg-point-button1 
          text-primary-600 
          border-3 border-primary-600 
          rounded-lg
          hover:brightness-140
          active:brightness-90
          transition
          px-6 py-2 display-medium
        "
      >
        {text}
      </button>
    </div>
  );
};

export default GameButton2;
