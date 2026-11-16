const S = ({ children, className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>{children}</svg>
);

export const SearchIcon = () => <S><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></S>;
export const HeartIcon = () => <S><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" /></S>;
export const UserIcon = () => <S><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" /></S>;
export const BagIcon = () => <S><path d="M5 8.5h14l-1 11.5H6L5 8.5Z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></S>;
export const CloseIcon = () => <S><path d="m6 6 12 12M18 6 6 18" /></S>;
export const ArrowIcon = () => <S><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const CheckIcon = () => <S><path d="m5 12.5 4.5 4.5L19 7.5" /></S>;
export const MinusIcon = () => <S><path d="M6 12h12" /></S>;
export const PlusIcon = () => <S><path d="M6 12h12M12 6v12" /></S>;
export const StarIcon = () => <S className="fill"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" /></S>;
export const TruckIcon = () => <S><path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></S>;
export const ShieldIcon = () => <S><path d="M12 3 5 5.8v5.7c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V5.8L12 3Z" /><path d="m9 12 2.2 2.2L15.2 10" /></S>;
export const UndoIcon = () => <S><path d="M8 5 4 9l4 4" /><path d="M4 9h10a5.5 5.5 0 0 1 0 11H9" /></S>;
