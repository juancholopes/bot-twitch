import { useState, useEffect } from 'react';
import type { Task } from '@bot-twitch/shared/task';

interface AnimatedTaskItemProps {
  task: Task;
  index: number;
}

const AnimatedTaskItem: React.FC<AnimatedTaskItemProps> = ({ task, index }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 50);

    return () => clearTimeout(timer);
  }, [index]);

  if (!task || !isVisible) {
    return null;
  }

  const leftBarColor = task.completed ? '#22c55e' : '#3b82f6';
  const textClasses = task.completed
    ? 'text-white/80 line-through decoration-green-500 decoration-2'
    : 'text-white/95';
  const badgeClasses = task.completed
    ? 'border-green-500/30 bg-green-500/20 text-green-500/90'
    : 'border-white/10 bg-white/10 text-white/60';
  const statusClasses = task.completed
    ? 'bg-green-500 animate-completionPulse'
    : 'bg-blue-500';

  return (
    <div className="relative my-[2px] overflow-hidden rounded-lg px-4 py-2 animate-fadeIn">
      <span
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: leftBarColor }}
      />
      <div className="flex items-center justify-between gap-3">
        <div className={`h-2 w-2 rounded-full ${statusClasses}`} />
        <span
          className={`pointer-events-none flex-1 text-[14px] font-medium leading-[1.4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${textClasses}`}
        >
          {task.text}
        </span>
        <span
          className={`pointer-events-none rounded border px-1.5 py-0.5 text-[11px] uppercase tracking-[0.5px] backdrop-blur-sm ${badgeClasses}`}
        >
          {task.username}
        </span>
      </div>
    </div>
  );
};

export default AnimatedTaskItem;
