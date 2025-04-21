export type IVarHighlightProps = {
  name: string;
  className?: string;
};
export const varHighlightHTML = ({
  name,
  className = '',
}: IVarHighlightProps) => {
  const html = `<div class="${className} bg-[#155eef] inline-flex mb-2 items-center justify-center px-1 rounded-md h-5 text-xs font-medium text-primary-600">
    <span class='opacity-60'>{{</span>
    <span>${name}</span>
    <span class='opacity-60'>}}</span>
  </div>`;
  return html;
};
