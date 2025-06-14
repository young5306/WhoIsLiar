interface GameButton2Props {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GameButton2 = ({ text, onClick, disabled = false }: GameButton2Props) => {
  return (
    <div className="inline-block p-1 bg-gray-900 rounded-lg w-full">
      <button
        onClick={onClick}
        className={`
          w-full 
          h-full 
          bg-point-button1 
          text-primary-600 
          border-3 border-primary-600 
          rounded-lg
          hover:brightness-140
          active:brightness-90
          transition
          px-6 py-2 display-small
          cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-140 active:brightness-90'}
        `}
      >
        {text}
      </button>
    </div>
  );
};

export default GameButton2;
