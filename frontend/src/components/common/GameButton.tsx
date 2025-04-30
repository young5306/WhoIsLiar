interface GameButtonProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const sizeClasses = {
  small: 'px-4 py-1 headline-large text-gray-500 border-gray-500',
  medium: 'px-6 py-2 display-medium text-primary-600 border-primary-600 ',
  large: 'px-8 py-3 display-large text-primary-600 border-primary-600 ',
};

const GameButton = ({ text, size = 'medium', onClick }: GameButtonProps) => {
  return (
    <div className="inline-block p-1 bg-gray-900 rounded-full ">
      <button
        onClick={onClick}
        className={`
          w-full 
          h-full 
          bg-point-button1 
          border-3 
          rounded-full 
          hover:brightness-140
          active:brightness-90
          transition
          cursor-pointer
          ${sizeClasses[size]}
        `}
      >
        {text}
      </button>
    </div>
  );
};

export default GameButton;
