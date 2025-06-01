import { useReactFlow } from 'reactflow';
import { NODE_WIDTH } from '../workflow-main/const';

export const DraggableNode = ({ type, children, className }) => {
  const { getZoom } = useReactFlow();

  // Handle drag start event
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Set the data that will be used when dropping
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'move';

    // Get the icon element from the children
    const iconElement = e.currentTarget.querySelector('svg');
    const iconHTML = iconElement ? iconElement.outerHTML : '';
    const nodeLabel =
      e.currentTarget.querySelector('span')?.textContent || type;

    // Get current zoom level
    const zoom = getZoom();

    // Base dimensions
    const baseWidth = NODE_WIDTH;
    const baseHeight = 100;
    const baseFontSize = 14;
    // Create a ghost image for dragging
    const ghostElement = document.createElement('div');
    ghostElement.classList.add(
      'flex',
      'items-center',
      'gap-2',
      'bg-indigo-100',
      'p-2',
      'rounded',
      'border',
      'border-indigo-300'
    );
    ghostElement.innerHTML = `
      <div class="flex items-center">
        ${iconHTML}
        <span class="ml-2 text-sm font-medium">New ${nodeLabel} Node</span>
      </div>
    `;
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';

    // Set the ghost element size and scale it according to zoom
    ghostElement.style.width = `${baseWidth * zoom}px`;
    ghostElement.style.height = `${baseHeight * zoom}px`;
    // help me set span font size according to zoom
    const spanElement = ghostElement.querySelector('span');
    spanElement!.style.fontSize = `${Math.floor(baseFontSize * zoom)}px`;
    document.body.appendChild(ghostElement);

    e.dataTransfer.setDragImage(ghostElement, 0, 0);

    // Remove the ghost element after a short delay
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 100);
  };

  return (
    <div
      className={`cursor-grab active:cursor-grabbing ${className} transition-all duration-200`}
      draggable="true"
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
};
