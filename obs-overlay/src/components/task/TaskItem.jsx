import styled from 'styled-components';

const Item = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 16px;
  color: white;
  margin: 5px 0;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const TaskText = styled.span`
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  color: ${props => props.completed ? 'gray' : 'white'};
`;

const TaskItem = ({ task, index, completed }) => {
  return (
    <Item>
      {index + 1}. <TaskText completed={completed}>{task}</TaskText>
    </Item>
  );
};

export default TaskItem;