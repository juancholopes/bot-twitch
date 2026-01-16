import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { Task } from '@bot-twitch/shared/task';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const completionPulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
`;

interface ItemContainerProps {
  completed: boolean;
}

const ItemContainer = styled.div<ItemContainerProps>`
  padding: 8px 16px;
  margin: 2px 0;
  border-radius: 8px;
  animation: ${fadeIn} 0.4s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${props => props.completed ? '#22c55e' : '#3b82f6'};
    transform: scaleY(1);
  }
`;

const TaskContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

interface TaskTextProps {
  completed: boolean;
}

const TaskText = styled.span<TaskTextProps>`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.completed ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  text-decoration-color: #22c55e;
  text-decoration-thickness: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  flex: 1;
  line-height: 1.4;
  pointer-events: none;

  ${props => props.completed && css`
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 2px;
      background: #22c55e;
      transform: scaleX(0);
      transform-origin: left;
      animation: ${keyframes`
        to {
          transform: scaleX(1);
        }
      `} 0.5s ease-out 0.2s forwards;
    }
  `}
`;

interface UserBadgeProps {
  completed: boolean;
}

const UserBadge = styled.span<UserBadgeProps>`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;

  ${props => props.completed && css`
    background: rgba(34, 197, 94, 0.2);
    color: rgba(34, 197, 94, 0.9);
    border-color: rgba(34, 197, 94, 0.3);
  `}
`;

interface StatusIndicatorProps {
  completed: boolean;
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.completed ? '#22c55e' : '#3b82f6'};
  box-shadow: 0 0 0 0 ${props => props.completed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)'};

  ${props => props.completed && css`
    animation: ${completionPulse} 2s infinite;
  `}
`;

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

  return (
    <ItemContainer completed={task.completed}>
      <TaskContent>
        <StatusIndicator completed={task.completed} />
        <TaskText completed={task.completed}>
          {task.text}
        </TaskText>
        <UserBadge completed={task.completed}>
          {task.username}
        </UserBadge>
      </TaskContent>
    </ItemContainer>
  );
};

export default AnimatedTaskItem;
