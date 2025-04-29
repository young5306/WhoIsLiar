interface GameButtonProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const sizeClasses = {
  small: 'px-4 py-1 headline-large',
  medium: 'px-6 py-2 display-medium',
  large: 'px-8 py-3 display-large',
};

const GameButton = ({ text, size = 'medium', onClick }: GameButtonProps) => {
  return (
    <div className="inline-block p-1 bg-gray-900 rounded-full">
      <button
        onClick={onClick}
        className={`
          w-full 
          h-full 
          bg-point-button1 
          text-primary-600 
          border-3 border-primary-600 
          rounded-full 
          hover:brightness-140
          active:brightness-90
          transition
          ${sizeClasses[size]}
        `}
      >
        {text}
      </button>
    </div>
  );
};

export default GameButton;
